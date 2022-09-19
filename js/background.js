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

chrome.runtime.onInstalled.addListener(function() {
    chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
        const channel = new BroadcastChannel('sw-messages');
        if (msg.action === "isEcartSite") {
            if (msg.value) {
                chrome.tabs.query({
                    currentWindow: true,
                    active: true
                }, function(tabs) {
                    let tabId = tabs[0].id;

                    chrome.action.setIcon({
                        path: "../icons/green.png",
                        tabId
                    })
                });
            }
            channel.addEventListener('message', event=>{
                channel.postMessage(msg);
            }
            );
        }
        if (msg.action === "setItemCount") {
            updateBadge(msg.value);
        }
        sendResponse(msg);
        return true;
    });
});

chrome.runtime.onConnect.addListener(port=>{
    if (port.name !== 'foo')
        return;
    port.onMessage.addListener(onMessage);
    port.onDisconnect.addListener(deleteTimer);
    port._timer = setTimeout(forceReconnect, 250e3, port);
}
);
function onMessage(msg, port) {
    console.log('received', msg, 'from', port.sender);
}
function forceReconnect(port) {
    deleteTimer(port);
    port.disconnect();
}
function deleteTimer(port) {
    if (port._timer) {
        clearTimeout(port._timer);
        delete port._timer;
    }
}
