import { Graphviz as Graphviz } from '/graphviz-wasm/index.js'

keepWindowSameSize("log")

const databaseName = 'requestAnalyzerDatabase'
const storageName = 'requestDefaultStorage'

async function viz(dot){
  if (Graphviz) {
      const graphviz = await Graphviz.load();
      const svg = graphviz.layout(dot, "svg", "dot");
      document.getElementById("ESM").innerHTML = svg;
  } 
}

//viz(dot)
const headerTxt = `digraph G {
    node [shape=circle];
`
const footerTxt = `}`
 

function getInput(inputId){
  return document.getElementById(inputId)
}

function buildDot(config){
  const initState = config.fsm.init
  let transitionsTxt = ''
  let stateTxt = ''
  let stateObj = {}
  const transitions = config.fsm.transitions
  for(const transition in transitions){
    const item = transitions[transition]
    const fromState = Object.keys(item)[0]
    const toState = item[fromState]['to']
    if(fromState == initState){
      stateObj[fromState] = `${fromState} [ color = red ]`
    }else{
      stateObj[fromState] = `${fromState}`
    }
    if(toState == initState){
      stateObj[toState] = `${toState} [ color = red ]`
    }else{
      stateObj[toState] = `${toState}`
    }
    transitionsTxt += `${fromState} -> ${toState} [ label = "${transition}" ]\n` 
  }
  for(const key in stateObj){
    stateTxt += stateObj[key]+'\n'
  }
  let dot = `${headerTxt} ${stateTxt} ${transitionsTxt} ${footerTxt}`
  //console.log(dot)
  viz(dot)
}


const okButton = getInput("ok")

let config = new reactiveTag("reqeust-analyzer-userscript")

async function bug(){
  await sleep(200)
  buildDot(config.json)
}
bug()

config.notify((obj) => {
  buildDot(obj.json)
  browser.runtime.sendMessage({ action: 'updateUserscript', script: obj._jsonvalue });
})

