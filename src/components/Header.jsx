import React from 'react';

const Header = ({ onHistoryToggle, onSettingsToggle, viewingHistoryItem }) => {
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
          {viewingHistoryItem ? '❌' : '📋'}
        </button>
        <button
          className="icon-btn"
          title="Settings"
          onClick={onSettingsToggle}
        >
          ⚙️
        </button>
      </div>
    </div>
  );
};

export default Header;
