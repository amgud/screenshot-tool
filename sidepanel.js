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

  let isSelecting = false;
  let startX, startY, endX, endY;
  let selectionBox = null;
  let currentScreenshot = null;
  // Default instruction text
  const DEFAULT_INSTRUCTION =
    "What's in this image? Please describe it in detail.";
  let customInstruction = DEFAULT_INSTRUCTION;

  // Maximum number of history items to store
  const MAX_HISTORY_ITEMS = 20;
  // Array to store history items
  let screenshotHistory = [];
  // Current active history item (if viewing from history)
  let activeHistoryItemId = null;

  /**
   * Simple markdown parser function
   * @param {string} markdown - The markdown text to parse
   * @return {string} HTML output
   *
   * Handles:
   * - Headings (#, ##, ###)
   * - Bold text (**text**)
   * - Italic text (*text*)
   * - Code blocks (```code```)
   * - Inline code (`code`)
   * - Lists (ordered: 1. item, unordered: * item or - item)
   * - Links ([text](url))
   * - Paragraphs (new lines)
   */
  function parseMarkdown(markdown) {
    if (!markdown) return '';

    // Helper function to escape HTML
    function escapeHTML(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    let html = markdown;

    // Process code blocks (```)
    html = html.replace(/```([^`]*?)```/gs, function (match, code) {
      return `<pre><code>${escapeHTML(code.trim())}</code></pre>`;
    });

    // Process inline code (`)
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Process headings (### Heading)
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');

    // Process lists
    // Unordered lists
    html = html.replace(/^\s*[\*\-]\s+(.*)/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n)+/g, '<ul>$&</ul>');

    // Ordered lists
    html = html.replace(/^\s*\d+\.\s+(.*)/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n)+/g, function (match) {
      // Only convert to <ol> if not already inside a <ul>
      if (match.indexOf('<ul>') === -1) {
        return '<ol>' + match + '</ol>';
      }
      return match;
    });

    // Process bold (**text**)
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Process italic (*text*)
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Process links [text](url)
    html = html.replace(
      /\[(.*?)\]\((.*?)\)/g,
      '<a href="$2" target="_blank">$1</a>'
    );

    // Process paragraphs (lines not part of other elements)
    html = html.replace(/^(?!<[a-z])(.*)\n/gm, '<p>$1</p>');

    // Clean up empty paragraphs
    html = html.replace(/<p><\/p>/g, '');

    return html;
  }

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
  chrome.storage.local.get(['geminiApiKey', 'customInstruction'], (result) => {
    if (result.geminiApiKey) {
      apiKeyInput.value = result.geminiApiKey;
    }

    if (result.customInstruction) {
      customInstructionInput.value = result.customInstruction;
      customInstruction = result.customInstruction;
    } else {
      customInstructionInput.value = DEFAULT_INSTRUCTION;
    }
  });

  // Save API key button
  saveApiKeyBtn.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();

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
  saveCustomInstructionBtn.addEventListener('click', () => {
    const instruction = customInstructionInput.value.trim();

    // Use default instruction if empty
    if (!instruction) {
      customInstructionInput.value = DEFAULT_INSTRUCTION;
      customInstruction = DEFAULT_INSTRUCTION;
    } else {
      customInstruction = instruction;
    }

    // Save to Chrome storage
    chrome.storage.local.set(
      { customInstruction: customInstruction },
      function () {
        console.log('Custom instruction saved to storage');

        // Visual feedback that instruction was saved
        saveCustomInstructionBtn.textContent = 'Saved!';
        setTimeout(() => {
          saveCustomInstructionBtn.textContent = 'Save';
        }, 2000);
      }
    );
  });

  // Full page screenshot
  takeScreenshotBtn.addEventListener('click', () => {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      displayScreenshot(dataUrl);
    });
  });

  // Area selection screenshot
  selectAreaBtn.addEventListener('click', () => {
    // Send message to content script to enable selection mode
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: 'enableSelection' },
        (response) => {
          console.log('Selection mode enabled1', response);
        }
      );
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
    historyPanel.classList.toggle('open');

    // Load history if panel is being opened
    if (historyPanel.classList.contains('open')) {
      loadScreenshotHistory();
    }
  });

  // Load screenshot history from storage
  function loadScreenshotHistory() {
    chrome.storage.local.get(['screenshotHistory'], (result) => {
      if (result.screenshotHistory && Array.isArray(result.screenshotHistory)) {
        screenshotHistory = result.screenshotHistory;
        renderHistoryItems();
      } else {
        screenshotHistory = [];
        // Show empty history message
        historyList.innerHTML =
          '<p class="empty-history-message">No history items yet. Take a screenshot to get started!</p>';
      }
    });
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
    const item = screenshotHistory.find((i) => i.id === itemId);
    if (!item) return;

    // Set as active item
    activeHistoryItemId = itemId;

    // Display the screenshot
    displayScreenshot(item.screenshotUrl);

    // Display the response if available
    if (item.response) {
      responseContainer.innerHTML = '';
      responseContainer.style.display = 'block';

      const responseContent = document.createElement('div');
      responseContent.className = 'response-message';
      responseContent.innerHTML = '<h3>Gemini Response:</h3>';

      const responseText = document.createElement('div');
      responseText.className = 'response-text markdown-content';
      responseText.innerHTML = parseMarkdown(item.response);

      responseContent.appendChild(responseText);
      responseContainer.appendChild(responseContent);

      // Add a "from history" indicator
      const historyIndicator = document.createElement('div');
      historyIndicator.className = 'success-message';
      historyIndicator.textContent = 'Viewing item from history';
      responseContainer.prepend(historyIndicator);
    }

    // Close the history panel
    historyPanel.classList.remove('open');
  }

  // Save an item to history
  function saveToHistory(screenshotUrl, response) {
    // Generate a thumbnail from the screenshot
    createThumbnail(screenshotUrl).then((thumbnailUrl) => {
      // Create a new history item
      const newItem = {
        id: Date.now().toString(), // Use timestamp as unique ID
        timestamp: Date.now(),
        screenshotUrl: screenshotUrl,
        thumbnailUrl: thumbnailUrl,
        response: response,
      };

      // Add to history array
      screenshotHistory.unshift(newItem);

      // Limit the number of items
      if (screenshotHistory.length > MAX_HISTORY_ITEMS) {
        screenshotHistory = screenshotHistory.slice(0, MAX_HISTORY_ITEMS);
      }

      // Save to storage
      chrome.storage.local.set({ screenshotHistory: screenshotHistory }, () => {
        console.log('Screenshot history saved to storage');
      });
    });
  }

  // Create a thumbnail from a screenshot
  function createThumbnail(dataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = function () {
        // Create a canvas for the thumbnail
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Set thumbnail dimensions
        const maxWidth = 120;
        const maxHeight = 80;

        // Calculate thumbnail dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = height * (maxWidth / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = width * (maxHeight / height);
            height = maxHeight;
          }
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw the image on the canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Get the data URL
        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(thumbnailUrl);
      };

      img.onerror = function () {
        reject(new Error('Failed to load image for thumbnail creation'));
      };

      img.src = dataUrl;
    });
  }

  // Function to send screenshot to Gemini
  function sendScreenshotToGemini(screenshotDataUrl) {
    // Show loading state
    sendToGeminiBtn.textContent = 'Sending...';
    sendToGeminiBtn.disabled = true;

    // Remove data URL prefix to get just the base64 data
    const base64Data = screenshotDataUrl.split(',')[1];

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
      (response) => {
        // Show the response container
        responseContainer.style.display = 'block';

        if (response && response.success) {
          // Extract the text response from Gemini
          let geminiText = '';
          try {
            if (response.result?.candidates?.[0]?.content?.parts) {
              // Extract text from the response
              geminiText = response.result.candidates[0].content.parts
                .filter((part) => part.text)
                .map((part) => part.text)
                .join('\n');
            }
          } catch (err) {
            console.error('Error parsing Gemini response:', err);
          }

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
            // Use our custom markdown parser instead of marked
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

          // Save to history
          saveToHistory(screenshotDataUrl, geminiText);
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
      chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
        if (chrome.runtime.lastError) {
          console.error(
            'Error capturing screenshot:',
            chrome.runtime.lastError
          );
          return;
        }

        // Convert base64 to blob
        fetch(dataUrl)
          .then((res) => res.blob())
          .then((blob) => createImageBitmap(blob))
          .then((imageBitmap) => {
            // Get device pixel ratio information from the request
            const devicePixelRatio = request.devicePixelRatio || 1;

            // Handle case where image might be cut off at the edges
            if (request.area.x + request.area.width > imageBitmap.width) {
              request.area.width = imageBitmap.width - request.area.x;
            }
            if (request.area.y + request.area.height > imageBitmap.height) {
              request.area.height = imageBitmap.height - request.area.y;
            }

            // Create a canvas to crop the image
            const canvas = new OffscreenCanvas(
              request.area.width,
              request.area.height
            );
            const ctx = canvas.getContext('2d');

            // Draw only the selected portion of the image
            ctx.drawImage(
              imageBitmap,
              request.area.x,
              request.area.y,
              request.area.width,
              request.area.height, // Source area
              0,
              0,
              request.area.width,
              request.area.height // Destination area
            );

            // Get the cropped image data
            return canvas.convertToBlob({ type: 'image/png' });
          })
          .then((blob) => {
            // Convert blob to base64
            const reader = new FileReader();
            reader.onloadend = () => {
              // Display the screenshot in the preview area
              displayScreenshot(reader.result);
            };
            reader.readAsDataURL(blob);
          })
          .catch((error) => {
            console.error('Error processing screenshot:', error);
          });

        // Return true to indicate async response
        return true;
      });
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
