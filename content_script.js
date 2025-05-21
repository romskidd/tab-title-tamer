// content_script.js for Tab Title Tamer (v1.0.1 - Corrected Activation/Deactivation)

(function() {
    'use strict';

    let fixerLogicCurrentlyActive = false; // Renamed for clarity
    const currentHostname = window.location.hostname;

    // Variables for the title fixing logic
    let actualPageTitle = '';
    let hasCapturedInitialTitle = false;
    let tabIsCurrentlyActive = !document.hidden;
    let forceTitleInterval = null;
    let titleEnforcerObserverInstance = null;
    let headObserverInstance = null;
    let visibilityChangeListenerFunction = null;
    let originalTitleDescriptor = null; // To store the original document.title descriptor
    let titleState = { currentValue: '' }; // Encapsulated state for document.title

    function scriptLog(message, ...args) {
        // Logs only when the fixer logic is supposed to be active for this site,
        // or for critical errors during activation/deactivation.
        if (fixerLogicCurrentlyActive || message.toUpperCase().includes('CRITICAL') || message.toUpperCase().includes('ENABLED') || message.toUpperCase().includes('DISABLED')) {
            console.log('[TabTitleTamer] ' + message, ...args);
        }
    }

    function forceSetTitle(newTitle) {
        if (!fixerLogicCurrentlyActive) return;

        const titleTag = document.querySelector('title');
        if (titleTag && titleTag.textContent !== newTitle) {
            // scriptLog('forceSetTitle: Forcing titleTag.textContent to:', newTitle);
            titleTag.textContent = newTitle;
        }
        if (document.title !== newTitle) { // This will use our setter
            // scriptLog('forceSetTitle: Forcing document.title to:', newTitle);
            document.title = newTitle;
        }
    }

    function captureTitle(titleToCapture) {
        if (!fixerLogicCurrentlyActive || !titleToCapture) return;

        if (tabIsCurrentlyActive || !hasCapturedInitialTitle) {
            if (actualPageTitle !== titleToCapture) {
                actualPageTitle = titleToCapture;
                hasCapturedInitialTitle = true;
                scriptLog('Reference title (actualPageTitle) updated:', actualPageTitle);
                if (tabIsCurrentlyActive) { // Keep our internal state for document.title override in sync
                    titleState.currentValue = actualPageTitle;
                }
            }
        }
    }

    function setupTitleEnforcerObserver() {
        if (titleEnforcerObserverInstance) titleEnforcerObserverInstance.disconnect(); // Disconnect previous if any

        titleEnforcerObserverInstance = new MutationObserver(() => {
            if (!fixerLogicCurrentlyActive || !hasCapturedInitialTitle || tabIsCurrentlyActive) return;

            const currentObservedTitle = document.querySelector('title') ? document.querySelector('title').textContent : null;
            if (currentObservedTitle !== actualPageTitle) {
                scriptLog('Violation detected by titleEnforcerObserver (inactive tab). Reverting to:', actualPageTitle);
                forceSetTitle(actualPageTitle);
            }
        });

        const titleElement = document.querySelector('title');
        if (titleElement) {
            scriptLog("Attaching titleEnforcerObserver to:", titleElement);
            titleEnforcerObserverInstance.observe(titleElement, { childList: true, characterData: true, subtree: true });
            if (titleElement.textContent && !hasCapturedInitialTitle) { // Capture initial title if not done yet
                 captureTitle(titleElement.textContent);
            }
        } else {
            scriptLog("setupTitleEnforcerObserver: <title> element not found on setup.");
        }
    }

    function setupHeadObserver() {
        if (headObserverInstance) headObserverInstance.disconnect();

        headObserverInstance = new MutationObserver((mutationsList) => {
            if (!fixerLogicCurrentlyActive) return;
            for (const mutation of mutationsList) {
                if (mutation.addedNodes) {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeName === 'TITLE') {
                            scriptLog('New <title> element detected in <head>. Re-attaching titleEnforcerObserver.');
                            setupTitleEnforcerObserver(); // Re-setup to observe the new title element
                        }
                    });
                }
            }
        });

        if (document.head) {
            scriptLog("Attaching headObserver to <head>.");
            headObserverInstance.observe(document.head, { childList: true, subtree: false });
        } else {
             document.addEventListener('DOMContentLoaded', () => {
                if(document.head) {
                    scriptLog("headObserver attached to <head> after DOMContentLoaded.");
                    headObserverInstance.observe(document.head, { childList: true, subtree: false });
                } else {
                     scriptLog('CRITICAL ERROR: <head> element not found for headObserver.');
                }
            }, { once: true });
        }
    }
    
    function defineTitleProperty() {
        // Capture the original descriptor only once before the first override
        if (!originalTitleDescriptor) {
            originalTitleDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'title') || 
                                      Object.getOwnPropertyDescriptor(HTMLDocument.prototype, 'title'); // More robust
        }
        // Ensure titleState.currentValue is initialized before defining the property
        titleState.currentValue = document.title || ''; 

        try {
            scriptLog("Attempting to redefine document.title. Initial titleState.currentValue:", titleState.currentValue);
            Object.defineProperty(document, 'title', {
                configurable: true,
                get: function() {
                    return titleState.currentValue;
                },
                set: function(newTitle) {
                    const titleTag = document.querySelector('title');
                    if (tabIsCurrentlyActive) {
                        if (titleState.currentValue !== newTitle) {
                            titleState.currentValue = newTitle;
                            if (titleTag && titleTag.textContent !== newTitle) { titleTag.textContent = newTitle; }
                        }
                        captureTitle(newTitle); // Updates actualPageTitle and potentially titleState.currentValue
                    } else { // Tab is inactive
                        if (!hasCapturedInitialTitle) {
                            titleState.currentValue = newTitle;
                            if (titleTag && titleTag.textContent !== newTitle) { titleTag.textContent = newTitle; }
                            captureTitle(newTitle);
                        } else if (newTitle !== actualPageTitle) {
                            scriptLog('TITLE CHANGE BLOCKED BY SETTER (inactive tab). Attempted: "' + newTitle + '", Kept: "' + actualPageTitle + '"');
                            titleState.currentValue = actualPageTitle;
                            if (titleTag && titleTag.textContent !== actualPageTitle) {
                                titleTag.textContent = actualPageTitle;
                            }
                        } else { // newTitle is actualPageTitle, allow it
                            titleState.currentValue = actualPageTitle;
                             if (titleTag && titleTag.textContent !== actualPageTitle) {
                                titleTag.textContent = actualPageTitle;
                            }
                        }
                    }
                }
            });
            scriptLog('document.title redefinition successful.');
            // Initial sync after redefinition
            captureTitle(document.title); // This will call the getter, then capture
            titleState.currentValue = actualPageTitle; // Ensure sync
            const titleTag = document.querySelector('title');
            if (titleTag && titleTag.textContent !== actualPageTitle) {
                 titleTag.textContent = actualPageTitle;
            }

        } catch (e) {
            scriptLogCritical('CRITICAL ERROR: Could not redefine document.title.', e);
        }
    }

    function restoreOriginalTitleProperty() {
        if (originalTitleDescriptor) {
            scriptLog("Restoring original document.title property.");
            Object.defineProperty(document, 'title', originalTitleDescriptor);
            originalTitleDescriptor = null; // Clear it so it can be re-captured if needed
        }
    }

    function activateTitleFixingLogic() {
        if (fixerLogicCurrentlyActive) return;
        fixerLogicCurrentlyActive = true;
        console.log(`[TabTitleTamer] Title fixing logic ENABLED for ${currentHostname}`);

        actualPageTitle = ''; // Reset
        hasCapturedInitialTitle = false; // Reset
        tabIsCurrentlyActive = !document.hidden;
        titleState.currentValue = document.title || ''; // Initialize with current actual title

        if (document.title) {
            captureTitle(document.title); // This will set actualPageTitle and titleState.currentValue
        }
        
        setupTitleEnforcerObserver();
        setupHeadObserver();
        defineTitleProperty(); // Define or re-define the property

        visibilityChangeListenerFunction = function() {
            tabIsCurrentlyActive = !document.hidden;
            scriptLog('Visibility changed. Tab active: ' + tabIsCurrentlyActive + '. Reference title: ' + actualPageTitle);

            if (tabIsCurrentlyActive) {
                if (forceTitleInterval) {
                    clearInterval(forceTitleInterval);
                    forceTitleInterval = null;
                    scriptLog("Forcing interval stopped.");
                }
                captureTitle(document.title); // Update with potentially legitimate title
            } else { // Tab became inactive
                if (hasCapturedInitialTitle) {
                    scriptLog('Tab became inactive. Initial title force to:', actualPageTitle);
                    forceSetTitle(actualPageTitle);
                    if (!forceTitleInterval) {
                        scriptLog("Starting active forcing interval (100ms).");
                        forceTitleInterval = setInterval(() => {
                            if (!fixerLogicCurrentlyActive || tabIsCurrentlyActive || !hasCapturedInitialTitle) {
                                clearInterval(forceTitleInterval);
                                forceTitleInterval = null;
                                // scriptLog("Interval stopped due to state change.");
                                return;
                            }
                            const currentBrowserTitle = document.title;
                            const currentTitleTagContent = document.querySelector('title') ? document.querySelector('title').textContent : "[NO TITLE TAG]";
                            if (currentBrowserTitle !== actualPageTitle || currentTitleTagContent !== actualPageTitle) {
                                scriptLog('Interval Check (100ms): Violation. Reverting to:', actualPageTitle);
                                forceSetTitle(actualPageTitle);
                            }
                        }, 100);
                    }
                }
            }
        };
        document.addEventListener('visibilitychange', visibilityChangeListenerFunction);

        // Final check on load, only if logic is active
        const loadListener = () => {
            if (!fixerLogicCurrentlyActive) return;
            scriptLog('window.load event. Final title check.');
            if (document.title) {
                captureTitle(document.title);
                if(document.hidden && hasCapturedInitialTitle && document.title !== actualPageTitle) {
                    forceSetTitle(actualPageTitle);
                }
            }
        };
        if (document.readyState === 'complete') {
            loadListener();
        } else {
            window.addEventListener('load', loadListener, { once: true });
        }
    }

    function deactivateTitleFixingLogic() {
        if (!fixerLogicCurrentlyActive) return;
        fixerLogicCurrentlyActive = false;
        console.log(`[TabTitleTamer] Title fixing logic DISABLED for ${currentHostname}`);

        if (titleEnforcerObserverInstance) titleEnforcerObserverInstance.disconnect();
        if (headObserverInstance) headObserverInstance.disconnect();
        if (visibilityChangeListenerFunction) {
            document.removeEventListener('visibilitychange', visibilityChangeListenerFunction);
            visibilityChangeListenerFunction = null;
        }
        if (forceTitleInterval) {
            clearInterval(forceTitleInterval);
            forceTitleInterval = null;
        }
        restoreOriginalTitleProperty();
        
        // Reset states
        hasCapturedInitialTitle = false;
        actualPageTitle = document.title || ''; // Reset to current actual title
    }

    function checkInitialState() {
        if (!currentHostname) {
            console.warn("[TabTitleTamer] Hostname not determined, logic cannot start.");
            return;
        }
        chrome.storage.local.get([currentHostname], function (result) {
            if (chrome.runtime.lastError) {
                scriptLogCritical("Error getting storage:", chrome.runtime.lastError);
                return;
            }
            if (result[currentHostname] === true) {
                activateTitleFixingLogic();
            } else {
                scriptLog(`Title fixing not active for ${currentHostname} on load (storage: ${result[currentHostname]}).`);
                // Ensure it's truly off if it was somehow turned on
                if (fixerLogicCurrentlyActive) { 
                    deactivateTitleFixingLogic();
                }
            }
        });
    }
    
    if (document.readyState === "loading") {
        document.addEventListener('DOMContentLoaded', checkInitialState, {once: true});
    } else {
        checkInitialState();
    }

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.action === "toggleState" && request.hostname === currentHostname) {
            scriptLog("Message received from popup:", request);
            if (request.newState) {
                activateTitleFixingLogic();
                sendResponse({status: "Title fixing activated for " + currentHostname});
            } else {
                deactivateTitleFixingLogic();
                sendResponse({status: "Title fixing deactivated for " + currentHostname});
            }
        }
        return true; 
    });

})();
