import React from 'react';

const ActionButtons = ({ onSendToGemini, disabled, isLoading }) => {
  return (
    <div className="action-buttons">
      <button
        id="sendToGeminiBtn"
        className="action-btn"
        disabled={disabled}
        onClick={onSendToGemini}
      >
        {isLoading ? '🔄 Sending...' : '🚀 Send to Gemini AI'}
      </button>
    </div>
  );
};

export default ActionButtons;
