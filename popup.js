document.getElementById('takeSnapBtn').addEventListener('click', async () => {
  alert('Snap taken!');
  console.log('start');

  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { cursor: 'always' },
      audio: false,
    });

    const track = stream.getVideoTracks()[0];
    const imageCapture = new ImageCapture(track);
    const bitmap = await imageCapture.grabFrame();

    track.stop();

    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d');
    context.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height);

    const image = canvas.toDataURL();
    console.log('Screenshot taken:', image);
    // You can add code here to handle the screenshot image, e.g., save it or display it
  } catch (error) {
    console.error('Error taking screenshot:', error);
  }
});
