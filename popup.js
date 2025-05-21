// popup.js for Tab Title Tamer
document.addEventListener('DOMContentLoaded', function () {
    const toggle = document.getElementById('activation-toggle');
    const statusText = document.getElementById('toggle-status');
    const siteHostnameText = document.getElementById('site-hostname');
    let currentHostname = null;

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs[0] && tabs[0].url) {
            try {
                const url = new URL(tabs[0].url);
                if (url.protocol === 'http:' || url.protocol === 'https:') {
                    currentHostname = url.hostname;
                    siteHostnameText.textContent = currentHostname;
                    loadState(currentHostname);
                } else {
                    siteHostnameText.textContent = "Unsupported page";
                    toggle.disabled = true;
                    statusText.textContent = "N/A";
                }
            } catch (e) {
                siteHostnameText.textContent = "Invalid URL";
                toggle.disabled = true;
                statusText.textContent = "Error";
                console.error("Error parsing URL: ", tabs[0].url, e);
            }
        } else {
            siteHostnameText.textContent = "Cannot determine site";
            toggle.disabled = true;
            statusText.textContent = "Error";
        }
    });

    function loadState(hostname) {
        if (!hostname) return;
        chrome.storage.local.get([hostname], function (result) {
            const isActive = result[hostname] === true;
            toggle.checked = isActive;
            statusText.textContent = isActive ? 'Enabled' : 'Disabled';
            toggle.disabled = false;
        });
    }

    toggle.addEventListener('change', function () {
        if (!currentHostname) return;
        const newState = toggle.checked;
        let newStorage = {};
        newStorage[currentHostname] = newState;

        chrome.storage.local.set(newStorage, function () {
            statusText.textContent = newState ? 'Enabled' : 'Disabled';
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                if (tabs[0] && tabs[0].id) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: "toggleState",
                        hostname: currentHostname,
                        newState: newState
                    }, function(response) {
                        if (chrome.runtime.lastError) {
                            console.warn("Message sending to content script failed: ", chrome.runtime.lastError.message);
                        } else if (response) {
                            console.log("Response from content script:", response.status);
                        }
                    });
                }
            });
            chrome.runtime.sendMessage({
                action: "stateChanged",
                hostname: currentHostname,
                newState: newState
            });
        });
    });
});
