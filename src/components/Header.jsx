import React from 'react';
import { FaTimes, FaHistory, FaCog } from 'react-icons/fa';

export default function Header({
  onHistoryToggle,
  onSettingsToggle,
  viewingHistoryItem,
  showHistoryPanel,
  showSettingsPanel,
}) {
  return (
    <div className="header">
      <div className="title-area">
        <h1>Screenshot Tool</h1>
        <p>Take screenshots of your browser and view them here</p>
      </div>
      <div className="header-icon-buttons">
        <button
          className="icon-btn"
          title={viewingHistoryItem ? 'Clear History View' : 'View History'}
          onClick={onHistoryToggle}
        >
          {viewingHistoryItem || showHistoryPanel ? <FaTimes /> : <FaHistory />}
        </button>
        <button
          className="icon-btn"
          title="Settings"
          onClick={onSettingsToggle}
        >
          {showSettingsPanel ? <FaTimes /> : <FaCog />}
        </button>
      </div>
    </div>
  );
}
