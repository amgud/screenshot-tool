console.log('Background script running.');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'captureScreenshot') {
    chrome.tabCapture.capture({ video: true, audio: false }, (stream) => {
      if (!stream) {
        sendResponse({
          success: false,
          error: chrome.runtime.lastError.message,
        });
        return;
      }

      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      video.onloadedmetadata = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        // Set canvas size to the video size
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw the video frame onto the canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Crop the desired area (example: top-left 200x200 pixels)
        const croppedCanvas = document.createElement('canvas');
        const croppedContext = croppedCanvas.getContext('2d');
        const cropWidth = 200;
        const cropHeight = 200;

        croppedCanvas.width = cropWidth;
        croppedCanvas.height = cropHeight;

        croppedContext.drawImage(
          canvas,
          0,
          0,
          cropWidth,
          cropHeight, // Source area
          0,
          0,
          cropWidth,
          cropHeight // Destination area
        );

        // Convert the cropped canvas to a data URL
        const imageDataUrl = croppedCanvas.toDataURL('image/png');

        // Stop the stream
        stream.getTracks().forEach((track) => track.stop());

        sendResponse({ success: true, image: imageDataUrl });
      };
    });

    // Return true to indicate async response
    return true;
  }
});
