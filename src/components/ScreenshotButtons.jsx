import React from 'react';

const ScreenshotButtons = ({ onTakeScreenshot, onSelectArea }) => {
  return (
    <div className="button-group">
      <button
        id="takeScreenshotBtn"
        className="screenshot-btn"
        onClick={onTakeScreenshot}
      >
        📷 Full Page
      </button>
      <button
        id="selectAreaBtn"
        className="screenshot-btn"
        onClick={onSelectArea}
      >
        🔍 Select Area
      </button>
    </div>
  );
};

export default ScreenshotButtons;
