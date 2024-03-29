class reactiveTag {
  constructor(elementId){
    this.elementId = elementId
    this.inputElement = document.getElementById(elementId)
    this._value = this.inputElement.innerText
    this._jsonvalue = prepareToSaveJson(this._value)
    this._onchangeCallback = () => {
      console.log('correct!')
    }
    loadConfig().then((config)=>{
        //this._value = config
        //this._value = replaceInQuotedString(this._value,/\\\\\(/g,'\\(')
        //this._value = replaceInQuotedString(this._value,/\\n/g,"\n")
        this._value = prepareToShow(config)
        this._jsonvalue = config
        this.updateDom()
    })
    this.inputElement.addEventListener("input", () => {
      let Error = true
      try{
        //this._value = replaceInQuotedString(this.inputElement.innerText,/\n/g,'\\n')
        //this._value = replaceInQuotedString(this._value,/\\\(/g, "\\\\(")
        //this._value = JSON.stringify(JSON.parse(this._value),undefined,2)
        this._value = this.inputElement.innerText
        this._jsonvalue = prepareToSaveJson(this._value)
        Error = false
      }catch(e){
        Error = true
        console.log('userscript incorrect!',e.message)
      }
      if(!Error){
        //this.updateDom()

        this.inputElement.classList.remove("inputWrong");
        this.inputElement.classList.add("inputCorrect");
        this.updateStorage()
        this._onchangeCallback()
      }else{

        this.inputElement.classList.remove("inputCorrect");
        this.inputElement.classList.add("inputWrong");
      }
    })
  }

  notify(callback){
    this._onchangeCallback = ()=>{
      callback(this)
    }
  }

  updateDom(){
    this.inputElement.innerText = this._value
  }

  updateStorage(){
    saveConfig(this._jsonvalue)
  }

  toString(){
    return this._value 
  }

  valueOf(){
    return this._value
  }

  [Symbol.toPrimitive](hint) {
    if (hint === 'number') {
      return Number(this._value);
    }
    return this._value;
  }

  get value(){
    let result = this._value
    //result = prepareToShow(result)
    //result = replaceInQuotedString(result,/\n/g,'\\n')
    //result = replaceInQuotedString(result,/\\\(/g, "\\\\(")
    //result = replaceInQuotedString(result,/\\/g,'\\')
    return result 
  }
  get text(){
    return this._value
  }
  get jsontext(){
    return this._jsonvalue
  }
  get json(){
    return JSON.parse(this._jsonvalue)
  }
  set value(newVal){
    this._value = newVal
    this.updateDom()
    this.updateStorage()
    this._onchangeCallback()
  }
}

function downloadJsonFile(jsonData, filename) {
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';

  document.body.appendChild(a);
  a.click();

  URL.revokeObjectURL(url);
}

async function sleep(delay){
  await new Promise(resolve => setTimeout(resolve,delay))
}

async function openNewWindow(file,type="popup"){
  const createData = {
    type: type,
    url: browser.runtime.getURL(file),
  };
  browser.windows.create(createData);
}

function openNewTab(file) {
  browser.tabs.create({
    url: browser.runtime.getURL(file)
  });
}

async function keepWindowSameSize(windowName){
  async function getWindowSize(windowName){
    const obj = await browser.storage.sync.get("window_"+windowName)
    const updateInto = obj["window_"+windowName]
    if(updateInto){
      const currentWindow = await browser.windows.getCurrent();
      await browser.windows.update(currentWindow.id, updateInto)
    }
  }  

  function setWindowSize(e,windowName){
    let obj = {}
    obj["window_"+windowName] = { height: window.innerHeight, width: window.innerWidth }
    browser.storage.sync.set(obj)
  }
  
  await getWindowSize(windowName)

  window.addEventListener("resize", (e)=>{
    setWindowSize(e,windowName)
  });
}
