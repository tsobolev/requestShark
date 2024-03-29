async function sleep(delay){
  await new Promise(resolve => setTimeout(resolve,delay))
}

function getXY(args){
  function splitPosition(inputString,full,reverse) {
      const regex = /^(\d+)(px|%)/;
      const match = inputString.match(regex);
      if (match) {
          const value = parseInt(match[1]);
          const unit = match[2];
          if(unit == '%'){
            if(reverse){
              return full-(full*(value/100))
            }else{
              return full*(value/100)
            }
          }else{
             if(reverse){
               return full-value
             }else{
               return value
             }
          }
      } else {
          return null;
      }
  }
  let x,y
  if(args.left) x = splitPosition(args.left,window.innerWidth,false)
  if(args.top) y = splitPosition(args.top,window.innerHeight,false)
  if(args.right) x = splitPosition(args.right,window.innerWidth,true)
  if(args.bottom) y = splitPosition(args.bottom,window.innerHeight,true)
  return [x,y]
}
