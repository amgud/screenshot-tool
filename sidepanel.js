import { parseMarkdown } from './src/utils/markdownParser.js';
import { extractTextFromGeminiResponse } from './src/services/geminiService.js';
import {
  loadScreenshotHistory,
  saveToHistory,
  getHistoryItem,
} from './src/services/historyService.js';
import {
  loadApiKey,
  saveApiKey,
  loadCustomInstruction,
  saveCustomInstruction,
  getDefaultInstruction,
} from './src/services/settingsService.js';
import {
  processAreaScreenshot,
  extractBase64FromDataUrl,
} from './src/utils/imageUtils.js';

chrome.runtime.connect({ name: 'sidePanel' });

document.addEventListener('DOMContentLoaded', function () {
  const takeScreenshotBtn = document.getElementById('takeScreenshotBtn');
  const selectAreaBtn = document.getElementById('selectAreaBtn');
  const previewArea = document.getElementById('previewArea');
  const selectionOverlay = document.getElementById('selectionOverlay');
  const sendToGeminiBtn = document.getElementById('sendToGeminiBtn');
  const responseContainer = document.getElementById('responseContainer');

  // API Key elements
  const apiKeyInput = document.getElementById('apiKey');
  const saveApiKeyBtn = document.getElementById('saveApiKey');
  const toggleApiKeyBtn = document.getElementById('toggleApiKeyBtn');

  // Custom instruction elements
  const customInstructionInput = document.getElementById('customInstruction');
  const saveCustomInstructionBtn = document.getElementById(
    'saveCustomInstruction'
  );

  // Settings menu elements
  const settingsToggleBtn = document.getElementById('settingsToggleBtn');
  const settingsMenu = document.getElementById('settingsMenu');

  // History panel elements
  const historyToggleBtn = document.getElementById('historyToggleBtn');
  const historyPanel = document.getElementById('historyPanel');
  const historyList = document.getElementById('historyList');

  // Get main content element
  const mainContent = document.getElementById('mainContent');

  let currentScreenshot = null;

  // Default instruction text
  let customInstruction = getDefaultInstruction();

  // Array to store history items
  let screenshotHistory = [];
  // Current active history item (if viewing from history)
  let activeHistoryItemId = null;

  // Flag to track if we're viewing a history item
  let viewingHistoryItem = false;

  // API Key toggle visibility
  toggleApiKeyBtn.addEventListener('click', () => {
    const type = apiKeyInput.getAttribute('type');

    if (type === 'password') {
      apiKeyInput.setAttribute('type', 'text');
      toggleApiKeyBtn.textContent = '🙈';
      toggleApiKeyBtn.title = 'Hide API Key';
    } else {
      apiKeyInput.setAttribute('type', 'password');
      toggleApiKeyBtn.textContent = '👁️';
      toggleApiKeyBtn.title = 'Show API Key';
    }
  });

  // Settings menu toggle
  settingsToggleBtn.addEventListener('click', () => {
    settingsMenu.classList.toggle('open');
    // Update icon to indicate state
    if (settingsMenu.classList.contains('open')) {
      settingsToggleBtn.textContent = '❌';
      settingsToggleBtn.title = 'Close Settings';
    } else {
      settingsToggleBtn.textContent = '⚙️';
      settingsToggleBtn.title = 'Settings';
    }
  });

  // Load saved API key and custom instruction when sidepanel opens
  async function loadInitialSettings() {
    // Load API key
    const apiKey = await loadApiKey();
    if (apiKey) {
      apiKeyInput.value = apiKey;
    }

    // Load custom instruction
    const instruction = await loadCustomInstruction();
    customInstructionInput.value = instruction;
    customInstruction = instruction;
  }

  // Initialize settings
  loadInitialSettings();

  // Save API key button
  saveApiKeyBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();

    // Save API key using the settings service
    const success = await saveApiKey(apiKey);

    // Send message to background script to update the API key
    chrome.runtime.sendMessage(
      {
        action: 'updateApiKey',
        apiKey: apiKey,
      },
      function (response) {
        if (response && response.success) {
          // Visual feedback that key was saved
          saveApiKeyBtn.textContent = 'Saved!';
          setTimeout(() => {
            saveApiKeyBtn.textContent = 'Save';
          }, 2000);
        }
      }
    );
  });

  // Save custom instruction button
  saveCustomInstructionBtn.addEventListener('click', async () => {
    const instruction = customInstructionInput.value.trim();

    // Save custom instruction using the settings service
    const success = await saveCustomInstruction(instruction);

    // Update the current instruction
    customInstruction = instruction || getDefaultInstruction();

    // Visual feedback that instruction was saved
    saveCustomInstructionBtn.textContent = 'Saved!';
    setTimeout(() => {
      saveCustomInstructionBtn.textContent = 'Save';
    }, 2000);
  });

  // Full page screenshot
  takeScreenshotBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (!tabs || tabs.length === 0) {
        console.error('No active tab found');
        return;
      }

      try {
        // Capture the screenshot without requiring explicit permission request
        // Since we have <all_urls> in host_permissions, this will work across tabs
        chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
          if (chrome.runtime.lastError) {
            console.error(
              'Error capturing screenshot:',
              chrome.runtime.lastError
            );
            showErrorMessage(
              'Failed to capture screenshot: ' +
                chrome.runtime.lastError.message
            );
            return;
          }
          displayScreenshot(dataUrl);
        });
      } catch (error) {
        console.error('Screenshot capture failed:', error);
        showErrorMessage('Failed to capture screenshot: ' + error.message);
      }
    });
  });

  // Add a helper function to show error messages
  function showErrorMessage(message) {
    responseContainer.innerHTML = '';
    responseContainer.style.display = 'block';

    const errorMsg = document.createElement('div');
    errorMsg.className = 'error-message';
    errorMsg.textContent = message;
    responseContainer.appendChild(errorMsg);
  }

  // Area selection screenshot
  selectAreaBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (!tabs || tabs.length === 0) {
        console.error('No active tab found');
        return;
      }

      try {
        // Send message to content script to enable selection mode
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: 'enableSelection' },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error(
                'Error enabling selection:',
                chrome.runtime.lastError
              );
              showErrorMessage(
                'Error enabling selection: ' + chrome.runtime.lastError.message
              );
              return;
            }
            console.log('Selection mode enabled', response);
          }
        );
      } catch (error) {
        console.error('Selection mode failed:', error);
        showErrorMessage('Failed to enable selection mode: ' + error.message);
      }
    });
  });

  // Send to Gemini button
  sendToGeminiBtn.addEventListener('click', () => {
    if (currentScreenshot) {
      sendScreenshotToGemini(currentScreenshot);
    }
  });

  // History panel toggle
  historyToggleBtn.addEventListener('click', () => {
    // If we're viewing a history item, clicking the history button should reset the view
    if (viewingHistoryItem) {
      // Reset the history item view
      viewingHistoryItem = false;
      activeHistoryItemId = null;

      // Clear preview area
      previewArea.innerHTML =
        '<p class="preview-text">Screenshot preview will appear here</p>';

      // Clear response container
      responseContainer.innerHTML = '';
      responseContainer.style.display = 'none';

      // Reset current screenshot
      currentScreenshot = null;
      sendToGeminiBtn.disabled = true;

      // Reset button icon
      historyToggleBtn.textContent = '📋';
      historyToggleBtn.title = 'View History';

      // Ensure main content is visible
      mainContent.style.display = 'block';
      return;
    }

    // Normal history panel toggle behavior
    historyPanel.classList.toggle('open');

    // Toggle main content visibility and update button icon
    if (historyPanel.classList.contains('open')) {
      // Hide main content when history panel is open
      mainContent.style.display = 'none';
      // Change button to close icon
      historyToggleBtn.textContent = '❌';
      historyToggleBtn.title = 'Close History';
      // Load history when panel is opened
      loadHistoryPanel();
    } else {
      // Show main content when history panel is closed
      mainContent.style.display = 'block';
      // Change button back to history icon
      historyToggleBtn.textContent = '📋';
      historyToggleBtn.title = 'View History';
    }
  });

  // Load screenshot history from storage and render it
  async function loadHistoryPanel() {
    screenshotHistory = await loadScreenshotHistory();
    renderHistoryItems();
  }

  // Render history items in the panel
  function renderHistoryItems() {
    // Clear the history list
    historyList.innerHTML = '';

    // Show message if history is empty
    if (screenshotHistory.length === 0) {
      historyList.innerHTML =
        '<p class="empty-history-message">No history items yet. Take a screenshot to get started!</p>';
      return;
    }

    // Sort history items by timestamp (newest first)
    const sortedHistory = [...screenshotHistory].sort(
      (a, b) => b.timestamp - a.timestamp
    );

    // Create DOM elements for each history item
    sortedHistory.forEach((item) => {
      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';
      historyItem.dataset.id = item.id;

      // Format date
      const date = new Date(item.timestamp);
      const formattedDate = date.toLocaleString();

      // Create response preview (truncate if too long)
      let responsePreview = item.response || 'No response available';
      if (responsePreview.length > 150) {
        responsePreview = responsePreview.substring(0, 150) + '...';
      }

      // Build item HTML
      historyItem.innerHTML = `
        <div class="history-item-date">${formattedDate}</div>
        <div class="history-item-content">
          <img src="${item.thumbnailUrl}" class="history-thumbnail" alt="Screenshot thumbnail">
          <div class="history-response-preview">${responsePreview}</div>
        </div>
      `;

      // Add click event to load this item
      historyItem.addEventListener('click', () => {
        loadHistoryItem(item.id);
      });

      historyList.appendChild(historyItem);
    });
  }

  // Load a specific history item
  function loadHistoryItem(itemId) {
    const item = getHistoryItem(itemId, screenshotHistory);
    if (!item) return;

    // Set as active item
    activeHistoryItemId = itemId;
    viewingHistoryItem = true;

    // Display the screenshot
    displayScreenshot(item.screenshotUrl);

    // Display the response if available
    if (item.response) {
      responseContainer.innerHTML = '';
      responseContainer.style.display = 'block';

      // Add a "from history" indicator
      const historyIndicator = document.createElement('div');
      historyIndicator.className = 'success-message';
      historyIndicator.textContent = 'Viewing item from history';
      responseContainer.appendChild(historyIndicator);

      const responseContent = document.createElement('div');
      responseContent.className = 'response-message';
      responseContent.innerHTML = '<h3>Gemini Response:</h3>';

      const responseText = document.createElement('div');
      responseText.className = 'response-text markdown-content';
      responseText.innerHTML = parseMarkdown(item.response);

      responseContent.appendChild(responseText);
      responseContainer.appendChild(responseContent);
    }

    // Close the history panel
    historyPanel.classList.remove('open');

    // Show main content when a history item is loaded
    mainContent.style.display = 'block';

    // Keep the cross icon since we're viewing a history item
    historyToggleBtn.textContent = '❌';
    historyToggleBtn.title = 'Clear History View';
  }

  // Function to send screenshot to Gemini
  function sendScreenshotToGemini(screenshotDataUrl) {
    // Show loading state
    sendToGeminiBtn.textContent = 'Sending...';
    sendToGeminiBtn.disabled = true;

    // Extract base64 data using our utility function
    const base64Data = extractBase64FromDataUrl(screenshotDataUrl);

    // Clear any previous response
    responseContainer.innerHTML = '';
    responseContainer.style.display = 'none';

    // Create request to Gemini API
    chrome.runtime.sendMessage(
      {
        action: 'sendToGemini',
        imageData: base64Data,
        instruction: customInstruction,
      },
      async (response) => {
        // Show the response container
        responseContainer.style.display = 'block';

        if (response && response.success) {
          // Extract the text response from Gemini using our utility function
          const geminiText = extractTextFromGeminiResponse(response.result);

          // Add success message
          const successMsg = document.createElement('div');
          successMsg.className = 'success-message';
          successMsg.textContent = 'Screenshot sent to Gemini AI successfully!';
          responseContainer.appendChild(successMsg);

          // Add response content if available
          if (geminiText) {
            const responseContent = document.createElement('div');
            responseContent.className = 'response-message';
            responseContent.innerHTML = '<h3>Gemini Response:</h3>';

            const responseText = document.createElement('div');
            responseText.className = 'response-text markdown-content';
            // Use our imported markdown parser
            responseText.innerHTML = parseMarkdown(geminiText);

            responseContent.appendChild(responseText);
            responseContainer.appendChild(responseContent);
          } else {
            const noResponseMsg = document.createElement('div');
            noResponseMsg.className = 'warning-message';
            noResponseMsg.textContent =
              'Received a response from Gemini, but no text content was found.';
            responseContainer.appendChild(noResponseMsg);
          }

          // Save to history using the history service
          screenshotHistory = await saveToHistory(
            screenshotDataUrl,
            geminiText,
            screenshotHistory
          );
        } else {
          // Show error message
          const errorMsg = document.createElement('div');
          errorMsg.className = 'error-message';
          errorMsg.textContent =
            response.error ||
            'Failed to send screenshot to Gemini AI. Please try again.';
          responseContainer.appendChild(errorMsg);
        }

        // Reset button state
        sendToGeminiBtn.textContent = 'Send to Gemini AI';
        sendToGeminiBtn.disabled = false;
      }
    );
  }

  // Listen for messages from content script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'areaScreenshot') {
      console.log('Area screenshot request received:', request);
      // Capture the selected area
      chrome.tabs.captureVisibleTab(
        null,
        { format: 'png' },
        async (dataUrl) => {
          if (chrome.runtime.lastError) {
            console.error(
              'Error capturing screenshot:',
              chrome.runtime.lastError
            );
            return;
          }

          try {
            // Use our utility function to process the area screenshot
            const croppedDataUrl = await processAreaScreenshot(
              dataUrl,
              request.area,
              request.devicePixelRatio
            );

            // Display the screenshot in the preview area
            displayScreenshot(croppedDataUrl);
          } catch (error) {
            console.error('Error processing area screenshot:', error);
          }

          // Return true to indicate async response
          return true;
        }
      );
    }

    if (request.action === 'closeSidePanel') {
      window.close();
      return true;
    }
  });

  function displayScreenshot(dataUrl) {
    previewArea.innerHTML = '';
    const img = document.createElement('img');
    img.src = dataUrl;
    previewArea.appendChild(img);

    // Store the current screenshot and enable the send button
    currentScreenshot = dataUrl;
    sendToGeminiBtn.disabled = false;

    // Clear any previous response when a new screenshot is displayed
    responseContainer.innerHTML = '';
    responseContainer.style.display = 'none';
  }
});
