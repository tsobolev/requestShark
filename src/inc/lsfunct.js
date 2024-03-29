async function localStorage_get(name){
  const result = await browser.storage.sync.get(name)
  return result[name]
}
async function localStorage_set(obj){
  await browser.storage.sync.set(obj)
}
