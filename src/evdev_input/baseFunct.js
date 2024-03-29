async function mkb(mkb){
  const result = await browser.runtime.sendMessage({action:"mkb",mkb:mkb})
  return result
}

async function mouseWheel(x,y){
  const result = await mkb({action:"mousewheel",x:x,y:y})
  return result
}

async function mouseClick(count = 1){
  const result = await mkb({action:"click",count:count})
  return result
}

async function loadMkbVariables(){
  const mouseGain = await browser.storage.sync.get("mouseGain")
  if(mouseGain['mouseGain'] != undefined){
    mouseGainX = mouseGain['mouseGain'][0]
    mouseGainY = mouseGain['mouseGain'][1]
  }

  const keyboardDictObj = await browser.storage.sync.get('keyboardDict')
  if(keyboardDictObj['keyboardDict'] != undefined){
    keyboardDict = keyboardDictObj['keyboardDict']
  }
}

async function mouseMoveTraj(x,y){
  const result = await mkb({action:"mousemovetraj",from_point:[0,0],to_point:[x*mouseGainX,y*mouseGainY]})
  return result
}

async function enter(){
  const result = await mkb({action:"enter"})
  return result
}

async function bs(count = 1){
  const result = await mkb({action:"bs",count:count})
  return result
}

async function mouseMoveRel(x,y){
  const result = await mkb({action:"mousemove",x:x*mouseGainY,y:y*mouseGainY})
  return result
}

async function switch_keymap(){
  await mkb({action:"switch_keymap"})
}

async function typeString(str,dict){
  let switchkeymapCounter = 0
  const list = str.split('')
  function pushCode(i){
      keycodes.push(dict[list[i]].key)
      press.push(randomInt([2,7]))
      delay.push(randomInt([2,7]))
      shift.push(dict[list[i]].shift)
  }
  function resetPacket(){
    keycodes = []
    press = []
    delay = []
    shift = []
    packet = {action:"sequence",keycodes:keycodes,press:press,delay:delay,shift:shift}
  }
  async function sendPacket(){
    const mkbResult = await mkb(packet)
    //console.log(packet)
    resetPacket()
    return mkbResult
  }
  async function sleep(delay){
    return new Promise((resolve)=>{
      setTimeout(resolve,delay)
    })
  }
  let curkeymap = 0
  let keycodes = []
  let press = []
  let delay = []
  let shift = []
  let packet = {action:"sequence",keycodes:keycodes,press:press,delay:delay,shift:shift}

  for (const i in list){
    if (list[i] in dict){
      if (dict[list[i]].keymap == curkeymap){
        pushCode(i)
      }else{
        if(keycodes.length != 0){ 
          const sendPacketResult = await sendPacket()
          if(sendPacketResult.result != "ok"){
            return { result: "error" }
          }
        }
        await switch_keymap()
        switchkeymapCounter += 1
        await sleep(200)
        curkeymap = (curkeymap == 0) ? 1:0;
        pushCode(i)
      }
    }
  }
  if(keycodes.length != 0){
    const sendPacketResult = await sendPacket()
    if(sendPacketResult.result != "ok"){
      return { result: "error" }
    }
  }
  if(switchkeymapCounter % 2 > 0){
    await switch_keymap()
  }
  return { result: "ok" }
}

async function relMouseMove(x,y,rx=1,ry=1){
  await mkb({action:"mousemove",x:x*rx,y:y*ry})
}

async function keySeq(shift){

  function range(a,b){
    let array = [];
    for (var i = a; i < b; i++) {
        array.push(i);
    }
    return array
  }

  const keys = range(1,254)
  const pa = new Array(keys.length).fill(1)
  const shft = new Array(keys.length).fill(shift)
  const actualKeys = await mkb({action:"sequence","keycodes":keys,"press":pa,"delay":pa,"shift":shft})
  return actualKeys
}

let mouseGainX 
let mouseGainY
let keyboardDict

loadMkbVariables()
