console.log('Content script is running.');

function captureFullPageScreenshot() {
  html2canvas(document.body).then((canvas) => {
    const imgData = canvas.toDataURL('image/png');
    downloadImage(imgData, 'fullpage_screenshot.png');
  });
}

function downloadImage(data, filename) {
  const a = document.createElement('a');
  a.href = data;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

chrome.runtime.sendMessage({ action: 'captureScreenshot' }, (response) => {
  if (response.success) {
    console.log('Screenshot captured:', response.image);

    // Example: Create an image element to display the screenshot
    const img = document.createElement('img');
    img.id = 'screenshot';
    img.style.position = 'fixed';
    img.style.top = '0';
    img.style.left = '0';
    img.style.zIndex = '9999';
    img.src = response.image;
    document.body.appendChild(img);
  } else {
    console.error('Failed to capture screenshot:', response.error);
  }
});

// Example usage: captureFullPageScreenshot();

let isSelecting = false;
let startX, startY;
let selectionBox = null;

// Listen for messages from the sidebar
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'enableSelection') {
    enableSelectionMode();
    sendResponse({ status: 'Selection mode enabled' });
  }
});

function enableSelectionMode() {
  // Create overlay for selection
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.background = 'rgba(0, 0, 0, 0.3)';
  overlay.style.zIndex = '9999';
  overlay.style.cursor = 'crosshair';

  // Create selection box
  selectionBox = document.createElement('div');
  selectionBox.style.position = 'absolute';
  selectionBox.style.border = '2px dashed #4285f4';
  selectionBox.style.background = 'rgba(66, 133, 244, 0.1)';
  selectionBox.style.display = 'none';

  overlay.appendChild(selectionBox);
  document.body.appendChild(overlay);

  // Mouse events for selection
  overlay.addEventListener('mousedown', (e) => {
    isSelecting = true;
    startX = e.clientX;
    startY = e.clientY;

    selectionBox.style.left = startX + 'px';
    selectionBox.style.top = startY + 'px';
    selectionBox.style.width = '0';
    selectionBox.style.height = '0';
    selectionBox.style.display = 'block';
  });

  overlay.addEventListener('mousemove', (e) => {
    if (!isSelecting) return;

    const width = e.clientX - startX;
    const height = e.clientY - startY;

    selectionBox.style.width = Math.abs(width) + 'px';
    selectionBox.style.height = Math.abs(height) + 'px';
    selectionBox.style.left = (width < 0 ? e.clientX : startX) + 'px';
    selectionBox.style.top = (height < 0 ? e.clientY : startY) + 'px';
  });

  overlay.addEventListener('mouseup', (e) => {
    if (!isSelecting) return;
    isSelecting = false;

    // Get the coordinates of the selection
    const rect = selectionBox.getBoundingClientRect();
    // Remove overlay
    document.body.removeChild(overlay);

    // Account for device pixel ratio to ensure correct cropping
    const devicePixelRatio = window.devicePixelRatio || 1;

    // Take the screenshot with chrome.tabs.captureVisibleTab
    setTimeout(() => {
      // Send the coordinates to the background script
      chrome.runtime.sendMessage({
        action: 'areaScreenshot',
        area: {
          x: Math.round(rect.left * devicePixelRatio),
          y: Math.round(rect.top * devicePixelRatio),
          width: Math.round(rect.width * devicePixelRatio),
          height: Math.round(rect.height * devicePixelRatio),
        },
        devicePixelRatio: devicePixelRatio,
      });
    }, 100);
  });
}
