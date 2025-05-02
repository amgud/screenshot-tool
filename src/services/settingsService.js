/**
 * Service for managing application settings
 */

// Default instruction text
const DEFAULT_INSTRUCTION =
  "What's in this image? Please describe it in detail.";

/**
 * Load API key from Chrome storage
 * @returns {Promise<string>} The API key or empty string if not found
 */
export function loadApiKey() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['geminiApiKey'], (result) => {
      if (result.geminiApiKey) {
        resolve(result.geminiApiKey);
      } else {
        resolve('');
      }
    });
  });
}

/**
 * Save API key to Chrome storage
 * @param {string} apiKey - The API key to save
 * @returns {Promise<boolean>} True if successful
 */
export function saveApiKey(apiKey) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ geminiApiKey: apiKey }, () => {
      console.log('API key saved to storage');
      resolve(true);
    });
  });
}

/**
 * Load custom instruction from Chrome storage
 * @returns {Promise<string>} The custom instruction or default if not found
 */
export function loadCustomInstruction() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['customInstruction'], (result) => {
      if (result.customInstruction) {
        resolve(result.customInstruction);
      } else {
        resolve(DEFAULT_INSTRUCTION);
      }
    });
  });
}

/**
 * Save custom instruction to Chrome storage
 * @param {string} instruction - The instruction to save
 * @returns {Promise<boolean>} True if successful
 */
export function saveCustomInstruction(instruction) {
  // Use default instruction if empty
  const finalInstruction = instruction.trim() || DEFAULT_INSTRUCTION;

  return new Promise((resolve) => {
    chrome.storage.local.set({ customInstruction: finalInstruction }, () => {
      console.log('Custom instruction saved to storage');
      resolve(true);
    });
  });
}

/**
 * Get the default instruction text
 * @returns {string} The default instruction text
 */
export function getDefaultInstruction() {
  return DEFAULT_INSTRUCTION;
}
