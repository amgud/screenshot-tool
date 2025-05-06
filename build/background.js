var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);

// src/services/geminiService.js
var API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
async function sendImageToGemini(base64ImageData, instruction, apiKey) {
  if (!apiKey) {
    throw new Error("API key is not set. Please set your Gemini API key in the extension settings.");
  }
  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: instruction
          },
          {
            inline_data: {
              mime_type: "image/png",
              data: base64ImageData
            }
          }
        ]
      }
    ]
  };
  try {
    const response = await fetch(`${API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${errorData.error?.message || "Unknown error"}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error in sendImageToGemini:", error);
    throw error;
  }
}
function extractTextFromGeminiResponse(response) {
  try {
    if (!response || !response.candidates || response.candidates.length === 0) {
      return null;
    }
    const candidate = response.candidates[0];
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      return null;
    }
    const parts = candidate.content.parts;
    const textParts = parts.filter((part) => part.text).map((part) => part.text);
    return textParts.join(`

`);
  } catch (error) {
    console.error("Error extracting text from Gemini response:", error);
    return null;
  }
}

// src/services/settingsService.js
var DEFAULT_INSTRUCTION = "What's in this image? Please describe it in detail.";
async function loadApiKey() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["apiKey"], (result) => {
      resolve(result.apiKey || "");
    });
  });
}
async function saveApiKey(apiKey) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ apiKey }, () => {
      resolve(true);
    });
  });
}
async function loadCustomInstruction() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["customInstruction"], (result) => {
      resolve(result.customInstruction || DEFAULT_INSTRUCTION);
    });
  });
}
async function saveCustomInstruction(instruction) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ customInstruction: instruction || DEFAULT_INSTRUCTION }, () => {
      resolve(true);
    });
  });
}
function getDefaultInstruction() {
  return DEFAULT_INSTRUCTION;
}

// background.js
console.log("Background script running.");
var sidePanelOpen = false;
var apiKey = "";
loadApiKey().then((key) => {
  apiKey = key;
  console.log(key ? "API key loaded from storage" : "No API key found in storage");
});
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.getOptions({ tabId: tab.id }, (options) => {
    if (options?.enabled && sidePanelOpen) {
      sidePanelOpen = false;
      chrome.runtime.sendMessage({ action: "closeSidePanel" });
    } else {
      sidePanelOpen = true;
      chrome.sidePanel.open({ tabId: tab.id });
    }
  });
});
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "sidePanel") {
    port.onDisconnect.addListener(() => {
      sidePanelOpen = false;
    });
  }
});
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "sendToGemini") {
    const imageData = request.imageData;
    const customInstruction = request.instruction || "What's in this image? Please describe it in detail.";
    sendImageToGemini(imageData, customInstruction, apiKey).then((result) => {
      sendResponse({ success: true, result });
    }).catch((error) => {
      console.error("Error sending to Gemini:", error);
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }
  if (request.action === "updateApiKey") {
    saveApiKey(request.apiKey).then(() => {
      apiKey = request.apiKey;
      console.log("API key updated and saved to storage");
      sendResponse({ success: true });
    });
    return true;
  }
});
