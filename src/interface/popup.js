function bindWindowOnClick(id,path){
  const el = document.getElementById(id)
  el.addEventListener("click", () => {
    openNewWindow(path)
  })
}

function bindTabOnClick(id,path){
  const el = document.getElementById(id)
  el.addEventListener("click", () => {
    browser.tabs.create({
      url: browser.runtime.getURL(path)
    });
  })
}

async function addActionButtons(id){
  const actionsDiv = document.getElementById(id)

  function addActionButton(menuItem){
    const button = document.createElement('button')
    button.innerText = menuItem.name
    button.value = menuItem.event
    button.addEventListener("click", async ()=>{

      const tab = await browser.tabs.query({ currentWindow: true, active: true,})

      addEventListener("beforeunload", async (event) => {
        await browser.tabs.sendMessage(tab[0].id, { action: "event", event: menuItem.event });
      });

      await sleep(200)
      window.close()

    })
    actionsDiv.appendChild(button)
  }

  const config = await loadConfig()
  let userscript
  try{
    userscript = JSON.parse(config)
  }catch{
    console.log('userscript incorrect')
  }
  if(userscript.actions){
    for (const menuItem of userscript.actions) {
      addActionButton(menuItem)
    }
  }
}

async function bindDownloadButton(id,database,storage){

  const button = document.getElementById(id)
  const buttonText = button.innerText
  const db = await db_connect(database)
  const os = await db_transaction(db,storage,"ro")
  button.addEventListener("click", async () => { 
    const records = await db_getAllDefaultClear()
    button.innerText = buttonText + " " + 0
    downloadJsonFile(JSON.stringify(records), 'rawdata.json')
    browser.runtime.sendMessage({action:"resetBadge"})
  });

  const counter = await db_count(os)
  button.innerText = buttonText + " " + counter
}

bindWindowOnClick('database', interfacePath + 'database.html')
bindWindowOnClick('config', interfacePath + 'config.html')
bindWindowOnClick('state', interfacePath + 'state.html')
bindTabOnClick('calibration', interfacePath + 'calibration.html')
bindDownloadButton('download',databaseName,storageName)
addActionButtons('actionsEl')



