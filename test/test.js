console.log('main loaded')

function Xhr(method, url, data = {}) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response);
      } else {
        reject({
          status: xhr.status,
          statusText: xhr.statusText
        });
      }
    };
    xhr.onerror = function () {
      reject({
        status: xhr.status,
        statusText: xhr.statusText
      });
    };
    xhr.send(JSON.stringify(data));
  });
}

async function xhr_get(url = ""){
  const response = await Xhr("get",url);
  return JSON.parse(response)
} 

async function xhr_post(url = "", data = {}) {
  const response = await Xhr("post",url,data)
  return JSON.parse(response)
}

async function fetch_get(url = "") {
  const response = await fetch(url);
  const json = await response.json();
  return json
}

async function fetch_post(url = "", data = {}) {
  const response = await fetch(url, {
    method: "POST", // *GET, POST, PUT, DELETE, etc.
    mode: "cors", // no-cors, *cors, same-origin
    cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
    credentials: "same-origin", // include, *same-origin, omit
    headers: {
      "Content-Type": "application/json",
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    redirect: "follow", // manual, *follow, error
    referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: JSON.stringify(data), // body data type must match "Content-Type" header
  });
  return response.json(); // parses JSON response into native JavaScript objects
}

const geturl = 'https://httpbin.org/get'
const posturl = 'https://httpbin.org/post'
let requestCounter = 0

async function run_tests(verbose=false){
  const postdata = {requestn:requestCounter}
  requestCounter += 1

  const fetch_get_result = await fetch_get(geturl)
  if(verbose) console.log(`fetch get: ${geturl}`,fetch_get_result)
  const fetch_post_result = await fetch_post(posturl,postdata)
  if(verbose) console.log(`fetch post: ${posturl}`,fetch_post_result)

  const xhr_get_result = await xhr_get(geturl)
  if(verbose) console.log(`xhr get: ${geturl}`, xhr_get_result)
  const xhr_post_result = await xhr_post(posturl,postdata)
  if(verbose) console.log(`xhr post: ${posturl}`, xhr_post_result)

}

function setup_events(){
  document.addEventListener("visibilitychange", () => {
   console.log('visibilitychange',document.visibilityState)
  });

  document.addEventListener("pagehide", (event) => {
    console.log('pagehide',event)
  });
}

function setup_timers(interval = 100){
  let datelast = Date.now()
  function checkTimeout(){
    const datenow = Date.now() 
    const diff = datenow - datelast
    if (Math.abs(diff - interval) > interval*1.1) {
      console.log(`setTimeout interval: ${Math.round(diff)} Insted of: ${Math.round(interval)}`)
    }
    datelast = datenow
    setTimeout(checkTimeout,100)
  }
  checkTimeout()
}

function setup_af(interval = 1000/60){
  let perflast = performance.now()
  function check_af(perf){
    const diff = perf - perflast
    if(Math.abs(diff - interval) > interval*1.4) {
      console.log(`AF interval: ${Math.round(diff)} Insted of: ${Math.round(interval)}`)
    }
    perflast = performance.now()
    requestAnimationFrame(check_af)
  }
  requestAnimationFrame(check_af)
}

function test_observer(){
  let ob_callback = (entries, observer) => {
    console.log('observer:',observer.root)
    console.log('nodes:',entries)
    entries.forEach((entry) => {
      if(entry.intersectionRatio == 1){
        //console.log('entry',entry.target.innerText)
      }
    });
  };

  let ob_options = {
    //root: null,
    rootMargin: "0px",
    threshold: 1.0,
  };

  let observer = new IntersectionObserver(ob_callback, ob_options);
}

function check_useractivation(){
  console.log('isActive:',navigator.userActivation.isActive)
  console.log('hasBeenActive:',navigator.userActivation.hasBeenActive)
}

async function generate_content(){
  const inputElement = document.createElement('input');

  const submitHandler = (event) => {
    event.preventDefault();
    if(event.isTrusted){
      console.log('input submit isTrusted!:',inputElement.value);
    }else{
      console.log('input submit False!:',inputElement.value);
    }
  };

  const formElement = document.createElement('form');
  formElement.addEventListener('submit', submitHandler);
  formElement.appendChild(inputElement);

  document.body.appendChild(formElement);
  async function addContent(n){
    const postdata = {requestn:requestCounter}
    requestCounter += 1
    const xhr_post_result = await xhr_post(posturl,postdata)
    for(i = 0; i < n; i++){
      var par = document.createElement("h3");
      var text = document.createTextNode("text " + i);
      par.appendChild(text);
      document.body.appendChild(par);
    }
    const button = document.createElement("button")
    button.value = "more "+requestCounter.toString()
    button.appendChild(document.createTextNode("more"+requestCounter.toString()));
    button.addEventListener("click",async (e) => {
      console.log('button click')
      await addContent(60)
    })
    document.body.appendChild(button)
  }
  await addContent(60)
}

setup_events()
run_tests()
setup_timers()
setup_af()
generate_content()

