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

// src/utils/screenshotUtils.js
function enableSelectionMode() {
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.background = "rgba(0, 0, 0, 0.3)";
  overlay.style.zIndex = "9999";
  overlay.style.cursor = "crosshair";
  let isSelecting = false;
  let startX, startY;
  const selectionBox = document.createElement("div");
  selectionBox.style.position = "absolute";
  selectionBox.style.border = "2px dashed #4285f4";
  selectionBox.style.background = "rgba(66, 133, 244, 0.1)";
  selectionBox.style.display = "none";
  overlay.appendChild(selectionBox);
  document.body.appendChild(overlay);
  overlay.addEventListener("mousedown", (e) => {
    isSelecting = true;
    startX = e.clientX;
    startY = e.clientY;
    selectionBox.style.left = startX + "px";
    selectionBox.style.top = startY + "px";
    selectionBox.style.width = "0";
    selectionBox.style.height = "0";
    selectionBox.style.display = "block";
  });
  overlay.addEventListener("mousemove", (e) => {
    if (!isSelecting)
      return;
    const width = e.clientX - startX;
    const height = e.clientY - startY;
    selectionBox.style.width = Math.abs(width) + "px";
    selectionBox.style.height = Math.abs(height) + "px";
    selectionBox.style.left = (width < 0 ? e.clientX : startX) + "px";
    selectionBox.style.top = (height < 0 ? e.clientY : startY) + "px";
  });
  overlay.addEventListener("mouseup", (e) => {
    if (!isSelecting)
      return;
    isSelecting = false;
    const rect = selectionBox.getBoundingClientRect();
    document.body.removeChild(overlay);
    const devicePixelRatio = window.devicePixelRatio || 1;
    chrome.runtime.sendMessage({
      action: "areaScreenshot",
      area: {
        x: Math.round(rect.left * devicePixelRatio),
        y: Math.round(rect.top * devicePixelRatio),
        width: Math.round(rect.width * devicePixelRatio),
        height: Math.round(rect.height * devicePixelRatio)
      },
      devicePixelRatio
    });
  });
}

// content.js
console.log("Content script is running.");
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "enableSelection") {
    enableSelectionMode();
    sendResponse({ status: "Selection mode enabled" });
  }
});
