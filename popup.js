document
  .getElementById('toggleSidePanel')
  .addEventListener('click', async () => {
    const { id } = await chrome.windows.getCurrent();
    chrome.sidePanel.open({ windowId: id });
    console.log('Side panel opened');
  });
