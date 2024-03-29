keepWindowSameSize("state")

function getEl(inputId){
  return document.getElementById(inputId)
}

const container = getEl('stateContainer')
const resetState = getEl('resetState')

resetState.addEventListener("click",async ()=>{
  await browser.runtime.sendMessage({action:"resetStateObject"})
  await getStateObject()
})

//let stateObject = {}
async function getStateObject(){
  const stateObject = await browser.runtime.sendMessage({ action: 'getStateObject' })
  container.innerText = JSON.stringify(stateObject,undefined,2)
}

getStateObject()

browser.runtime.onMessage.addListener(handleMessage); 
function handleMessage(request, sender, sendResponse) {
  if (request.action === 'stateObjectUpdated') {
    container.innerText = JSON.stringify(request.state,undefined,2)
  }
}
