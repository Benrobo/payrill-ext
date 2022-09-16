chrome.runtime.onInstalled.addListener(function() {
    chrome.runtime.onMessage.addListener(async function(msg, sender, sendResponse) {
        if (msg.action === "updateIcon") {
            console.log(msg);
            if (msg.value) {
                chrome.tabs.query({
                    currentWindow: true,
                    active: true
                }, async function(tabs) {
                    let tabId = tabs[0].id;

                    await chrome.action.setIcon({
                        path: "../icons/green.png",
                        tabId
                    })

                    // await chrome.action.setBadgeText({
                    //     text: "1",
                    //     tabId
                    // })
                    // await chrome.action.setBadgeBackgroundColor({
                    //     color: "green",
                    //     tabId
                    // });
                });

            }

        }
    });
});
