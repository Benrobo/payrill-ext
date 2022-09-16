let isEcartSite = document.getElementById("ecart_error");

if (isEcartSite) {
    isEcartSite.remove();
    isEcartSite = true;
} else {
    isEcartSite = false;
}

if (isEcartSite) {
    let siteIcon = document.querySelector("link[rel='shortcut icon']")
    if (siteIcon) {
        chrome.runtime.sendMessage({
            action: 'updateIcon',
            value: siteIcon.href
        });
    }
}
