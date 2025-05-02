/**
 * Utility functions for image processing
 */

/**
 * Process a captured area screenshot from the browser
 * @param {string} dataUrl - The full screenshot data URL
 * @param {Object} area - The selected area coordinates
 * @param {number} devicePixelRatio - The device pixel ratio for accurate cropping
 * @returns {Promise<string>} A data URL of the cropped image
 */
export async function processAreaScreenshot(dataUrl, area, devicePixelRatio) {
  try {
    // Convert base64 to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const imageBitmap = await createImageBitmap(blob);

    // Handle case where image might be cut off at the edges
    if (area.x + area.width > imageBitmap.width) {
      area.width = imageBitmap.width - area.x;
    }
    if (area.y + area.height > imageBitmap.height) {
      area.height = imageBitmap.height - area.y;
    }

    // Create a canvas to crop the image
    const canvas = new OffscreenCanvas(area.width, area.height);
    const ctx = canvas.getContext('2d');

    // Draw only the selected portion of the image
    ctx.drawImage(
      imageBitmap,
      area.x,
      area.y,
      area.width,
      area.height, // Source area
      0,
      0,
      area.width,
      area.height // Destination area
    );

    // Get the cropped image data
    const croppedBlob = await canvas.convertToBlob({ type: 'image/png' });

    // Convert blob to base64
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result);
      };
      reader.readAsDataURL(croppedBlob);
    });
  } catch (error) {
    console.error('Error processing screenshot:', error);
    throw error;
  }
}

/**
 * Extract the base64 data from a data URL
 * @param {string} dataUrl - The data URL containing the base64 data
 * @returns {string} The base64 data without the data URL prefix
 */
export function extractBase64FromDataUrl(dataUrl) {
  return dataUrl.split(',')[1];
}
