import React from 'react';
import { FaSpinner, FaPaperPlane } from 'react-icons/fa';

export default function SendButton({ onSendToGemini, disabled, isLoading }) {
  return (
    <div className="action-buttons">
      <button
        id="sendToGeminiBtn"
        className="action-btn"
        disabled={disabled}
        onClick={onSendToGemini}
      >
        {isLoading ? (
          <>
            <FaSpinner
              style={{
                marginRight: '8px',
                verticalAlign: 'middle',
                animation: 'spin 1s linear infinite',
              }}
            />
            Sending...
          </>
        ) : (
          <>
            <FaPaperPlane
              style={{ marginRight: '8px', verticalAlign: 'middle' }}
            />
            Send to Gemini AI
          </>
        )}
      </button>
    </div>
  );
}
