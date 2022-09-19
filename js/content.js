const api = "https://api.payrill.app";
// "http://localhost:8080";
//  "http://192.168.100.74:8080";

let port;

async function getActiveEcart() {
    db.query("SELECT * FROM ecart");
    let active = null;
    if (db.length != 0) {
        db.result.active.forEach(function(each, i) {
            if (each == true) {
                active = db.result.ecartId[i];
            }
        })
    }
    if (!active) {
        return null;
    } else {
        return active;
    }
}

//fetch shortcut

function ajax(type, url, payload) {
    return fetch(api + url, {
        method: type,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
}

async function sendItemCount() {
    let cartId = document.getElementById("activeEcart").value;
    if (cartId == "") {
        return;
    }
    document.getElementById("activeEcart").dataset.now = "false";
    try {
        let result = await ajax("GET", "/api/ecart/get/" + cartId)
        let json = await result.json();
        if (json.success) {
            let items = json.data.items;
            await chrome.runtime.sendMessage({
                action: 'setItemCount',
                value: items.length,
            });
        }else{
            console.log(json.message);
        }
    } catch (error) {
        console.log(error);
    }
}

let isEcartSite = document.getElementById("ecart_error");

if (isEcartSite) {
    isEcartSite.remove();
    isEcartSite = true;
    sendItemCount()
} else {
    isEcartSite = false;
}

if (isEcartSite) {
    let siteIcon = document.querySelector("link[rel='shortcut icon']")
    if (siteIcon) {}
}

chrome.runtime.sendMessage({
    action: 'isEcartSite',
    value: isEcartSite,
}, function(response) {});

// sendItemCount();

function scheduleTask(callback, timeout) {
    timeout = +timeout || 0;
    var start = performance.now();
    function onDone(timestamp) {
        if (timestamp - start >= timeout) {
            callback();
            scheduleTask(callback, timeout);
        } else {
            requestAnimationFrame(onDone);
        }
    }
    requestAnimationFrame(onDone);
}

scheduleTask(function() {
    if (isEcartSite) {
        let now = document.getElementById("activeEcart").dataset.now;
        if (now === "true") {
            sendItemCount();
            console.log("Syncing Item Count...")
        }
    }
}, 1000)

function connect() {
    port = chrome.runtime.connect({
        name: 'foo'
    });
    port.onDisconnect.addListener(connect);
    port.onMessage.addListener(msg=>{
        console.log('received', msg, 'from bg');
    }
    );
}
connect();
