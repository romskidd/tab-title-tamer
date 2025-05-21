# Privacy Policy for Tab Title Tamer

**Last Updated:** May 22, 2025

Thank you for using Tab Title Tamer (the "Extension"). This Privacy Policy explains how RomsKidd (the "Author", "we", "us", or "our") handles information in relation to the Extension.

## 1. Information We Do Not Collect

Tab Title Tamer is designed with your privacy as a priority. The Extension **does not collect, store, transmit, or share any personally identifiable information or any personal user data.**

* We do not track your browsing activity.
* We do not record the websites you visit or the titles of your tabs, other than what is necessary for the Extension's core functionality while it is active on a page.
* We do not require you to create an account or provide any personal information to use the Extension.

## 2. How the Extension Works and Local Storage

Tab Title Tamer's core function is to prevent websites from changing their tab titles when a tab is inactive. To provide site-specific control, the Extension uses your browser's local storage (`chrome.storage.local` or `browser.storage.local`) to save your enable/disable preferences for individual websites.

* This information (e.g., `{"www.example.com": true}`) is stored **only on your local computer** within your browser's storage for the Extension.
* This data is not accessible to us or any third parties.
* It is solely used by the Extension to remember your settings for each site. You can clear this storage by uninstalling the Extension or by clearing your browser's extension data.

## 3. Permissions

The Extension requests the following permissions:

* **Host Permissions (`<all_urls>` for content script):** Needed to allow the content script to run on all websites so you can enable the title-taming feature for any specific site via the popup. The script is dormant unless explicitly activated by you for a site.
* **Storage:** Required to save your site-specific enable/disable preferences locally on your device.
* **ActiveTab:** Allows the popup to identify the current website to display its status and save settings for it when you interact with the extension icon.
* **Scripting:** Used by the popup to communicate with the content script on the page to instantly enable or disable the title-taming functionality.

These permissions are solely for the intended functionality of the Extension and are not used to collect any personal data.

## 4. Third-Party Services

Tab Title Tamer does not integrate with or send data to any third-party services or servers.

## 5. Changes to This Privacy Policy

We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy within the Extension's description on the respective browser extension stores or on its official code repository (if applicable). You are advised to review this Privacy Policy periodically for any changes.

Changes to this Privacy Policy are effective when they are posted on this page.

## 6. Contact Us

If you have any questions about this Privacy Policy, please feel free to open an issue on our GitHub repository: [https://github.com/RomsKidd/tab-title-tamer/issues]

---
Made with ❤️ by RomsKidd
