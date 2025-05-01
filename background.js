console.log('Background script running.');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'captureArea') {
    // Capture the visible tab
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        sendResponse({
          success: false,
          error: chrome.runtime.lastError.message,
        });
        return;
      }

      // Convert base64 to blob
      fetch(dataUrl)
        .then((res) => res.blob())
        .then((blob) => createImageBitmap(blob))
        .then((imageBitmap) => {
          // Create a canvas to crop the image
          const canvas = new OffscreenCanvas(
            message.area.width,
            message.area.height
          );
          const ctx = canvas.getContext('2d');

          // Draw only the selected portion of the image
          ctx.drawImage(
            imageBitmap,
            message.area.x,
            message.area.y,
            message.area.width,
            message.area.height, // Source area
            0,
            0,
            message.area.width,
            message.area.height // Destination area
          );

          // Get the cropped image data
          return canvas.convertToBlob({ type: 'image/png' });
        })
        .then((blob) => {
          // Convert blob to base64
          const reader = new FileReader();
          reader.onloadend = () => {
            sendResponse({ success: true, image: reader.result });
          };
          reader.readAsDataURL(blob);
        })
        .catch((error) => {
          console.error('Error processing screenshot:', error);
          sendResponse({ success: false, error: error.message });
        });

      // Return true to indicate async response
      return true;
    });

    // Return true to indicate async response
    return true;
  }
});
