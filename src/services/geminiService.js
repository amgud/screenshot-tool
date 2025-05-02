/**
 * Service for interacting with the Gemini API
 */

// Default API key - users should replace this with their own
const DEFAULT_API_KEY = '';
const API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * Send an image to the Gemini AI for analysis
 * @param {string} base64ImageData - Base64 encoded image data (without the data URL prefix)
 * @param {string} instruction - Instructions for Gemini on how to analyze the image
 * @param {string} apiKey - The Gemini API key
 * @returns {Promise<Object>} - The Gemini API response
 */
export async function sendImageToGemini(base64ImageData, instruction, apiKey) {
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

/**
 * Extract text content from Gemini API response
 * @param {Object} response - The response from Gemini API
 * @returns {string} - The extracted text content
 */
export function extractTextFromGeminiResponse(response) {
  try {
    if (response?.candidates?.[0]?.content?.parts) {
      // Extract text from the response
      return response.candidates[0].content.parts
        .filter((part) => part.text)
        .map((part) => part.text)
        .join('\n');
    }
  } catch (err) {
    console.error('Error parsing Gemini response:', err);
  }
  return '';
}
