import React from 'react';
import { FaCamera, FaCrop } from 'react-icons/fa';

export default function ScreenshotButtons({ onTakeScreenshot, onSelectArea }) {
  return (
    <div className="button-group sticky-buttons">
      <button
        id="selectAreaBtn"
        className="screenshot-btn screenshot-btn--primary"
        onClick={onSelectArea}
      >
        <FaCrop style={{ marginRight: '8px', verticalAlign: 'middle' }} />
        Select Area
      </button>
      <button
        id="takeScreenshotBtn"
        className="screenshot-btn screenshot-btn--secondary"
        onClick={onTakeScreenshot}
      >
        <FaCamera style={{ marginRight: '8px', verticalAlign: 'middle' }} />
        Full Page
      </button>
    </div>
  );
}
