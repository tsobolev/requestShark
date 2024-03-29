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
/*
async function jq(json,filter){
  return await bgmsg({ action: 'jq', json: json, query: filter})
}
*/
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

function patchFetchF(){

  const originalFetch = window.wrappedJSObject.fetch

  function saveFetchRespone(url,response){
    const handler = urlFilter(url)
    if(handler.isURL){
      const urlObj = new URL(url)
      const paramsObj = getUrlParams(urlObj)
      response.text().then(body => { 
        try{
          body = JSON.parse(body)
        }catch{
          bglog('body json parsing failed')
        }
        for (const fn of handler.urlHandler){
          fn({ 
            "source": "fetch",
            "request":{
              "url": url, 
              "pathname": urlObj.pathname, 
              "origin": urlObj.origin, 
              "getParams": paramsObj,
              "postParams": "",
            },
            "response":{
              "datetime": Date.now(),
              "status": "",
              "headers": "", 
              "body": body
          }})
        }
      })
    }
  }

  function patchedFetch(...args){
    let [resource, config] = args;
    const promise = new window.Promise((resolve) => {
      let fetchpromise = originalFetch(resource,config)
      fetchpromise.then(cloneInto(function(response){
        saveFetchRespone(resource,response.clone()) 
        resolve(response)
      },window.wrappedJSObject, { cloneFunctions: true}))
    });
    return promise 
  }

  window.wrappedJSObject.fetch = cloneInto(patchedFetch, window.wrappedJSObject, { cloneFunctions: true });
}

function patchXhrF(){

  function saveXhrResponse(xhrInstance,postParams) {
    const url = xhrInstance.responseURL
    const handler = urlFilter(url)

    if (handler.isURL && xhrInstance.readyState == 4){ // && xhrInstance.responseType == (""|"text")
      const headerMap = fromatHeaders(xhrInstance.getAllResponseHeaders());
      const urlObj = new URL(url)
      const paramsObj = getUrlParams(urlObj)
      let body = xhrInstance.responseText
      try{
        body = JSON.parse(body)
      }catch{
        bglog('body json parsing failed')
      }
      try{
        postParams = JSON.parse(postParams) 
      }catch{
        bglog('postParams json parsing failed')
      }

      for (const fn of handler.urlHandler){
        fn({
        "source": "XHR",
        "request":{
          "url": url, 
          "pathname": urlObj.pathname, 
          "origin": urlObj.origin, 
          "getParams": paramsObj,
          "postParams": postParams,
        },
        "response":{
          "datetime": Date.now(),
          "status": xhrInstance.status,
          "headers": headerMap, 
          "body": body 
        }})
      }
    }
  }

  const origSend = window.wrappedJSObject.XMLHttpRequest.prototype.send;

  window.wrappedJSObject.XMLHttpRequest.prototype.send = cloneInto(function(data){
    const rsc = this.onreadystatechange;
    if (rsc) {
      this.onreadystatechange = function() {
        saveXhrResponse(this,data)
        return rsc.apply(this);
      }
    }
    const onload = this.onload;
    if (onload) {
      this.onload = function() {
        saveXhrResponse(this,data)
        return onload.apply(this);
      }
    }
    return origSend.apply(this,cloneInto([data],window.wrappedJSObject))
  }, window.wrappedJSObject, { cloneFunctions: true } )
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
      const handlerFunction = this[handlerFnName]
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

patchFetchF()
patchXhrF()

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateUserscript') {
    reloadRequestHandlers(JSON.parse(request.script)).then((F)=>{
      urlFilter = F
    })
  }
})
