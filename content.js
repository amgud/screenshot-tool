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
