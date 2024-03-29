async function onupgrade(event){

  //dbPromise.onupgradeneeded = event => {
    function convertPornolistToArray(pornolist){
      let justlist = []
      for(i in pornolist){
        justlist.push(pornolist[i])
      }
      return justlist
    }
    const db = event.target.result;
    const newVersion = event.target.result.version
    const dbStoreList = convertPornolistToArray(event.target.result.objectStoreNames)
    const extStoreList = [storageName,storageLogs,storageConf]

    console.log('new version of database: ',newVersion)

    for(i in extStoreList){
      const storeName = extStoreList[i]
      if(dbStoreList.includes(storeName)){
        console.log('store ',storeName,' exists in db')
      }else{
        console.log('create storage ',storeName)
        const createStore = await db.createObjectStore(storeName, { keyPath: "id", autoIncrement: true})
        await createStore.createIndex("id", "id", { unique: true});
      }
    }
  //};
}

function replaceInQuotedString(text,a,b) {
    const regex = /("[^"\\]*(?:\\.[^"\\]*)*")/g;
    const replacedText = text.replace(regex, function(match) {
        return match.replace(a, b);
    });
    return replacedText;
}

function prepareToSaveJson(text){
  text = replaceInQuotedString(text,/\n/g,'\\n')
  text = replaceInQuotedString(text,/\\\(/g, "\\\\(")
  text = JSON.stringify(JSON.parse(text),undefined,2)
  return text
}

function prepareToShow(text){
  text = replaceInQuotedString(text,/\\\\\(/g,'\\(')
  text = replaceInQuotedString(text,/\\n/g,"\n")
  return text
}

async function db_connect(db_name,db_version){
  return new Promise((resolve,reject)=>{
    const DBOpenRequest = indexedDB.open(db_name, db_version);
    DBOpenRequest.onupgradeneeded = onupgrade
    DBOpenRequest.onsuccess = (event) => {
      const db = DBOpenRequest.result;
      resolve(db)
    };
  })
}

async function db_transaction(db,db_storage,mode){
  if(mode == "rw"){
    return await db.transaction(db_storage,"readwrite").objectStore(db_storage)
  }else{
    return await db.transaction(db_storage,"readonly").objectStore(db_storage)
  }
} 

async function db_get(os,key){
  return new Promise((resolve,reject)=>{
    const objectStoreRequest = os.get(key)
    objectStoreRequest.onsuccess = (event) => {
      //const record = objectStoreRequest.result;
      resolve(event.target.result)
    }
  })
}

async function db_count(os){
  return new Promise((resolve,reject)=>{
    const objectStoreRequest = os.count()
    objectStoreRequest.onsuccess = (event) => {
      resolve(event.target.result)
    }
  })
}

async function db_clear(os){
  return new Promise((resolve,reject)=>{
    const objectStoreRequest = os.clear()
    objectStoreRequest.onsuccess = (event) => {
      resolve(event.target.result)
    }
  })
}

async function db_getAll(os){
  return new Promise((resolve,reject)=>{
    const objectStoreRequest = os.getAll()
    objectStoreRequest.onsuccess = (event) => {
      //const record = objectStoreRequest.result;
      resolve(event.target.result)
    }
  })
}

async function db_put(os,data){
  return new Promise((resolve,reject)=>{
    os.put(data).onsuccess = (event) => {
      resolve(event.target.result)
    }
  })
}

async function db_add(os,data){
  return new Promise((resolve,reject)=>{
    os.add(data).onsuccess = (event) => {
      resolve(event.target.result)
    }
  })
}

async function saveRecord(data,store,database){
  if(store == undefined){
    store = storageName
  }
  if(database == undefined){
    database = databaseName
  }
  const db = await db_connect(database,dbVersion)
  const os = await db_transaction(db,store,"rw")
  return await db_add(os,data)
}

async function saveConfig(config,id=2){
  const db = await db_connect(databaseName,dbVersion)
  const os = await db_transaction(db,storageConf,"rw")
  return await db_put(os,{id:id,config:config})
}
async function loadConfig(id=2){
  const db = await db_connect(databaseName,dbVersion)
  const os = await db_transaction(db,storageConf,"ro")
  const record = await db_get(os,id)
  if(record != undefined){
    return record.config
  }else{
    await saveConfig(prepareToSaveJson(defaultConfig),id=2)
    return await loadConfig(id=2)
  }
}

async function db_getAllDefault(){
  const db = await db_connect(databaseName,dbVersion)
  const os = await db_transaction(db,storageName,"ro")
  const records = await db_getAll(os)
  return records
}

async function db_getAllDefaultClear(){
  const db = await db_connect(databaseName,dbVersion)
  const os = await db_transaction(db,storageName,"rw")
  const records = await db_getAll(os)
  await db_clear(os)
  return records
}
