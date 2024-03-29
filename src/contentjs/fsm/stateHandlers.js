async function handlerUtilsFn_pause(args){
  const timeout = randomInt(args.for)
  await sleep(timeout)
  return {success:true,resultName: "success",timeout:timeout}
}

async function handlerUtilsFn_checkState(args){
  let check = "false"
  if(args.condition){
    const condition = args.condition.replaceAll("'", '"');
    check = await jqstate(condition)
  }
  if(check == "true"){
    return {success:true, resultName: "Y"}
  }else if(check == "false"){
    return {success:true, resultName: "N"}
  }else{
    return {success:false, resultName: "error"}
  }
}

async function handlerUtilsFn_lookup(args){
  let check = ""
  if(args.condition){
    const condition = args.condition.replaceAll("'", '"');
    check = await jqlookup(condition)
  }
  if(check == "true"){
    return {success:true, resultName: "Y"}
  }else if(check == "false"){
    return {success:true, resultName: "N"}
  }else{
    return {success:false, resultName: "error"}
  }
}

async function handlerUtilsFn_set(args){
  try{
    const condition = args.condition.replaceAll("'", '"');
    const result = await jqlookupset(condition)
    //const json = JSON.parse(result)
    //await browser.runtime.sendMessage({action: "updateStateObject", state: json})

    return {success:true, resultName: "success", resultState: result, condition: condition}

  }catch(e){
    return {success:false, resultName: "fail", error:e.message }
  }
}

