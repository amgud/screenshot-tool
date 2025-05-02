/**
 * Service for handling Gemini API interactions
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
 * Extract the text from a Gemini API response
 * @param {Object} response - The Gemini API response object
 * @returns {string|null} The extracted text or null if not found
 */
export const extractTextFromGeminiResponse = (response) => {
  try {
    if (!response || !response.candidates || response.candidates.length === 0) {
      return null;
    }

    const candidate = response.candidates[0];
    if (
      !candidate.content ||
      !candidate.content.parts ||
      candidate.content.parts.length === 0
    ) {
      return null;
    }

    const parts = candidate.content.parts;
    const textParts = parts
      .filter((part) => part.text)
      .map((part) => part.text);
    return textParts.join('\n\n');
  } catch (error) {
    console.error('Error extracting text from Gemini response:', error);
    return null;
  }
};
