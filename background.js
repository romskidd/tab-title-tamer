// background.js (Service Worker) for Tab Title Tamer

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "stateChanged") {
        console.log(`Tab Title Tamer (Background): State changed for ${request.hostname} to ${request.newState}`);
        sendResponse({status: "Background acknowledged state change for Tab Title Tamer"});
    }
    return true; 
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && (tab.url.startsWith('http:') || tab.url.startsWith('https:'))) {
        // Content script will check storage on its own.
        // console.log("Tab Title Tamer (Background): Tab updated:", tab.url);
    }
});

console.log("Tab Title Tamer background service worker started.");
