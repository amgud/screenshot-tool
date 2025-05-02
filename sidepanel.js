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

  let isSelecting = false;
  let startX, startY, endX, endY;
  let selectionBox = null;
  let currentScreenshot = null;
  // Default instruction text
  const DEFAULT_INSTRUCTION =
    "What's in this image? Please describe it in detail.";
  let customInstruction = DEFAULT_INSTRUCTION;

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

            const responseText = document.createElement('p');
            responseText.className = 'response-text';
            responseText.textContent = geminiText;

            responseContent.appendChild(responseText);
            responseContainer.appendChild(responseContent);
          } else {
            const noResponseMsg = document.createElement('div');
            noResponseMsg.className = 'warning-message';
            noResponseMsg.textContent =
              'Received a response from Gemini, but no text content was found.';
            responseContainer.appendChild(noResponseMsg);
          }
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
