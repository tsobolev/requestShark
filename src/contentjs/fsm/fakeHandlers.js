async function handlerUtilsFn_clickFake(args){
  const delay = args.delay
  const [x,y] = getXY(args)
  const el = document.elementFromPoint(x, y)
  await el.click()
  await new Promise(resolve => setTimeout(resolve, delay));
  return { success: true, resultName: "success" }
}

async function handlerUtilsFn_typeFake(args){
  const [x,y] = getXY(args)
  let str
  if(args.fromstate){
    const jqfilter = args.fromstate.replaceAll("'", '"')
    str = await jqstate(jqfilter)
    str = str.replaceAll('"','' );
  }else{
    str = args.str
  }

  const el = document.elementFromPoint(x, y)
  const delay = args.delay
  await el.click()
  await el.focus()
  await sendStringAsKeyEvents(el,str)
  const enterResult = await sendEnterKey(el)
  await sleep(delay)
  if(enterResult){
    const form = el.form
    const submitEvent = new Event("submit", { cancelable: true });
    form.dispatchEvent(submitEvent)
    return { success: true, resultName: "success" }
  }else{
    return { success: false, resultName: "fail"}
  }
}

async function handlerUtilsFn_clearFake(args){
  const [x,y] = getXY(args)
  const el = document.elementFromPoint(x, y)
  const delay = args.delay
  await el.click()
  await el.focus()
  el.value = ''
  el.innerText = ''
  await sleep(delay)
  return { success: true, resultName: "success" }
}

async function mouseWheelFake(x,y){
  window.scrollBy(0,y*114)
  return {result:"ok"}
}

async function handlerUtilsFn_scrollFake(args) {
  let totalScrolled = 0
  let limit = args.limit
  const scrollStep = async () => {  
    const numScrolls = randomInt(args.numScroll)
    const delay = randomInt(args.delay)
    const pause = randomInt(args.pause)
    const direction = args.dir
    const startPosition = window.scrollY
    for (let i = 0; i < numScrolls; i++){
      const result = await mouseWheelFake(0,direction)
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
function getRandomInteger(min, max) {
 return Math.floor(Math.random() * (max - min + 1) + min);
}

function randomInt(arr){
  const min = arr[0]
  const max = arr[1]
  return getRandomInteger(min,max)
}

async function handlerUtilsFn_randomInteger(args){
  const min = args.random[0]
  const max = args.random[1]
  return getRandomInteger(min,max)
}

function handlerUtilsFn_scrollToBottomMy(args) {
  let result_checker = function(){ return "scrolling"}
  if(result_checker() == "scrolling"){
    console.log('scrolling')
    setTimeout(function(){
      result_checker = handlerUtilsFn_oneRandomScrollStep()
    },args.delay)
  }else{
    console.log('scroll_finish')
  }
}


async function sendStringAsKeyEvents(inputElement, str) {

  for (var i = 0; i < str.length; i++) {
      var event = new KeyboardEvent('keydown', {
          bubbles: true,
          key: str[i],
          code: str.charCodeAt(i),
      });
      inputElement.dispatchEvent(event);
      inputElement.value = inputElement.value + str[i]
      let delay
      if(str[i] == " ") delay = 300;
      else delay = 80;
      await new Promise(resolve => setTimeout(resolve, delay));
  }
}
async function sendEnterKey(inputElement) {
  try{
    var event = new KeyboardEvent('keydown', {
        bubbles: true,
        key: 'Enter',
        code: 'Enter',
    });
    const formElement = inputElement.form
    formElement.dispatchEvent(event);
    return true
  }catch{
    return false
  }
  //formElement.dispatchEvent(new Event('submit'));
}
