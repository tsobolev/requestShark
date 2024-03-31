async function msgLastActiveTab(msg){
  const id = await localStorage_get("lastActiveTab")
  browser.tabs.sendMessage(id,msg)
}

async function getConfigObject(){
  const config = await loadConfig()
  const userscript = JSON.parse(config)
  return userscript
}

async function getStateObject(){
  return await localStorage_get("persistentStateObject")
}

async function resetStateObject(){
  const userscript = await getConfigObject()
  const stateObject = userscript.variables
  await localStorage_set({"persistentStateObject":stateObject})
  return stateObject
}

async function updateStateObject(new_state){
  const userscript = await getConfigObject()
  const oldStateObejct = await getStateObject()
  const stateObject = {
   ...userscript.variables,
   ...oldStateObejct,
   ...new_state
  }
  await localStorage_set({"persistentStateObject":stateObject})
  try {
    await browser.runtime.sendMessage({action:"stateObjectUpdated", state: stateObject})
  }catch(e){ /* it's ok. just state window not listen. */ }
  return stateObject
}

function getOnMessageFunct(input){
  const handlerFn = "onMessageF_"+input
  if (window.hasOwnProperty(handlerFn) && typeof window[handlerFn] === 'function'){
    return window[handlerFn]
  }else{
    console.log(['onMessage handler function not found',handlerFn])
  }
}

function onMessageF_updateUserscript(args){
  const {request,sender,sendResponse} = args
  msgLastActiveTab({ action: 'updateUserscript', script: request.script })
}

function onMessageF_visibilitychange(args){
  const {request,sender,sendResponse} = args
  if(request.state == 'visible') localStorage_set({"lastActiveTab":sender.tab.id})
}

function onMessageF_subscribe(args){
  const {request,sender,sendResponse} = args
  localStorage_set({"lastActiveTab":sender.tab.id})  
}

function onMessageF_unsubscribe(args){
  const {request,sender,sendResponse} = args
  localStorage_set({"lastActiveTab":undefined})
}

function onMessageF_updateStateObject(args){
  const {request,sender,sendResponse} = args
  return updateStateObject(request.state)
}

function onMessageF_getStateObject(args){
  const {request,sender,sendResponse} = args
  return getStateObject()
}

function onMessageF_resetStateObject(args){
  const {request,sender,sendResponse} = args
  return resetStateObject()
}

function onMessageF_getConfigObject(args){
  const {request,sender,sendResponse} = args
  return getConfigObject()
}

function onMessageF_resetBadge(args){
  const {request,sender,sendResponse} = args
  resetBadge()
}

function onMessageF_log(args){
  const {request,sender,sendResponse} = args
  console.log(request.data)
}

function onMessageF_jq(args){
  const {request,sender,sendResponse} = args
  return jq2(request.json, request.query)
}
/*
function onMessageF_setState(args){
  const {request,sender,sendResponse} = args
  return updateStateObjectWithJq(request.json, request.query)
}
*/
function onMessageF_jqstate(args){
  const {request,sender,sendResponse} = args
  async function jqstate(query){
    try{
      const stateObject = await getStateObject()
      const result = await jq2(stateObject, query)
      return result
    }catch(e){
      console.error('state',e)
    }
  }
  return jqstate(request.query)
}

function onMessageF_jqlookup(args){
  const {request,sender,sendResponse} = args
  async function jqlookup(filter){
    try{
      const stateObject = await getStateObject()
      const database = await db_getAllDefault()
      const result = await jq2({state:stateObject,database:database}, filter)
      return result
    }catch(e){
      console.error('lookup',e)
    }
  }
  return jqlookup(request.query)
}

function onMessageF_jqlookupset(args){
  const {request,sender,sendResponse} = args
  async function jqlookupset(filter){
    try{
      const stateObject = await getStateObject()
      const database = await db_getAllDefault()
      const result = await jq2({state:stateObject,database:database}, filter)
      const new_state = JSON.parse(result)
      const update_result = await updateStateObject(new_state)
      return update_result
    }catch(e){
      console.error('lookup_set',e.message)
    }
  }
  return jqlookupset(request.query)
}

function onMessageF_mkb(args){
  const {request,sender,sendResponse} = args
  return mkb(request.mkb)
}


async function onMessageF_request_saveraw(args){
  const {request,sender,sendResponse} = args
  const data = request.data 
  if(typeof(data) != 'object') data = [data]
  await saveRecord(data)
  updateBadge()
}


function onMessageF_logs(args){
  const {request,sender,sendResponse} = args
  //storeData(request.payload,storageLogs,databaseName)
}

function onMessageF_request_save(args){
  const {request,sender,sendResponse} = args
  async function request_save(fullResponse,args){
    try{
      let check = "true"
      if(args.condition){
        const condition = args.condition.replaceAll("'", '"');
        check = await jq2(fullResponse,condition)
      }
      if(check === "true" || check == true){
        const filter = args.filter.replaceAll("'", '"');
        const jqresp = await jq2(fullResponse,filter) 
        const jqrespObj = JSON.parse(jqresp)

        await saveRecord(jqrespObj)
        updateBadge()
      }
    }catch(e){
      console.error('request_save',e.message)
    }
  }
  return request_save(request.data,request.args)
}

function onMessageF_request_set(args){
  const {request,sender,sendResponse} = args
  async function updateStateObjectWithJq(json,query){
    const stateObject = await getStateObject()
    const jqresp = await jq2({ state: stateObject, ...json }, query)
    let newState
    try{ newState = updateStateObject(JSON.parse(jqresp)) }
    catch(e){
      console.log('set request output json fail')
      newState = stateObject
    }
    return newState
  }
  async function request_set(fullResponse,args){
    try{
      let check = "true"
      if(args.condition){
        const condition = args.condition.replaceAll("'", '"');
        check = await jq2(fullResponse,condition)
      }
      if(check === "true" || check == true){
        const filter = args.filter.replaceAll("'", '"');
        await updateStateObjectWithJq({packet:fullResponse},filter)
      }
    }catch(e){
      console.error('request_set: ',e.message)
    }
  }
  return request_set(request.data,request.args)
}
