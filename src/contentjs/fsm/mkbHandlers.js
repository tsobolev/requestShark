async function handlerUtilsFn_typeReal(args){
  const target = getXY(args)
  const tolerance = [7,7]
  const delay = args.delay
  let str
  if(args.fromstate){
    const jqfilter = args.fromstate.replaceAll("'", '"')
    str = await jqstate(jqfilter)
    str = str.replaceAll('"','' );
  }else{
    str = args.str
  }
  let pos = []

  function mouseHandler(e){
    pos = [e.clientX,e.clientY]
  }

  function isTargetLocation(){
    return (Math.abs(pos[0] - target[0]) < tolerance[0] && Math.abs(pos[1] - target[1]) < tolerance[1])
  }

  document.addEventListener("mousemove",mouseHandler)
  
  await sleep(100)  
  const initialMoveResult = await mouseMoveRel(randomInt([1,3]),randomInt([1,3]))
  await sleep(100)
 
  if(!isTargetLocation()){
    const trajMoveResult = await mouseMoveTraj(target[0]-pos[0],target[1]-pos[1])
  }
  await sleep(100)
  
  document.removeEventListener("mousemove",mouseHandler)

  if(isTargetLocation()){
    const clickResult = await mouseClick()
    await sleep(100)
  }else{
    return { success: false, msg: 'failed to click in target location'}
  }

  const typeResult = await typeString(str,keyboardDict)
  sleep(100)
  

  const enterResult = await enter()
  await sleep(Math.max(delay,100))

  if(enterResult.result == "ok"){
    return { success: true, resultName: "success"}
  }else{
    return { success: false, resultName: "fail"}
  }
}


async function handlerUtilsFn_clearReal(args){
  ///const delay = args.delay
  const target = getXY(args)
  const tolerance = [7,7]
  //const count = args.count
  let pos = []
  function mouseHandler(e){
    //console.log('MM')
    pos = [e.clientX,e.clientY]
  }

  function isTargetLocation(){
    return (Math.abs(pos[0] - target[0]) < tolerance[0] && Math.abs(pos[1] - target[1]) < tolerance[1])
  }

  document.addEventListener("mousemove",mouseHandler)
  
  const initialMoveResult = await mouseMoveRel(randomInt([1,3]),randomInt([1,3]))
  await sleep(100)
 
  if(!isTargetLocation()){
    const trajMoveResult = await mouseMoveTraj(target[0]-pos[0],target[1]-pos[1])
  }

  await sleep(100)

  document.removeEventListener("mousemove",mouseHandler)

  if(isTargetLocation()){
    const clickResult = await mouseClick(3)
    sleep(500)
    const bsResult = await bs(2)
    sleep(100)
    if(bsResult.result == "ok"){
      return { success: true, resultName: "success"}
    }else{
      return { success: false, resultName: "fail"}
    }
  }else{

    return { success: false, msg: 'failed to click in target location'}
  }
}

async function handlerUtilsFn_clickReal(args){
  const delay = args.delay
  const target = getXY(args)
  const tolerance = [5,5]
  let pos = []
  function mouseHandler(e){
    //console.log('MM')
    pos = [e.clientX,e.clientY]
  }

  function isTargetLocation(){
    return (Math.abs(pos[0] - target[0]) < tolerance[0] && Math.abs(pos[1] - target[1]) < tolerance[1])
  }

  document.addEventListener("mousemove",mouseHandler)
  
  const initialMoveResult = await mouseMoveRel(randomInt([1,3]),randomInt([1,3]))
  await sleep(100)
 
  if(!isTargetLocation()){
    const trajMoveResult = await mouseMoveTraj(target[0]-pos[0],target[1]-pos[1])
  }

  await sleep(100)

  document.removeEventListener("mousemove",mouseHandler)

  if(isTargetLocation()){
    const clickResult = await mouseClick()
    await sleep(delay)
    
    return { success: true, resultName: "success" }
  }else{
    return { success: false, resultName: "fail" }
  }
}

async function handlerUtilsFn_scrollReal(args){
  let totalScrolled = 0
  let limit = args.limit
  const scrollStep = async () => {  
    const numScrolls = randomInt(args.numScroll)
    const delay = randomInt(args.delay)
    const pause = randomInt(args.pause)
    const direction = -args.dir
    const startPosition = window.scrollY
    for (let i = 0; i < numScrolls; i++){
      const result = await mouseWheel(0,direction)
      if(result.result != "ok"){
        bglog(result)
      }
      await sleep(delay)
    }
    await sleep(pause)
    const endPosition = window.scrollY
    const scrolled = Math.abs(endPosition - startPosition)
    totalScrolled += scrolled
    const isEndReached = scrolled == 0
    if (!isEndReached){
      if(Math.abs(limit) > 0){
        limit -= 1
        await scrollStep();
      }
    }
  }
  await scrollStep();
  if(totalScrolled > 10){
    return {success: true, resultName: "nonZero", distance:totalScrolled, limit:limit}
  }else{
    return {success: false, resultName: "zero", distabne:0, limit:limit}
  } 
}
