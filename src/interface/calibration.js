async function calibration(){

  let dict = {}

  function mapKeysToDict(keys,result,shift,keymap){
    let dict_part = {}
    for (let i = 0; i < keys.length; i++){
      dict_part[result[i]] = {key:keys[i],shift:shift,keymap:keymap}
    }
    return dict_part
  }

  async function genKeyMap(shift,keymap){
    const keys = await keySeq(shift)
    const result = calibrationArea.value.split('')
    calibrationArea.value = ''
    return mapKeysToDict(keys.keys,result,shift,keymap)
  }

  let mouseX
  let mouseY

  function mouseHandler(e){
    mouseX = e.clientX
    mouseY = e.clientY
  }

  const calibrationPhrase = calibrationArea.value
  calibrationArea.value = "Don't touch keyboard or mouse during calibration!"
  await sleep(2000)
  calibrationArea.value = '' 

  async function calibrateMouse(moveX=0,moveY=0,rx=1,ry=1){
    document.addEventListener("mousemove",mouseHandler)

    const width = window.innerWidth
    || document.documentElement.clientWidth
    || document.body.clientWidth;

    const height = window.innerHeight
    || document.documentElement.clientHeight
    || document.body.clientHeight;
    
    await relMouseMove(1,1,rx,ry)
    await relMouseMove(-1,-1,rx,ry)
    await sleep(100)
    const initX = mouseX
    const initY = mouseY
    if(moveX == 0 || moveY == 0){
      moveX = width - initX - 11
      moveY = height - initY - 11 
    }
    await relMouseMove(moveX-1,moveY-1,rx,ry)
    await relMouseMove(1,1,rx,ry)
    await sleep(100)
    const resultX = mouseX
    const resultY = mouseY
    const diffX = resultX-initX
    const diffY = resultY-initY
    const ratioX = moveX/diffX
    const ratioY = moveY/diffY
    
    document.removeEventListener("mousemove",mouseHandler)
    await relMouseMove(-moveX,-moveY,rx,ry)
    return [ratioX,ratioY]
  }

  [rx,ry] = await calibrateMouse()
  const [check_rx,check_ry] = await calibrateMouse(0,0,rx,ry)
  if(Math.abs(check_rx-1) < 0.0025 && Math.abs(check_ry-1) < 0.0025){
    await console.log('mouse position correct')

    let obj = {}
    obj['mouseGain'] = [rx,ry]
    browser.storage.sync.set(obj) 
  }

  async function rightBottomCorner(){
    document.addEventListener("mousemove",mouseHandler)

    await relMouseMove(1,1)
    await relMouseMove(-1,-1)
    await sleep(100)
    const initX = mouseX
    const initY = mouseY

    await relMouseMove(10000,10000,rx,ry)
    let search = 0
    const step = 100
    while (true){
      search -= step
      await relMouseMove(-step,-step,rx,ry)
      await sleep(100)
      if(initX != mouseX || initY != mouseY) break
    }
    //console.log('right corner xy:',mouseX+step,mouseY+step)
    document.removeEventListener("mousemove",mouseHandler)

    await relMouseMove(-(mouseX-initX),-(mouseY-initY),rx,ry)
    await sleep(1000)
    
    return [mouseX+step,mouseY+step] 
  }
  const [ax,ay] = await rightBottomCorner()

  await relMouseMove(0,50)
  await mouseClick()

  const en0 = await genKeyMap(0,0)
  const en1 = await genKeyMap(1,0)

  await switch_keymap()

  const second0 = await genKeyMap(0,1)
  const second1 = await genKeyMap(1,1)

  await switch_keymap()

  dict = {
    ...second1,
    ...second0,
    ...en1,
    ...en0
  }

  await typeString(calibrationPhrase,dict)

  if(calibrationArea.value == calibrationPhrase){
    console.log('keyboard correct')
    
    let obj = {}
    obj['keyboardDict'] = dict
    browser.storage.sync.set(obj) 
  }else{
    console.log(calibrationArea.value);
    console.log(calibrationPhrase)
  }

  const startPosition = window.scrollY
  const scrollresult = await mouseWheel(0,-1)
  await new Promise(resolve => setTimeout(resolve, 400));
  const endPosition = window.scrollY
  const scrolled = Math.abs(endPosition - startPosition)

  if(scrolled != 0){
    console.log('scroll correct:',scrolled)
    let obj = {}
    obj['mouseScrollDist'] = scrolled
    browser.storage.sync.set(obj)
  }

  await sleep(500)
  document.write('Calibration complete! Please, reload the page after calibration.')

  return dict
}

async function mouseWithFeedback(target){
  let start = []
  let pos = [0,0]
  let addlast = 0
  document.addEventListener("mousemove",mouseHandler)

  await relMouseMove(1,1)
  let time = performance.now()
  let prev_error = [0,0]
  let integral = [0,0]
  setTimeout(pid,100)

  function getRandomInteger(min, max) {
   return Math.floor(Math.random() * (max - min + 1) + min);
  }
  function mouseHandler(e){
    pos = (e) ? [e.clientX,e.clientY]:pos
    start = (start[0] === undefined) ? pos : start
  }

  function pid(){
    const error = [target[0]-pos[0],target[1]-pos[1]]
    const nowtime = performance.now()
    const time_diff = nowtime - time
    time = nowtime
    const dt = (time_diff > 1 && time_diff < 50) ? time_diff:50  
    const [P,I,D] = [0.15,0.05,0.002]

    const ediff = [prev_error[0]-error[0],prev_error[1]-error[1]]
    prev_error = [error[0],error[1]]

    const iupdate = [integral[0] + error[0] * I,integral[1] + error[1] * I] 
    integral[0] = (Math.abs(iupdate[0]) < 5) ? iupdate[0] : integral[0]
    integral[1] = (Math.abs(iupdate[1]) < 5) ? iupdate[1] : integral[1]

    const XP = (error[0]*P)
    const YP = (error[1]*P)

    const XI = (integral[0])
    const YI = (integral[1])

    const XD = ((ediff[0]*D)/(dt/1000))
    const YD = ((ediff[1]*D)/(dt/1000))

    const x = XP+XI+XD
    const y = YP+YI+YD

    const halfPath = Math.abs(target[0] - start[0])/2
    const halfPos = Math.abs(pos[0]-start[0]-halfPath)
    const cosTh = Math.cos(Math.PI/(180/80))
    const r0 = halfPath/cosTh 
    const h0 = Math.sqrt(Math.pow(r0,2)-Math.pow(halfPath,2))
    const r1 = Math.sqrt(Math.pow(r0,2)-Math.pow(halfPos,2))
    //const z1 = Math.sqrt(Math.pow(r1,2)-Math.pow(halfPos,2))
    const addnew = r1-h0 
    const add = addnew-addlast
    addlast = addnew
    console.log(error,add)
    relMouseMove(x,y+add,rx,ry)

    if(Math.abs(error[0]) > 5 || Math.abs(error[1]) > 5){
      setTimeout(pid,30)
    }
  }
}

function getInput(inputId){
  return document.getElementById(inputId)
}

async function sleep(delay){
  return new Promise((resolve)=>{
    setTimeout(resolve,delay)
  })
}


function getRandomInteger(min, max) {
 return Math.floor(Math.random() * (max - min + 1) + min);
}

function randomInt(arr){
  const min = arr[0]
  const max = arr[1]
  return getRandomInteger(min,max)
}

const startButton = getInput("start")
const calibrationArea = getInput("calibrationArea")

startButton.addEventListener("click", ()=>{
  calibration()
})



