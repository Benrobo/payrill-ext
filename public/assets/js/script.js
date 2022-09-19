const api = "https://api.payrill.app"; // "http://localhost:8080"; // "http://192.168.100.74:8080";
let db;

//Create DB for storing cart items

db = new NOdb({
    database: "EcartDB",
    path: "./EcartDB.nodb",
    encrypt: false,
});

//Create Tables
db.query("CREATE TABLE ecart(ecartId,name,paid,active)");

byId("ecarts").innerHTML = `<div class="noecart"><img src="./assets/img/icon/cart.svg"><p>No Ecarts</p></div>`;
byId("cartList").innerHTML = "";
showEcarts();
createCartList();

async function createFirstCart() {
    let result = await ajax("POST", "/api/ecart/create", {
        name: "First Ecart"
    })
    let json = await result.json();
    db.query(`INSERT INTO ecart VALUES('${json.data.ecart}','${json.data.name}',false,true)`);
    syncDB();
}

// Show Ecarts
function showEcarts() {
    try {
        db.query("SELECT * FROM ecart ORDER BY id DESC");
        let ecarts = byId("ecarts");
        ecarts.innerHTML = "";
        if (!db.error && db.length != 0) {
            db.result.ecartId.forEach(function(id, i) {
                let active = db.result.active[i];
                if (active) {
                    active = "selected"
                } else {
                    active = "";
                }
                let ecart = `<div id="ecart_${id}" class="ecart ${active}">
                            <img src="./assets/img/icon/cart.svg">
                            <p>${db.result.name[i]}</p>
                            <button class="checkout" data-ecartId="${db.result.ecartId[i]}">Transfer</button>
                        </div>`
                ecarts.innerHTML += ecart;
            })
            db.result.ecartId.forEach(function(id, i) {
                let elem = document.getElementById("ecart_" + id);
                elem.onclick = function() {
                    setActiveEcart(id);
                }
            })
            let transfers = document.querySelectorAll(".checkout");
            transfers.forEach(function(transfer){
                transfer.onclick = function() {
                    let ecartId = transfer.dataset.ecartid;
                    modal(ecartId, "Ecart Import Code");
                    copyToClipboard(ecartId);
                }
            })
        } else {
            ecarts.innerHTML = `<div class="noecart"><img src="./assets/img/icon/cart.svg"><p>No Ecarts</p></div>`
        }
    } catch (error) {}
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(function() {
    console.log('Async: Copying to clipboard was successful!');
  }, function(err) {
    console.error('Async: Could not copy text: ', err);
  });
}

function updateBadge(text) {
    chrome.tabs.query({
        currentWindow: true,
        active: true
    }, async function(tabs) {
        let tabId = tabs[0].id;
        let color = "red";

        if (Number(text)) {
            if (Number(text) != 0) {
                color = "green";
            }
        }
        text = text + "";

        await chrome.action.setIcon({
            path: "../icons/green.png",
            tabId
        })

        await chrome.action.setBadgeText({
            text,
            tabId
        })
        await chrome.action.setBadgeBackgroundColor({
            color,
            tabId
        });
    });
}

async function setActiveEcart(id) {
    let cartId = await getActiveEcart();
    if (cartId === id) {
        return;
    }
    let ecarts = db.getDB().ecart;
    let newEcart = db.getDB().ecart;
    ecarts.ecartId.forEach(function(each, i) {
        if (each == id) {
            newEcart.active[i] = true;
        } else {
            newEcart.active[i] = false;
        }
    })
    let newDB = db.getDB();
    newDB.ecart = newEcart;
    db.setDB(newDB);
    showLoader();
    await createCartList();
    showEcarts();
    syncDB();
    setTimeout(function() {
        hideLoader();
    }, 500);
}

//Get element by id shortcut
function byId(id) {
    return document.getElementById(id);
}

// Set Tab Buttons
let tabs = document.querySelectorAll(".tabholder img");
tabs.forEach(function(tab) {
    tab.onclick = function(e) {
        let elem = e.target;
        let type = elem.dataset.type;
        openTab(e, type);

        if (type == "homeTab") {
            showEcarts();
        }else if(type == "cartTab"){
            createCartList();
        }
    }
})

// Create New Cart
byId("addCart").onclick = function() {
    new Attention.Prompt({
        title: "Create New Ecart",
        content: "Enter Name",
        placeholderText: "Ecart Name",
        submitText: "Create",
        onSubmit: async function(component, value) {
            showLoader()
            try {
                const result = await fetch(api + "/api/ecart/create", {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: value,
                    })
                });
                const json = await result.json();
                db.query(`INSERT INTO ecart VALUES('${json.data.ecart}','${json.data.name}',false,false)`)
                console.log(db.result);
                showEcarts()
                syncDB();
                hideLoader()
            } catch (error) {
                hideLoader()
                modal("Error Creating Ecart", "Error")
                alert(error);
            }

        }
    });
}

function openTab(evt, tabName) {

    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";

    history.pushState({}, '');
}

//handle back button click

window.onpopstate = function(e) {
    back();
    history.pushState({}, '');
}

function back() {
    if (byId("page2").style.display == "block" || byId("page3").style.display == "block") {
        openPage("page1");
    }
}

//page switcher

function openPage(page) {
    let length = 10;
    for (i = 0; i < length; i++) {
        try {
            let page = byId("page" + i).style.display = "none";
        } catch (e) {}
    }
    byId(page).style.display = "block";

    if (page == "page1") {
        //recreate list 
        createCartList();
    }
}

//show loader
function showLoader() {
    byId("load_cov").style.display = "flex";
}

//hide loader
function hideLoader() {
    byId("load_cov").style.display = "none";
}

//Item image slider

let itemSwiper = new Swiper('#itemSwipe',{
    slidesPerView: 'auto',
    centeredSlides: true,
    spaceBetween: 0,
    allowTouchMove: true,
    grabCursor: true,
    effect: 'creative',
    observer: true,
    observeParents: true,
    pagination: {
        el: '.swiper-pagination',
        clickable: true,
    },
    navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
    },
    autoplay: {
        delay: 5000,
        pauseOnMouseEnter: true,
        disableOnInteraction: false,
    },
});

//Card Payment Swiper

let cardSwiper = new Swiper('#cardSwipe',{
    slidesPerView: 1,
    centeredSlides: true,
    spaceBetween: 0,
    allowTouchMove: true,
    effect: 'creative',
    observer: true,
    observeParents: true,
    pagination: {
        el: '.swiper-pagination',
        clickable: true,
    }
});

//get item with id
async function getItem(id) {
    //start loading
    showLoader();

    try {
        let cartId = await getActiveEcart();
        if(!cartId){
            hideLoader();
            return false;
        }
        let result = await ajax("GET", "/api/ecart/get/" + cartId)
        let json = await result.json();
        if (json.success) {
            let items = json.data.items;
            let item = null;
            items.forEach(function(each) {
                if (each.item_id == id) {
                    item = each;
                }
            })

            if (item) {

                //Remove all slides 
                itemSwiper.removeAllSlides();

                //Add image to slide
                itemSwiper.appendSlide(`<img class="swiper-slide" src="${item.item_image}">`);

                byId("itemName").innerHTML = item.item_name;
                byId("itemPrice").innerHTML = item.item_currency + " " + item.item_price;
                byId("itemPrice").dataset.price = item.item_price;
                byId("eachOption").innerHTML = item.item_quantity;
                byId("eachOption").dataset.id = id;
                byId("eachOption").dataset.currency = item.item_currency;

                //stop loading
                hideLoader();

                //lauch page2
                openPage("page2");

                //Added this onclick listener here so it has access to hash variable
                let addToCart = byId("addToCart");
                addToCart.onclick = async function() {
                    showLoader();
                    let quantity = Number(byId("eachOption").innerHTML);
                    try {
                        let result = await ajax("POST", "/api/ecart/add", {
                            itemId: id,
                            cartId,
                            quantity
                        })

                        let json = await result.json();
                        if (json.success) {
                            await createCartList();
                            openPage("page1");
                            hideLoader();
                            syncDB();
                        } else {
                            modal(json.message || "Error Adding Item to Ecart");
                            hideLoader();
                        }
                    } catch (error) {
                        modal("Error Adding Item to Ecart");
                        hideLoader();
                    }
                }

            } else {
                hideLoader();
                modal("Item Not Found");
            }
        }
    } catch (error) {
        console.log(error)
    }
}

let back1 = byId("back");
back1.onclick = function() {
    //go back to home page
    openPage("page1");
}

let back2 = document.querySelector("#page3 .close");
back2.onclick = function() {
    //go back to home page
    back();
}

let back3 = byId("back3");
back3.onclick = function(e) {
    e.target.parentElement.style.display = 'none'
}

let details = byId("details");
details.onclick = function(e) {
    back();
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

byId("increment").onclick = function() {
    increment();
}

byId("decrement").onclick = function() {
    decrement();
}

async function increment() {
    let count = Number(byId("eachOption").innerHTML);
    let price = Number(byId("itemPrice").dataset.price);
    let currency = byId("eachOption").dataset.currency;
    count++;

    byId("itemPrice").innerHTML = currency + " " + (price * count);
    byId("eachOption").innerHTML = count;
}

function decrement() {
    let count = Number(byId("eachOption").innerHTML);
    let hash = byId("eachOption").dataset.hash;
    let currency = byId("eachOption").dataset.currency;
    let price = Number(byId("itemPrice").dataset.price);

    if (count == 0) {
        return false;
    }
    count--;
    byId("itemPrice").innerHTML = currency + " " + (price * count);
    byId("eachOption").innerHTML = count;
}

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

async function createCartList() {
    let cartList = byId("cartList");
    let pay = byId("payNow");
    cartList.innerHTML = "";
    let total = 0;
    let cur = "";

    let cartId = await getActiveEcart();
    if(!cartId){
        return modal("You have no active Ecart");
    }
    try {
        let result = await ajax("GET", "/api/ecart/get/" + cartId)
        let json = await result.json();
        if(!json.success){
            removeEcart(cartId);
            return showEcarts();
        }
        if (json.data.paid === "false") {
            pay.innerHTML = "Pay Now";
        } else {
            pay.innerHTML = "Paid";
        }
        let items = json.data.items;
        updateBadge(items.length);
        for (let item of items) {
            let name = item.item_name;
            let price = item.item_price;
            let image = item.item_image;
            let id = item.item_id;
            let quantity = item.item_quantity;
            let currency = item.item_currency;
            cur = currency;

            cartList.innerHTML += `<div class="cart">
        <img src="${image}">
        <div class="cartsub">
        <p>${currency} ${price}</p>
        <p class="cartItemName">${name}</p>
        </div>
        <div id="item_${id}" class="itemCount">${quantity}</div>
        </div>`;

            total += (price * quantity);
        }

        items.forEach(function(item) {
            let id = item.item_id;
            let elem = document.getElementById("item_" + id);
            elem.onclick = function() {
                getItem(id);
            }
        });

        if (json.length == 0) {
            cartList.innerHTML = `<img class="empty" src="./assets/img/icon/cart.svg">`;
        }
        byId("total").innerHTML = cur + " " + total;

    } catch (error) {
        console.log(error);
        modal("Error Fetching Ecart Items");
    }

}

function removeEcart(cartId) {
    let ecarts = db.getDB().ecart;
    ecarts.ecartId.forEach(function(ecartId,i){
        if(ecartId == cartId){
            ecarts.active.splice(i,1);
            ecarts.ecartId.splice(i,1);
            ecarts.id.splice(i,1);
            ecarts.name.splice(i,1);
            ecarts.paid.splice(i,1);
        }
    })
    ecarts.ecartId.forEach(function(ecartId,i){
        if(i == 0){
            ecarts.active[i] = "true";
        }else{
            ecarts.active[i] = "false";
        }
    })
    let newDB = db.getDB();
    newDB.ecart = ecarts;
    db.setDB(newDB);
}

async function createSummaryList() {
    let cartId = await getActiveEcart();
    if(!cartId){
        return modal("You have no active Ecart");
    }
    let cartList = byId("summary");
    cartList.innerHTML = "";
    let result = await ajax("GET", "/api/ecart/get/" + cartId)
    let json = await result.json();
    if (json.data.paid === "true") {
        return modal("Ecart Already Paid For!");
    }
    let items = json.data.items;
    let total = 0;
    let cur = "";

    for (let item of items) {
        let name = item.item_name;
        let price = item.item_price;
        let image = item.item_image;
        let id = item.item_id;
        let quantity = item.item_quantity;
        let currency = item.item_currency;
        cur = currency;

        cartList.innerHTML += `<div class="summarySub">
            <img src="${image}">
            <span>${currency} ${price * quantity}</span>
        </div>`;

        total += (price * quantity);
    }

    cartList.innerHTML += `<div class="summarySub">
        <p id="total">Total</p>
        <span>${cur} ${total}</span>
    </div>`;
}

function modal(msg, title="Alert") {
    new Attention.Alert({
        title: title,
        content: msg,
        afterClose: ()=>{}
    });
}

function formatCard(value) {
    var v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    var matches = v.match(/\d{4,16}/g);
    var match = matches && matches[0] || ''
    var parts = []

    for (i = 0,
    len = match.length; i < len; i += 4) {
        parts.push(match.substring(i, i + 4))
    }

    if (parts.length) {
        return parts.join(' ')
    } else {
        return value
    }
}

byId("card").oninput = function() {
    this.value = formatCard(this.value);
}

function formatExipry(value) {
    var v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    var matches = v.match(/\d{2,5}/g);
    var match = matches && matches[0] || ''
    var parts = []

    for (i = 0,
    len = match.length; i < len; i += 2) {
        parts.push(match.substring(i, i + 2))
    }

    if (parts.length) {
        return parts.join('/')
    } else {
        return value
    }
}

byId("expiryDate").oninput = function() {
    this.value = formatExipry(this.value);
}

byId("payNow").onclick = async function() {
    let name = byId("cardName");
    let card = byId("card");
    let password = byId("password");
    let cvv = byId("cvv");
    let expiryDate = byId("expiryDate");

    let address = byId("address");
    let city = byId("city");
    let state = byId("state");
    let zip = byId("zip");

    if (name.value.length < 5) {
        modal("Name too short!");
        cardSwiper.slideTo(0)
        name.focus();
    } else if (card.value.trim() == "") {
        modal("Card Number Required!");
        cardSwiper.slideTo(0)
        card.focus();
    } else if (card.value.length < 19 || card.value.startsWith("0")) {
        modal("Invalid Card Number!");
        cardSwiper.slideTo(0)
        card.focus();
    } else if (password.value.trim() == "") {
        modal("Password Required!");
        cardSwiper.slideTo(0)
        password.focus();
    } else if (password.value.length < 8) {
        modal("Password too short!");
        cardSwiper.slideTo(0)
        password.focus();
    } else if (cvv.value.length < 3) {
        modal("CVV2 too short!");
        cardSwiper.slideTo(0)
        cvv.focus();
    } else if (expiryDate.value.length != 5) {
        modal("Expiry Date Not Valid!");
        cardSwiper.slideTo(0)
        expiryDate.focus();
    } else if (!name.checkValidity()) {
        cardSwiper.slideTo(0)
        name.focus();
    } else if (!card.checkValidity()) {
        cardSwiper.slideTo(0)
        card.focus();
    } else if (!password.checkValidity()) {
        cardSwiper.slideTo(0)
        password.focus();
    } else if (!cvv.checkValidity()) {
        cardSwiper.slideTo(0)
        cvv.focus();
    } else if (!expiryDate.checkValidity()) {
        cardSwiper.slideTo(0)
        expiryDate.focus();
    } else {
        if(byId("payNow").innerHTML.trim() === "Paid"){
            return modal("Already Paid");
        }
        createSummaryList();
        openPage("page3");
        byId("payBtn").onclick = async function() {
            showLoader();
            let cartId = await getActiveEcart();
            let result = await ajax("POST", "/api/ecart/pay/" + cartId, {
                "payment_method": {
                    "type": "sg_debit_visa_card",
                    "fields": {
                        "number": card.value.replaceAll(" ", ""),
                        "expiration_month": expiryDate.value.split("/")[0],
                        "expiration_year": expiryDate.value.split("/")[1],
                        "cvv": cvv.value,
                        "name": name.value
                    }
                },
                "capture": true
            })
            let json = await result.json();
            hideLoader();
            if (json.success) {
                showSuccess();
            } else {
                modal("An Error Occurred!");
                back();
            }
        }
    }
}

function clearAllInputs() {
    let inputs = document.querySelectorAll("input");
    for (let input of inputs) {
        input.value = "";
    }
}

function showSuccess() {
    byId("success").style.display = "block";

    //Generate Reciept
    createReceipt()

    //Go to first page
    openPage("page1");
}

async function createReceipt() {
    let cartId = await getActiveEcart();
    if(!cartId){
        return modal("You have no active Ecart");
    }
    let table = byId("receipt");
    table.innerHTML = `<tr>
        <th class="left">Product</th>
        <th>Quantity</th>
        <th class="right">Price</th>
    </tr>`;

    let result = await ajax("GET", "/api/ecart/get/" + cartId);
    let json = await result.json();
    let items = json.data.items;
    let total = 0;
    let cur = "";

    for (let item of items) {
        let name = item.item_name;
        let price = item.item_price;
        let image = item.item_image;
        let id = item.item_id;
        let quantity = item.item_quantity;
        let currency = item.item_currency;
        cur = currency;

        table.innerHTML += `<tr>
            <td class="left">${name}</td>
            <td>${quantity}</td>
            <td class="right">${currency} ${price}</td>
        </tr>`;

        total += (price * quantity);
    }

    table.innerHTML += `<br>`;
    table.innerHTML += `<tr>
        <th class="left">Total</th>
        <th></th>
        <th class="right">${cur} ${total}</th>
    </tr>`;
}

function saveReceipt() {
    setTimeout(function() {
        openPage("page1");
        clearTables()
    }, 5000)
    window.print();
}

byId("save").onclick = function() {
    saveReceipt();
}

function seeDetails() {
    byId("success").style.display = "none";
    createReceipt();
    openPage("page4");
}

function executeScript(callback, injectFunction, data) {

    function getTab(callback) {
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, function(tab) {
            callback(tab[0].id, tab[0].url);
        });
    }

    getTab(function(tabId) {
        var opt = {
            target: {
                tabId: tabId
            },
            func: injectFunction,
            args: [data || ""]
        };

        chrome.scripting.executeScript(opt, function(injectionResults) {
            if (chrome.runtime.lastError) {
                console.log(chrome.runtime.lastError.message);
                callback && callback(undefined);
                return;
            }

            var result = injectionResults[0].result;

            callback && callback(result);
        });
    });
}

function syncDB() {
    try {
        function injectFunction(data) {
            localStorage.setItem("./EcartDB.nodb", JSON.stringify(data));
        }
        executeScript(function(response) {
            console.log("Syncing...");
        }, injectFunction, db.getDB());
    } catch (error) {}
}

try {
    function injectFunction() {
        return localStorage["./EcartDB.nodb"];
    }
    executeScript(function(response) {
        try {
            db.setDB(JSON.parse(response));
            showEcarts();
        } catch (error) {}
    }, injectFunction);
} catch (error) {}

const channel = new BroadcastChannel('sw-messages');

window.onload = function() {
    byId("ecarts").innerHTML = `<div class="noecart"><img src="./assets/img/icon/cart.svg"><p>No Ecarts</p></div>`;
    byId("cartList").innerHTML = "";
    channel.postMessage("isEcartSite");
    channel.addEventListener('message', event=>{
        let msg = event.data
        console.log(msg);
        if (msg.value) {} else {
            console.log("Website not supported!");
        }
    }
    );
}

const channel1 = new BroadcastChannel('count-send');

channel1.addEventListener('message', event=>{
    console.log(event);
});