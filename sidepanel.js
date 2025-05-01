// Screenshot functionality
document
  .getElementById('takeScreenshotBtn')
  .addEventListener('click', async () => {
    try {
      // Replace preview area with loading message
      const previewArea = document.getElementById('previewArea');
      previewArea.innerHTML =
        '<p class="preview-text">Taking screenshot...</p>';

      // Get display media stream
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false,
      });

      // Capture frame from stream
      const track = stream.getVideoTracks()[0];
      const imageCapture = new ImageCapture(track);
      const bitmap = await imageCapture.grabFrame();

      // Stop the track
      track.stop();

      // Create canvas and draw the bitmap
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext('2d');
      context.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height);

      // Convert to data URL
      const image = canvas.toDataURL();

      // Display the screenshot in the preview area
      previewArea.innerHTML = '';
      const img = document.createElement('img');
      img.src = image;
      previewArea.appendChild(img);

      // Create download button
      const downloadBtn = document.createElement('button');
      downloadBtn.className = 'screenshot-btn';
      downloadBtn.style.marginTop = '10px';
      downloadBtn.textContent = 'Download Screenshot';
      downloadBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = `screenshot-${new Date().toISOString()}.png`;
        link.href = image;
        link.click();
      });

      previewArea.appendChild(document.createElement('br'));
      previewArea.appendChild(downloadBtn);

      console.log('Screenshot taken successfully');
    } catch (error) {
      console.error('Error taking screenshot:', error);
      document.getElementById(
        'previewArea'
      ).innerHTML = `<p class="preview-text" style="color: red">Error: ${error.message}</p>`;
    }
  });
