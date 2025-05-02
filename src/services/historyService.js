/**
 * Service for managing screenshot history
 */

// Maximum number of history items to store
const MAX_HISTORY_ITEMS = 20;

/**
 * Load screenshot history from Chrome storage
 * @returns {Promise<Array>} Array of history items
 */
export function loadScreenshotHistory() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['screenshotHistory'], (result) => {
      if (result.screenshotHistory && Array.isArray(result.screenshotHistory)) {
        resolve(result.screenshotHistory);
      } else {
        resolve([]);
      }
    });
  });
}

/**
 * Save a screenshot and its response to history
 * @param {string} screenshotUrl - The data URL of the screenshot
 * @param {string} response - The text response from Gemini
 * @param {Array} currentHistory - The current history array (optional)
 * @returns {Promise<Array>} Updated history array
 */
export async function saveToHistory(
  screenshotUrl,
  response,
  currentHistory = null
) {
  // Get current history if not provided
  const history = currentHistory || (await loadScreenshotHistory());

  // Generate a thumbnail from the screenshot
  const thumbnailUrl = await createThumbnail(screenshotUrl);

  // Create a new history item
  const newItem = {
    id: Date.now().toString(), // Use timestamp as unique ID
    timestamp: Date.now(),
    screenshotUrl: screenshotUrl,
    thumbnailUrl: thumbnailUrl,
    response: response,
  };

  // Add to history array (at the beginning)
  history.unshift(newItem);

  // Limit the number of items
  const updatedHistory =
    history.length > MAX_HISTORY_ITEMS
      ? history.slice(0, MAX_HISTORY_ITEMS)
      : history;

  // Save to storage
  await saveHistoryToStorage(updatedHistory);

  return updatedHistory;
}

/**
 * Save history array to Chrome storage
 * @param {Array} history - The history array to save
 * @returns {Promise<void>}
 */
export function saveHistoryToStorage(history) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ screenshotHistory: history }, () => {
      console.log('Screenshot history saved to storage');
      resolve();
    });
  });
}

/**
 * Get a specific history item by ID
 * @param {string} itemId - The ID of the history item to get
 * @param {Array} history - The history array
 * @returns {Object|null} The history item, or null if not found
 */
export function getHistoryItem(itemId, history) {
  return history.find((item) => item.id === itemId) || null;
}

/**
 * Create a thumbnail from a screenshot
 * @param {string} dataUrl - The data URL of the screenshot
 * @returns {Promise<string>} The data URL of the thumbnail
 */
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
