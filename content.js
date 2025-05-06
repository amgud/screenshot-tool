import { enableSelectionMode } from './src/utils/screenshotUtils.js';

console.log('Content script is running.');

// Listen for messages from the sidebar
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'enableSelection') {
    enableSelectionMode();
    sendResponse({ status: 'Selection mode enabled' });
  }
});
