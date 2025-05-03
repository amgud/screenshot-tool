import React from 'react';
import { FaCamera, FaCrop } from 'react-icons/fa';

export default function ScreenshotButtons({ onTakeScreenshot, onSelectArea }) {
  return (
    <div className="button-group">
      <button
        id="takeScreenshotBtn"
        className="screenshot-btn"
        onClick={onTakeScreenshot}
      >
        <FaCamera style={{ marginRight: '8px', verticalAlign: 'middle' }} />
        Full Page
      </button>
      <button
        id="selectAreaBtn"
        className="screenshot-btn"
        onClick={onSelectArea}
      >
        <FaCrop style={{ marginRight: '8px', verticalAlign: 'middle' }} />
        Select Area
      </button>
    </div>
  );
}
