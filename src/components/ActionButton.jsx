import React from 'react';
import { FaSpinner, FaPaperPlane, FaTimes, FaCrop, FaCamera, FaCheck } from 'react-icons/fa';

export default function ActionButton({
  onSelectArea,
  onTakeScreenshot,
  onSendToGemini,
  onClearResults,
  isLoading,
  hasScreenshot,
  hasResponse,
}) {
  if (hasResponse) {
    return (
      <div className="action-buttons">
        <div className="split-btn">
          <button
            className="split-btn__main split-btn__main--clear"
            onClick={onClearResults}
          >
            <FaCheck style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Done
          </button>
        </div>
      </div>
    );
  }

  if (hasScreenshot) {
    return (
      <div className="action-buttons">
        <div className="split-btn">
          <button
            className="split-btn__main"
            onClick={onSendToGemini}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <FaSpinner style={{ marginRight: '8px', verticalAlign: 'middle', animation: 'spin 1s linear infinite' }} />
                Sending...
              </>
            ) : (
              <>
                <FaPaperPlane style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Send to Gemini AI
              </>
            )}
          </button>
          {!isLoading && (
            <button
              className="split-btn__caret"
              onClick={onClearResults}
              title="Clear Screenshot"
            >
              <FaTimes style={{ verticalAlign: 'middle' }} />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="action-buttons">
      <div className="split-btn">
        <button className="split-btn__main" onClick={onSelectArea}>
          <FaCrop style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Select Area
        </button>
        <button
          className="split-btn__caret"
          onClick={onTakeScreenshot}
          title="Full Page Screenshot"
        >
          <FaCamera style={{ verticalAlign: 'middle' }} />
        </button>
      </div>
    </div>
  );
}
