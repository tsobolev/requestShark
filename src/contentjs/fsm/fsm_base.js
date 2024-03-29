async function handleFsmEvent(eventName){

  function getHandlerUtils(input){
    const handlerFnName = "handlerUtilsFn_"+input
    const handlerFunction = this[handlerFnName]
    if (typeof handlerFunction === 'function') {
      return handlerFunction
    }else{
      //browser.runtime.sendMessage({ action: 'log', data: ['handler function not found',handlerFnName] });
      bglog(['handlerUtilsFn_',handlerFnName,'not found'])
      return function(){
        //do nothing
      }
    }
  }

  bglog(['event:',eventName,'state:',fsm.state])
  //try{
  let transition
  if(fsm.transitions[eventName]){
    if(fsm.transitions[eventName][fsm.state]){
      transition = fsm.transitions[eventName][fsm.state]
    }else{
      //console.log('innter return')
      return
    }
  }else{
    //console.log('outer return')
    return
  }
  let transition_fn
  if(transition.handler){
    transition_fn = getHandlerUtils(transition.handler.fn)
  }
  fsm.state = transition.to
  bglog(['fsm state changed',fsm.state])
  if(transition.handler){
    const fnResult = await transition_fn(transition.handler.args)
    if(fnResult != undefined){
      bglog([`task ${transition.handler.fn} finished:`, fnResult])
      let isEventMatched = false
      //Look for resultName events 
      for(const resultName in transition.handler.results){
        const resultEvent = transition.handler.results[resultName]
        try{
          if(fnResult.resultName == resultName){
            handleFsmEvent(resultEvent)
            isEventMatched = true
          }
        }catch(e){
          bglog(['no resultName',resultName,'in',fnResult,e.message])
        }
      }

      if(!isEventMatched){
        if(transition.handler.results['default']){
          handleFsmEvent(transition.handler.results['default'])
        }else{
          handleFsmEvent('exception')
        }
      }
    }else{
      bglog(['no Fn:',transition.handler.fn])
    }
    //if(result.success) handleFsmEvent(transition.handler.success)
    //else handleFsmEvent(transition.handler.error)
  }
  //}catch{
  //  bglog(['transition not defined for event ',eventName,' current state ',fsm.state])
  //}
}

function initFsmHandlers(){

  function updateFsm(config){
    if(fsm.state != undefined){
      const state = fsm.state
      fsm = config
      fsm.state = state
    }else{
      fsm = config
    }
  }

  function resetFsmState(){
    fsm.state = fsm.init
  }

  function subscribe(){
    bgmsg({action:"subscribe"})
    window.addEventListener("beforeunload", (event) => {
      bgmsg({action:"unsubscribe"})
    });
  }

  function reportVisibility(){
    document.addEventListener("visibilitychange", () => {
      bgmsg({ action: "visibilitychange", state: document.visibilityState})  
    })
    bgmsg({ action: "visibilitychange", state: document.visibilityState})  
  }

  function handleBgMessage(request, sender, sendResponse) {
    if (request.action === 'event') {
      handleFsmEvent(request.event)
    }
    if (request.action === 'updateUserscript') {
      const userScript = JSON.parse(request.script)
      updateFsm(userScript.fsm)
    }
    if (request.action === 'resetFsm') {
      resetFsmState()
    }
  } 
  browser.runtime.onMessage.addListener(handleBgMessage);

  bgmsg({ action: "getConfigObject"}).then((userScript)=>{
    updateFsm(userScript.fsm)
  })

  subscribe()
  reportVisibility() 
}

let fsm = {}

initFsmHandlers()
