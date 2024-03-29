keepWindowSameSize("log")

function getEl(inputId){
  return document.getElementById(inputId)
}

async function jq(json,filter){
  const jqresp = await browser.runtime.sendMessage({ action: 'jq', json: json, query: filter})
  return jqresp
}

const resultBox = getEl("resultBox")
const jqFrom = getEl("jqForm")
const jqFilter = getEl("jqFilter")

jqFrom.addEventListener("submit",(e)=>{
  e.preventDefault();
  updateResult(jqFilter.value)  
})
function updateResult(filter){
  getAllData(
    async (data)=>{
      let jsonFiltered
      try{
        jsonFiltered = await jq(data,filter) 
      }catch(e){
        await e
        jsonFiltered = JSON.stringify({error:e.message})
      }
      resultBox.innerHTML = "<pre>"+jsonFiltered+"</pre>"
    },
    databaseName,
    storageLogs,
    false,
    ()=>{})
}

getAllData(
  async (data)=>{
    resultBox.innerHTML = "<pre>"+JSON.stringify(data,undefined,2)+"</pre>"
  },
  databaseName,
  storageLogs,
  false,
  ()=>{})
