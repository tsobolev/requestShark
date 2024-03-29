console.log('background loaded')

function getUpdateBadge(database,storage){
  let counter
  async function getCounter(){
    const db = await db_connect(database)
    const os = await db_transaction(db,storage,"ro")
    const counter = await db_count(os)
    return counter
  }
  getCounter().then((c)=>{
      counter = c
      browser.action.setBadgeText({ text: c.toString() });
  })
  function update(){
    counter += 1
    browser.action.setBadgeText({ text: counter.toString() });
  }
  function reset(){
    counter = 0
    browser.action.setBadgeText({ text: counter.toString() });
  }
  return [update, reset]
}

function getMkb(){
  const port = browser.runtime.connectNative("mkb_driver")
  let isMkbAvailable = false

  port.onDisconnect.addListener((p) => {
    if (p.error) {
      const errmessage = p.error.message
      if(errmessage == 'No such native application mkb_driver'){
        localStorage_set({mkb_driver:false})
        isMkbAvailable = false
      }else{
        console.log(`Disconnected due to an error: ${p.error.message}`);
      }
    }
  })

  async function checkVersion(){
    const result = await mkb({action:"version"})
    localStorage_set({mkb_driver:true,version:result.version})
    isMkbAvailable = true
    console.log('mkb:',result.version)
  }

  checkVersion()

  function mkb(msg){
    return new Promise((resolve)=>{
      port.postMessage(JSON.stringify(msg))
      const responseHandler = (response) =>{
        port.onMessage.removeListener(responseHandler)
        resolve(response)
      }
      port.onMessage.addListener(responseHandler)
    })
  }

  function mkbproxy(msg){
    if(isMkbAvailable){
      return mkb(msg)
    }else{
      return new Promise((resolve)=>{ resolve({"result":"error"})})
    }
  }

  return mkbproxy
}

async function setupContentScripts(){

  const requests = {
    id: "requests",
    js: [
      "/contentjs/requests/request_base.js",
      "/contentjs/requests/request_handlers.js"
    ],
    matches: ["*://*/*"],
    runAt: "document_start",
    allFrames: true
  }

  const fsm = {
    id: "fsm",
    js: [
      "/evdev_input/baseFunct.js",
      "/contentjs/fsm/sharedFunct.js",
      "/contentjs/fsm/mkbHandlers.js",
      "/contentjs/fsm/fakeHandlers.js",
      "/contentjs/fsm/fsm_base.js",
      "/contentjs/fsm/stateHandlers.js"
    ],
    matches: ["*://*/*"],
    runAt: "document_start",
    allFrames: false
  }

  try { await browser.scripting.registerContentScripts([requests,fsm]) } 
  catch (e) { console.error(`failed to register content scripts: ${e}`) }

}

function getJq(){

  async function jqWasmVersion(){
    const version = await jq('','--version')
    console.log(version)
  }

  newJQ({locateFile: () => "jq-wasm/jq.wasm"}).then((jqinstance)=>{
    async function jqf(json,query){
      return await jqinstance.invoke(json, query)
    }
    async function jqf2(json,query){
      return await jqinstance.invoke(JSON.stringify(json),query)
    }
    jq = jqf
    jq2 = jqf2
    //console.log('jq loaded')
    jqWasmVersion()
  })
}

function setupMenu(){
  browser.contextMenus.create({
    id: "resetFsm",
    title: "resetFsm",
    contexts: ["all"]
  });

  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "resetFsm") {
      browser.tabs.sendMessage(tab.id, { action: "resetFsm" })
    }
  });
}

function setupMessageListener(){
  browser.runtime.onMessage.addListener(handleMessage); 
  function handleMessage(request, sender, sendResponse) {
    const f = getOnMessageFunct(request.action)
    if(typeof f === 'function'){
      return f({request:request,sender:sender,sendResponse:sendResponse})
    }else{
      console.error('no function onMessageF_',request.action)
    }
  }
}

let jq
let jq2 
const [updateBadge, resetBadge] = getUpdateBadge(databaseName,storageName)
const mkb = getMkb()
getJq()
setupContentScripts()
setupMenu()
setupMessageListener()
