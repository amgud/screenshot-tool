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
        <p>Capture & analyze browser screenshots</p>
      </div>
      <div className="header-icon-buttons">
        <button
          className="icon-btn"
          title={viewingHistoryItem || showHistoryPanel ? 'Close History' : 'View History'}
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
