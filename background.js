console.log('Background script running.');

// Default API key - users should replace this with their own
const DEFAULT_API_KEY = '';
let apiKey = DEFAULT_API_KEY;

// Load the API key from storage when the extension starts
chrome.storage.local.get(['geminiApiKey'], function (result) {
  if (result.geminiApiKey) {
    apiKey = result.geminiApiKey;
    console.log('API key loaded from storage');
  } else {
    console.log('No API key found in storage, using default');
  }
});

// Open sidepanel when the extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

// Listen for messages from the sidepanel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'sendToGemini') {
    // Get the image data and custom instruction from the request
    const imageData = request.imageData;
    const customInstruction =
      request.instruction ||
      "What's in this image? Please describe it in detail.";

    // Call the Gemini API
    sendImageToGemini(imageData, customInstruction)
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
    // Save the new API key to storage
    chrome.storage.local.set({ geminiApiKey: request.apiKey }, function () {
      apiKey = request.apiKey;
      console.log('API key updated and saved to storage');
      sendResponse({ success: true });
    });
    return true;
  }
});

// Function to send an image to Gemini AI
async function sendImageToGemini(base64ImageData, instruction) {
  const API_URL =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

  // Check if we have an API key
  if (!apiKey) {
    throw new Error(
      'API key is not set. Please set your Gemini API key in the extension settings.'
    );
  }

  // Construct the request body according to Gemini API specifications
  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: instruction,
          },
          {
            inline_data: {
              mime_type: 'image/png',
              data: base64ImageData,
            },
          },
        ],
      },
    ],
  };

  try {
    const response = await fetch(`${API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Gemini API error: ${errorData.error?.message || 'Unknown error'}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Error in sendImageToGemini:', error);
    throw error;
  }
}
