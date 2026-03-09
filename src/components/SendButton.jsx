import React, { useState, useEffect, useRef } from 'react';
import { FaSpinner, FaPaperPlane, FaTimes, FaCrop, FaCamera, FaChevronDown } from 'react-icons/fa';

export default function SendButton({
  onSelectArea,
  onTakeScreenshot,
  onSendToGemini,
  onClearResults,
  isLoading,
  hasScreenshot,
  hasResponse,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDropdownAction = (fn) => {
    setDropdownOpen(false);
    fn();
  };

  const getPrimaryAction = () => {
    if (hasResponse) {
      return {
        label: 'Done',
        icon: <FaTimes style={{ marginRight: '8px', verticalAlign: 'middle' }} />,
        onClick: onClearResults,
        className: 'split-btn__main split-btn__main--clear',
      };
    }
    if (hasScreenshot) {
      return {
        label: isLoading ? 'Sending...' : 'Send to Gemini AI',
        icon: isLoading
          ? <FaSpinner style={{ marginRight: '8px', verticalAlign: 'middle', animation: 'spin 1s linear infinite' }} />
          : <FaPaperPlane style={{ marginRight: '8px', verticalAlign: 'middle' }} />,
        onClick: onSendToGemini,
        disabled: isLoading,
        className: 'split-btn__main',
      };
    }
    return {
      label: 'Select Area',
      icon: <FaCrop style={{ marginRight: '8px', verticalAlign: 'middle' }} />,
      onClick: onSelectArea,
      className: 'split-btn__main',
    };
  };

  const primary = getPrimaryAction();

  const dropdownItems = hasResponse
    ? [
        { label: 'Select Area', icon: <FaCrop />, action: onSelectArea },
        { label: 'Full Page', icon: <FaCamera />, action: onTakeScreenshot },
      ]
    : hasScreenshot
    ? [
        { label: 'Retake: Select Area', icon: <FaCrop />, action: onSelectArea },
        { label: 'Retake: Full Page', icon: <FaCamera />, action: onTakeScreenshot },
      ]
    : [
        { label: 'Full Page', icon: <FaCamera />, action: onTakeScreenshot },
      ];

  return (
    <div className="action-buttons">
      <div className="split-btn" ref={containerRef}>
        <button
          className={primary.className}
          onClick={primary.onClick}
          disabled={primary.disabled || false}
        >
          {primary.icon}
          {primary.label}
        </button>
        {!isLoading && !hasResponse && (
          <button
            className="split-btn__caret"
            onClick={() => setDropdownOpen((o) => !o)}
            aria-label="More capture options"
          >
            <FaChevronDown style={{ verticalAlign: 'middle' }} />
          </button>
        )}
        {dropdownOpen && (
          <div className="split-btn__dropdown">
            {dropdownItems.map(({ label, icon, action }) => (
              <button
                key={label}
                className="split-btn__dropdown-item"
                onClick={() => handleDropdownAction(action)}
              >
                <span className="split-btn__dropdown-icon">{icon}</span>
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
