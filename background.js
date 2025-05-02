import { sendImageToGemini } from './src/services/geminiService.js';
import { loadApiKey, saveApiKey } from './src/services/settingsService.js';

console.log('Background script running.');

let sidePanelOpen = false;
let apiKey = '';

// Initialize: Load API key from storage when the extension starts
loadApiKey().then((key) => {
  apiKey = key;
  console.log(
    key ? 'API key loaded from storage' : 'No API key found in storage'
  );
});

// Open sidepanel when the extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.getOptions({ tabId: tab.id }, (options) => {
    if (options?.enabled && sidePanelOpen) {
      sidePanelOpen = false;
      chrome.runtime.sendMessage({ action: 'closeSidePanel' });
    } else {
      sidePanelOpen = true;
      chrome.sidePanel.open({ tabId: tab.id });
    }
  });
});

// Listen for sidepanel disconnect event to update the state
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'sidePanel') {
    port.onDisconnect.addListener(() => {
      sidePanelOpen = false;
    });
  }
});

// Listen for messages from the sidepanel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'sendToGemini') {
    // Get the image data and custom instruction from the request
    const imageData = request.imageData;
    const customInstruction =
      request.instruction ||
      "What's in this image? Please describe it in detail.";

    // Call the Gemini API using the imported service
    sendImageToGemini(imageData, customInstruction, apiKey)
      .then((result) => {
        sendResponse({ success: true, result });
      })
      .catch((error) => {
        console.error('Error sending to Gemini:', error);
        sendResponse({ success: false, error: error.message });
      });

    // Return true to indicate we'll send an async response
    return true;
  }

  // Handle API key updates from the settings
  if (request.action === 'updateApiKey') {
    // Save the new API key using our settings service
    saveApiKey(request.apiKey).then(() => {
      apiKey = request.apiKey;
      console.log('API key updated and saved to storage');
      sendResponse({ success: true });
    });
    return true;
  }
});
