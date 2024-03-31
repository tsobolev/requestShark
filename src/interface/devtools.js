console.log('devtools.js')
// request_handlers.js 
async function handlerFn_save(fullResponse,args){
  return await browser.runtime.sendMessage({ action: 'request_save', data: fullResponse, args: args})
}

async function handlerFn_set(fullResponse,args){
  return await browser.runtime.sendMessage({ action: 'request_set', data: fullResponse, args: args})
}

async function handlerFn_saveraw(fullResponse,args){
  return await browser.runtime.sendMessage({ action: 'request_saveraw', data: fullResponse, args: args})
}

const handlersObj = {
"handlerFn_save":handlerFn_save,
"handlerFn_set":handlerFn_set,
"handlerFn_saveraw":handlerFn_saveraw
}


// request_base.js


async function bglog(message){
    return await browser.runtime.sendMessage({ action: 'log', data: message});
}

async function bgmsg(msg){
  return await browser.runtime.sendMessage(msg)
}

async function jqstate(condition){
  return await bgmsg({action: 'jqstate', query: condition})
}

async function jqlookup(condition){
  return await bgmsg({ action: 'jqlookup', query: condition})
}

async function jqlookupset(condition){
  return await bgmsg({ action: 'jqlookupset', query: condition})
}

function fromatHeaders(headers){
  const arr = headers.trim().split(/[\r\n]+/);
  const headerMap = {};
  arr.forEach((line) => {
    const parts = line.split(": ");
    const header = parts.shift();
    const value = parts.join(": ");
    headerMap[header] = value;
  });
  return headerMap
}

function getUrlParams(urlObj){
  const paramsObj = {};
  try {
    urlObj.searchParams.forEach((value, key) => {
      paramsObj[key] = JSON.parse(value);
    });
  }catch{
    bglog('search param parsing failed')
  }
  return paramsObj
}

async function reloadRequestHandlers(config){

  let regexHandlers

  function urlFilterF(url){
    for (const { regex, handler } of regexHandlers) {
      if (regex.test(url)) {
        return { "isURL": true, "urlHandler": handler }
      }
    }
    return { "isURL": false, "urlHandler": null }
  }

  function parseHandlers(inputObj){

    function getHandler(input){
      const handlerFnName = "handlerFn_"+input
      const handlerFunction = (window[handlerFnName] === 'function')? window[handlerFnName]:handlersObj[handlerFnName]
      if (typeof handlerFunction === 'function') {
        return handlerFunction
      }else{
        //console.log('handler function not found')
        bglog(['handler function not found',handlerFnName])
        return function(){
          //do nothing
        }
      }
    }

    let output = []
    //const inputObj = JSON.parse(input)
    const requests = inputObj.requests
    for ( const {regex, handler, enable } of requests) {
      if(enable){
        const regexR = new RegExp(regex)
        let handlers = []
        if(typeof(handler) === 'object' && !Array.isArray(handler)){
          const handlerF = getHandler(handler.fn)
          const args = handler.args
          const handlerWargs = function(data){
            handlerF(data,args)
          }
          handlers.push(handlerWargs)  
        }else if(Array.isArray(handler)){
          for (const onehandler of handler){
            const handlerF = getHandler(onehandler.fn)
            const args = onehandler.args
            const handlerWargs = function(data){
              handlerF(data,args)
            }
            handlers.push(handlerWargs)
          }
        }
        output.push({ regex: regexR, handler: handlers })
      }
    }
    return output
  }

  if(config != undefined){
    regexHandlers = parseHandlers(config)
    return urlFilterF
  }else{
    const userScript = await browser.runtime.sendMessage({action: "getConfigObject"})
    regexHandlers = parseHandlers(userScript)
    return urlFilterF
  }
}

let urlFilter

reloadRequestHandlers().then((F)=>{
  urlFilter = F
})

// patchFetchF()
// patchXhrF()

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateUserscript') {
    reloadRequestHandlers(JSON.parse(request.script)).then((F)=>{
      urlFilter = F
    })
  }
})

// devtools.js
function formatHeadersDevtools(headers){
  const headerMap = {}
  headers.forEach((line) => {
    headerMap[line['name']] = line['value']
  })
  return headerMap
}
function replaceInQuotedString(text,a,b) {
    const regex = /("[^"\\]*(?:\\.[^"\\]*)*")/g;
    const replacedText = text.replace(regex, function(match) {
        return match.replace(a, b);
    });
    return replacedText;
}

function handleRequestFinished(obj) {
  const url = obj.request.url
  const handler = urlFilter(url)
  if(handler.isURL){
    const queryString = obj.request.queryString
    const urlObj = new URL(url)
    const paramsObj = getUrlParams(urlObj)
    const postData = obj.request.postData
    if(postData !== undefined){
      try{
        postData.text = JSON.parse(postData.text)
      }catch(e){
        console.log('postData.text json parsing failed',e)
      }
    }
    obj.getContent().then(([body, mimeType]) => {
      let parsingError = false
      
      try{ body = JSON.parse(body) }catch(e){ parsingError = true; }
      if(parsingError){ try{ body = JSON.parse(atob(body)); parsingError = false } catch(e){ parsingError = true } }

      if(parsingError){
        console.log('devtools.netmonitor.responseBodyLimit ???',obj)
      }

      for (const fn of handler.urlHandler){
        fn({ 
          "source": "devtools",
          "devtools": {
            "serverIPAddress":obj.serverIPAddress,
            "startedDateTime":obj.startedDateTime,
            "time":obj.time,
            "timings":obj.timings
          },
          "request":{
            "url": url, 
            "pathname": urlObj.pathname, 
            "origin": urlObj.origin, 
            "getParams": formatHeadersDevtools(queryString),
            "postParams": postData
          },
          "response":{
            "datetime": Date.now(),
            "status": obj.response.status,
            "headers": formatHeadersDevtools(obj.response.headers), 
            "body": body
        }})
      }
    })
  }
}


async function localStorage_get(name){
  const result = await browser.storage.sync.get(name)
  return result[name]
}
async function localStorage_set(obj){
  await browser.storage.sync.set(obj)
}
async function isMonkeyPatch(){
  const isMonkeyPatch = await localStorage_get("isMonkeyPatch")
  if(!isMonkeyPatch){
    browser.devtools.network.onRequestFinished.addListener(handleRequestFinished);
    bglog('devtools capture')
  }
}
isMonkeyPatch()
