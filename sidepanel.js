document.addEventListener('DOMContentLoaded', function () {
  const takeScreenshotBtn = document.getElementById('takeScreenshotBtn');
  const selectAreaBtn = document.getElementById('selectAreaBtn');
  const previewArea = document.getElementById('previewArea');
  const selectionOverlay = document.getElementById('selectionOverlay');

  let isSelecting = false;
  let startX, startY, endX, endY;
  let selectionBox = null;

  // Full page screenshot
  takeScreenshotBtn.addEventListener('click', () => {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      displayScreenshot(dataUrl);
    });
  });

  // Area selection screenshot
  selectAreaBtn.addEventListener('click', () => {
    // Send message to content script to enable selection mode
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: 'enableSelection' },
        (response) => {
          console.log('Selection mode enabled1', response);
        }
      );
    });
  });

  // Listen for messages from content script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'areaScreenshot') {
      console.log('Area screenshot request received:', request);
      // Capture the selected area
      chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
        if (chrome.runtime.lastError) {
          console.error(
            'Error capturing screenshot:',
            chrome.runtime.lastError
          );
          return;
        }

        // Convert base64 to blob
        fetch(dataUrl)
          .then((res) => res.blob())
          .then((blob) => createImageBitmap(blob))
          .then((imageBitmap) => {
            // Get device pixel ratio information from the request
            const devicePixelRatio = request.devicePixelRatio || 1;

            // Handle case where image might be cut off at the edges
            if (request.area.x + request.area.width > imageBitmap.width) {
              request.area.width = imageBitmap.width - request.area.x;
            }
            if (request.area.y + request.area.height > imageBitmap.height) {
              request.area.height = imageBitmap.height - request.area.y;
            }

            // Create a canvas to crop the image
            const canvas = new OffscreenCanvas(
              request.area.width,
              request.area.height
            );
            const ctx = canvas.getContext('2d');

            // Draw only the selected portion of the image
            ctx.drawImage(
              imageBitmap,
              request.area.x,
              request.area.y,
              request.area.width,
              request.area.height, // Source area
              0,
              0,
              request.area.width,
              request.area.height // Destination area
            );

            // Get the cropped image data
            return canvas.convertToBlob({ type: 'image/png' });
          })
          .then((blob) => {
            // Convert blob to base64
            const reader = new FileReader();
            reader.onloadend = () => {
              // Display the screenshot in the preview area
              displayScreenshot(reader.result);
            };
            reader.readAsDataURL(blob);
          })
          .catch((error) => {
            console.error('Error processing screenshot:', error);
          });

        // Return true to indicate async response
        return true;
      });
    }
  });

  function displayScreenshot(dataUrl) {
    previewArea.innerHTML = '';
    const img = document.createElement('img');
    img.src = dataUrl;
    previewArea.appendChild(img);
  }
});
