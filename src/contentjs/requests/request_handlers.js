/*async function handlerFn_saveraw(fullResponse){
  return await browser.runtime.sendMessage({ action: 'storeData', data: fullResponse });
}*/

async function handlerFn_save(fullResponse,args){
  return await browser.runtime.sendMessage({ action: 'request_save', data: fullResponse, args: args})
}

async function handlerFn_set(fullResponse,args){
  return await browser.runtime.sendMessage({ action: 'request_set', data: fullResponse, args: args})
}
