keepWindowSameSize("database")

function getEl(inputId){
  return document.getElementById(inputId)
}

async function jq(json,filter){
  const jqresp = await browser.runtime.sendMessage({ action: 'jq', json: json, query: filter})
  return jqresp
}

const resultBox = getEl("resultBox")
const jqForm = getEl("jqForm")
const jqFilter = getEl("jqFilter")
const packetInput = getEl("packet")

jqForm.addEventListener("submit",(e)=>{
  e.preventDefault();
  updateResult(jqFilter.innerText.replaceAll("'",'"'))  
})


async function updateResult(filter){
  const stateObject = await browser.runtime.sendMessage({ action: 'getStateObject' })
  const packetNum = packetInput.value

  let jsonFiltered
  try{
    if(packetNum != "" && packetNum >= 0){
      const data = await db_getAllDefault()
      jsonFiltered = await jq({...{state:stateObject},...{packet:data[packetNum]}},filter) 
    }else{
      const data = await db_getAllDefault()
      jsonFiltered = await jq({...{state:stateObject},...{database:data}},filter) 
    }
  }catch(e){
    await e
    jsonFiltered = JSON.stringify({error:e.message})
  }

  resultBox.innerText = jsonFiltered
}
