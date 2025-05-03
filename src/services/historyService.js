/**
 * Service for managing screenshot history
 */

const HISTORY_STORAGE_KEY = 'screenshotHistory';
const MAX_HISTORY_ITEMS = 50; // Maximum number of history items to store

/**
 * Generate a unique ID for history items
 * @returns {string} A unique ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Create a thumbnail from a screenshot
 * @param {string} screenshotUrl - The data URL of the screenshot
 * @returns {Promise<string>} The data URL of the thumbnail
 */
function createThumbnail(screenshotUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Create a thumbnail that's 300px wide
      const MAX_WIDTH = 300;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Calculate the thumbnail size, maintaining aspect ratio
      const aspectRatio = img.width / img.height;
      const width = Math.min(MAX_WIDTH, img.width);
      const height = width / aspectRatio;

      // Set canvas dimensions and draw the image
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      // Convert canvas to data URL
      resolve(canvas.toDataURL('image/jpeg', 0.7)); // Use JPEG for smaller size
    };

    img.onerror = () => {
      reject(new Error('Failed to create thumbnail'));
    };

    img.src = screenshotUrl;
  });
}

/**
 * Load screenshot history from storage
 * @returns {Promise<Array>} Array of history items
 */
export async function loadScreenshotHistory() {
  return new Promise((resolve) => {
    chrome.storage.local.get([HISTORY_STORAGE_KEY], (result) => {
      const history = result[HISTORY_STORAGE_KEY] || [];
      resolve(history);
    });
  });
}

/**
 * Save a new item to the screenshot history
 * @param {string} screenshotUrl - The data URL of the screenshot
 * @param {string} response - The response from Gemini
 * @param {Array} currentHistory - The current history array
 * @returns {Promise<Array>} Updated history array
 */
export async function saveToHistory(screenshotUrl, response, currentHistory) {
  try {
    // Create a thumbnail
    const thumbnailUrl = await createThumbnail(screenshotUrl);

    // Create a new history item
    const newItem = {
      id: generateId(),
      timestamp: Date.now(),
      screenshotUrl,
      thumbnailUrl,
      response,
    };

    // Get existing history if not provided
    let history = currentHistory;
    if (!history || !Array.isArray(history)) {
      history = await loadScreenshotHistory();
    }

    // Add new item to the beginning of the array
    const updatedHistory = [newItem, ...history];

    // Limit the number of items
    const limitedHistory = updatedHistory.slice(0, MAX_HISTORY_ITEMS);

    // Save to storage
    await chrome.storage.local.set({ [HISTORY_STORAGE_KEY]: limitedHistory });

    return limitedHistory;
  } catch (error) {
    console.error('Error saving to history:', error);
    return currentHistory || [];
  }
}

/**
 * Delete an item from history
 * @param {string} itemId - The ID of the item to delete
 * @returns {Promise<Array>} Updated history array
 */
export async function deleteHistoryItem(itemId) {
  try {
    // Load current history
    const history = await loadScreenshotHistory();

    // Filter out the item to delete
    const updatedHistory = history.filter((item) => item.id !== itemId);

    // Save updated history
    await chrome.storage.local.set({ [HISTORY_STORAGE_KEY]: updatedHistory });

    return updatedHistory;
  } catch (error) {
    console.error('Error deleting history item:', error);
    return null;
  }
}

/**
 * Get a specific history item by ID
 * @param {string} itemId - The ID of the item to get
 * @param {Array} history - The history array to search in
 * @returns {Object|null} The history item or null if not found
 */
export function getHistoryItem(itemId, history) {
  if (!history || !Array.isArray(history)) {
    return null;
  }

  return history.find((item) => item.id === itemId) || null;
}
