import React, { useState, useEffect } from 'react';
import {
  loadApiKey,
  saveApiKey,
  loadCustomInstruction,
  saveCustomInstruction,
  getDefaultInstruction,
} from '../services/settingsService';

const SettingsPanel = ({ onCustomInstructionChange }) => {
  const [apiKey, setApiKey] = useState('');
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [customInstruction, setCustomInstruction] = useState('');
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [instructionSaved, setInstructionSaved] = useState(false);

  // Load settings when component mounts
  useEffect(() => {
    const loadSettings = async () => {
      // Load API key
      const savedApiKey = await loadApiKey();
      if (savedApiKey) {
        setApiKey(savedApiKey);
      }

      // Load custom instruction
      const instruction = await loadCustomInstruction();
      setCustomInstruction(instruction || getDefaultInstruction());
    };

    loadSettings();
  }, []);

  // Handle API key toggle visibility
  const handleToggleApiKey = () => {
    setApiKeyVisible(!apiKeyVisible);
  };

  // Handle API key save
  const handleSaveApiKey = async () => {
    const trimmedApiKey = apiKey.trim();

    // Save API key using the settings service
    const success = await saveApiKey(trimmedApiKey);

    // Send message to background script to update the API key
    chrome.runtime.sendMessage(
      {
        action: 'updateApiKey',
        apiKey: trimmedApiKey,
      },
      function (response) {
        if (response && response.success) {
          // Show visual confirmation
          setApiKeySaved(true);
          setTimeout(() => {
            setApiKeySaved(false);
          }, 2000);
        }
      }
    );
  };

  // Handle custom instruction save
  const handleSaveCustomInstruction = async () => {
    const trimmedInstruction = customInstruction.trim();

    // Save custom instruction using the settings service
    const success = await saveCustomInstruction(trimmedInstruction);

    // Update parent component with new instruction
    onCustomInstructionChange(trimmedInstruction || getDefaultInstruction());

    // Show visual confirmation
    setInstructionSaved(true);
    setTimeout(() => {
      setInstructionSaved(false);
    }, 2000);
  };

  return (
    <div id="settingsMenu" className="settings-panel open">
      {/* Custom Instructions Section */}
      <div className="settings-section">
        <h2>Custom Instructions</h2>
        <div className="input-group">
          <label htmlFor="customInstruction">Instructions for Gemini:</label>
          <textarea
            id="customInstruction"
            placeholder="What would you like Gemini to do with the screenshot? (e.g., 'Describe what's in this image' or 'Answer the question in the screenshot')"
            rows="4"
            value={customInstruction}
            onChange={(e) => setCustomInstruction(e.target.value)}
          ></textarea>
          <button
            id="saveCustomInstruction"
            className="save-btn"
            onClick={handleSaveCustomInstruction}
          >
            {instructionSaved ? 'Saved!' : 'Save'}
          </button>
        </div>
        <p className="note">
          Customize how Gemini analyzes your screenshots. Default: "What's in
          this image? Please describe it in detail."
        </p>
      </div>

      {/* Delimiter between sections */}
      <hr className="section-divider" />

      {/* API Key Settings Section */}
      <div className="settings-section">
        <h2>API Settings</h2>
        <div className="input-group">
          <label htmlFor="apiKey">Gemini API Key:</label>
          <div className="password-container">
            <input
              type={apiKeyVisible ? 'text' : 'password'}
              id="apiKey"
              placeholder="Enter your Gemini API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <button
              id="toggleApiKeyBtn"
              className="toggle-password-btn"
              title={apiKeyVisible ? 'Hide API Key' : 'Show API Key'}
              onClick={handleToggleApiKey}
            >
              {apiKeyVisible ? '🙈' : '👁️'}
            </button>
          </div>
          <button
            id="saveApiKey"
            className="save-btn"
            onClick={handleSaveApiKey}
          >
            {apiKeySaved ? 'Saved!' : 'Save'}
          </button>
        </div>
        <p className="note">
          Your API key is stored locally and is never sent to our servers.
        </p>
        <p className="note">
          Get a key at:
          <a href="https://aistudio.google.com/app/apikey" target="_blank">
            Google AI Studio
          </a>
        </p>
      </div>
    </div>
  );
};

export default SettingsPanel;
