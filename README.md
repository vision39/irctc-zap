# IRCTC Zap

An automated Google Chrome Extension built to streamline and dramatically speed up the booking process on the official IRCTC web portal, particularly during the high-demand Tatkal reservation window. 

## 🚀 Features

- **Concurrent Data Injection**: Utilizes `Promise.all` to inject Journey details (origin, destination, date) concurrently, saving crucial seconds during booking.
- **Advanced PrimeNG Handling**: Intelligently bypasses strict Angular/PrimeNG component bindings (like `p-calendar` and `p-autocomplete`) by orchestrating native DOM events and simulating actual UI widget clicks.
- **Passenger Management**: Add and store details for up to 4 passengers and 2 infants simultaneously.
- **Deep Data Persistence**: Locally stores your travel preferences, credentials, GST details, payment methods, and passenger manifests seamlessly using Chrome's local storage engine.
- **Custom UI Feedback**: Features a polished, animated Toast notification system for extension configuration alerts.

## 🛠 Directory Structure

```plaintext
.
├── manifest.json       # Extension configurations and permissions
├── popup.html          # Extension user interface configuration page
├── popup.js            # Logic for reading, saving, and managing local configuration
├── popup.css           # Styling for the extension popup and toast notifications
├── content_script.js   # Main automation engine injected into the IRCTC portal
├── background.js       # Background service worker coordinating state and page activation
├── location.js         # Pre-configured list of IRCTC station codes and mappings
├── data.js             # Static configuration data (quotas, berth types, etc)
└── irctc128.png        # Extension icon sprite
```

## ⚙️ How It Works

1. **Configuration**: The user populates their travel details, passenger manifests, and preferences using the Extension Popup `popup.html`.
2. **Persistence**: `popup.js` structures the data and securely persists it natively via `chrome.storage.local`.
3. **Activation**: Upon arriving at the IRCTC portal (`irctc.co.in/nget/train-search`) and clicking **Connect**, `background.js` triggers `content_script.js`.
4. **Execution**: `content_script.js` uses native `MutationObserver` and recursive `waitForElement` logic to identify IRCTC's dynamic Angular components. It automatically logs in, handles dropdown autocomplete logic, selects the correct calendar date via widget emulation, clicks through passenger forms, and accelerates the user precisely up to the payment gateway.

## 📦 Installation Instructions

1. Download or clone this repository to your local machine:
   ```bash
   git clone https://github.com/vision39/irctc-zap
   ```
2. Open Google Chrome and navigate to your extensions management page:
   ```text
   chrome://extensions/
   ```
3. Enable **Developer Mode** by toggling the switch in the top-right corner.
4. Click on the **Load unpacked** button.
5. Select the cloned folder containing `manifest.json`.
6. The extension is now installed! You can pin it to your Chrome toolbar for rapid access.

## 🚦 Usage Guide

1. Click on the **IRCTC Zap** icon in your Chrome toolbar.
2. Carefully fill out the required properties:
    - **IRCTC Credentials**: Provide your username/password so the script can auto-login if prompted.
    - **Journey Details**: Origin, Destination, Date (YYYY-MM-DD), Class, and Quota.
    - **Passenger Data**: Fill exactly as required by IRCTC guidelines.
3. Click the **SAVE DATA** button. You should see a green success notification.
4. Open a new tab and navigate to `https://www.irctc.co.in`.
5. Open the Extension Popup again and click the **CONNECT** button.
6. Sit back. The automation script will take over the active page.

> **Note**: For Tatkal specific bookings, you may want to connect ~20 seconds prior to 10:00 AM (for AC classes) or 11:00 AM (for Non-AC classes) as indicated in the UI.

## ⚠️ Disclaimer

This tool is built for educational and convenience purposes. Use of automation scripts on IRCTC may be subject to their Terms of Service. Always ensure that the data fed into the extension is accurate. The developers do not guarantee ticket confirmation during rush hours.
