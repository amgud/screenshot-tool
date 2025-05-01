console.log('Background script running.');

// Open sidepanel when the extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

// Listen for messages from the sidepanel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'sendToGemini') {
    // Get the image data from the request
    const imageData = request.imageData;

    // Call the Gemini API
    sendImageToGemini(imageData)
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
});

// Function to send an image to Gemini AI
async function sendImageToGemini(base64ImageData) {
  // You need to replace this with your actual Gemini API key and endpoint
  const API_KEY = 'YOUR_GEMINI_API_KEY';
  const API_URL =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent';

  // Construct the request body according to Gemini API specifications
  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: "What's in this image? Please describe it in detail.",
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
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
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
