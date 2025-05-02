/**
 * Settings service for loading and saving extension settings
 */

// Default instruction for Gemini
const DEFAULT_INSTRUCTION =
  "What's in this image? Please describe it in detail.";

/**
 * Loads the API key from chrome storage
 * @returns {Promise<string>} The API key or empty string if not found
 */
export const loadApiKey = async () => {
  return new Promise((resolve) => {
    chrome.storage.local.get(['apiKey'], (result) => {
      resolve(result.apiKey || '');
    });
  });
};

/**
 * Saves the API key to chrome storage
 * @param {string} apiKey - The API key to save
 * @returns {Promise<boolean>} Whether the save was successful
 */
export const saveApiKey = async (apiKey) => {
  return new Promise((resolve) => {
    chrome.storage.local.set({ apiKey }, () => {
      resolve(true);
    });
  });
};

/**
 * Loads the custom instruction from chrome storage
 * @returns {Promise<string>} The custom instruction or default if not found
 */
export const loadCustomInstruction = async () => {
  return new Promise((resolve) => {
    chrome.storage.local.get(['customInstruction'], (result) => {
      resolve(result.customInstruction || DEFAULT_INSTRUCTION);
    });
  });
};

/**
 * Saves the custom instruction to chrome storage
 * @param {string} instruction - The instruction to save
 * @returns {Promise<boolean>} Whether the save was successful
 */
export const saveCustomInstruction = async (instruction) => {
  return new Promise((resolve) => {
    chrome.storage.local.set(
      { customInstruction: instruction || DEFAULT_INSTRUCTION },
      () => {
        resolve(true);
      }
    );
  });
};

/**
 * Returns the default Gemini instruction
 * @returns {string} The default instruction
 */
export const getDefaultInstruction = () => {
  return DEFAULT_INSTRUCTION;
};
