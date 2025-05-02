/**
 * Utility functions for processing images and screenshots
 */

/**
 * Extract base64 data from a data URL
 * @param {string} dataUrl - The data URL
 * @returns {string} Base64 data without the prefix
 */
export const extractBase64FromDataUrl = (dataUrl) => {
  if (!dataUrl) return null;

  // Data URLs start with "data:image/png;base64,"
  const base64Prefix = 'base64,';
  const index = dataUrl.indexOf(base64Prefix);

  if (index === -1) {
    console.error('Invalid data URL format');
    return null;
  }

  return dataUrl.substring(index + base64Prefix.length);
};

/**
 * Process an area screenshot by cropping to the selected area
 * @param {string} fullScreenDataUrl - The full screenshot data URL
 * @param {Object} area - The area to crop (x, y, width, height)
 * @param {number} devicePixelRatio - The device pixel ratio for scaling
 * @returns {Promise<string>} A data URL for the cropped image
 */
export const processAreaScreenshot = (
  fullScreenDataUrl,
  area,
  devicePixelRatio
) => {
  return new Promise((resolve, reject) => {
    try {
      // Create an image from the data URL
      const img = new Image();
      img.onload = () => {
        // Scale the selection area by the device pixel ratio
        const scaledArea = {
          x: area.x * devicePixelRatio,
          y: area.y * devicePixelRatio,
          width: area.width * devicePixelRatio,
          height: area.height * devicePixelRatio,
        };

        // Create a canvas to draw the cropped image
        const canvas = document.createElement('canvas');
        canvas.width = scaledArea.width;
        canvas.height = scaledArea.height;

        const ctx = canvas.getContext('2d');

        // Draw the cropped portion of the image
        ctx.drawImage(
          img,
          scaledArea.x,
          scaledArea.y,
          scaledArea.width,
          scaledArea.height,
          0,
          0,
          scaledArea.width,
          scaledArea.height
        );

        // Convert canvas to data URL
        const croppedDataUrl = canvas.toDataURL('image/png');
        resolve(croppedDataUrl);
      };

      img.onerror = () => {
        reject(new Error('Failed to load screenshot for processing'));
      };

      img.src = fullScreenDataUrl;
    } catch (error) {
      console.error('Error processing area screenshot:', error);
      reject(error);
    }
  });
};
