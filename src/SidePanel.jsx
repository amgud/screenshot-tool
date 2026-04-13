import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import PreviewArea from './components/PreviewArea';
import ResponseContainer from './components/ResponseContainer';
import HistoryPanel from './components/HistoryPanel';
import SettingsPanel from './components/SettingsPanel';
import ActionButton from './components/ActionButton';
import {
  loadScreenshotHistory,
  saveToHistory,
  getHistoryItem,
} from './services/historyService';
import { extractTextFromGeminiResponse } from './services/geminiService';
import {
  extractBase64FromDataUrl,
  processAreaScreenshot,
} from './utils/imageUtils';
import { parseMarkdown } from './utils/markdownParser';
import {
  loadApiKey,
  loadCustomInstruction,
  getDefaultInstruction,
} from './services/settingsService';

export default function SidePanel() {
  // State management
  const [currentScreenshot, setCurrentScreenshot] = useState(null);
  const [customInstruction, setCustomInstruction] = useState(
    getDefaultInstruction()
  );
  const [screenshotHistory, setScreenshotHistory] = useState([]);
  const [activeHistoryItemId, setActiveHistoryItemId] = useState(null);
  const [viewingHistoryItem, setViewingHistoryItem] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [responseData, setResponseData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSelectingArea, setIsSelectingArea] = useState(false);

  // Stores the last full-tab capture so resize/move can re-crop without blinking
  const fullCaptureRef = useRef(null);

  // Initialize settings and message listeners
  useEffect(() => {
    // Load settings
    const loadInitialSettings = async () => {
      const instruction = await loadCustomInstruction();
      setCustomInstruction(instruction);
    };

    loadInitialSettings();

    // Set up message listeners
    const messageListener = (request, sender, sendResponse) => {
      if (request.action === 'selectionCancelled') {
        setIsSelectingArea(false);
        return true;
      }

      // Re-crop from the pre-captured full tab image
      if (request.action === 'areaCropUpdate') {
        if (!fullCaptureRef.current) return true;

        const { dataUrl, devicePixelRatio } = fullCaptureRef.current;
        processAreaScreenshot(dataUrl, request.area, devicePixelRatio)
          .then((croppedDataUrl) => {
            setCurrentScreenshot(croppedDataUrl);
            setResponseData(null);
          })
          .catch((error) => {
            console.error('Error re-cropping screenshot:', error);
          });
        return true;
      }

      if (request.action === 'closeSidePanel') {
        window.close();
        return true;
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    // Handle Esc key while selection mode is active
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isSelectingArea) {
        handleCancelSelectArea();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Clean up listener on component unmount
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSelectingArea]);

  // Handler for taking a full page screenshot
  const handleTakeScreenshot = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (!tabs || tabs.length === 0) {
        console.error('No active tab found');
        return;
      }

      try {
        // Capture the screenshot
        chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
          if (chrome.runtime.lastError) {
            console.error(
              'Error capturing screenshot:',
              chrome.runtime.lastError
            );
            setResponseData({
              type: 'error',
              message:
                'Failed to capture screenshot: ' +
                chrome.runtime.lastError.message,
            });
            return;
          }
          setCurrentScreenshot(dataUrl);
          setResponseData(null);
        });
      } catch (error) {
        console.error('Screenshot capture failed:', error);
        setResponseData({
          type: 'error',
          message: 'Failed to capture screenshot: ' + error.message,
        });
      }
    });
  };

  // Handler for selecting an area for screenshot
  const handleSelectArea = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (!tabs || tabs.length === 0) {
        console.error('No active tab found');
        return;
      }

      try {
        // Pre-capture the full tab before showing the overlay so that every
        // subsequent crop is instant and the overlay never needs to hide.
        chrome.tabs.captureVisibleTab(
          null,
          { format: 'png' },
          (dataUrl) => {
            if (chrome.runtime.lastError) {
              console.error('Error pre-capturing tab:', chrome.runtime.lastError);
              return;
            }

            // Store for re-crops
            fullCaptureRef.current = {
              dataUrl,
              devicePixelRatio: window.devicePixelRatio || 1,
            };

            // Load the showDimensions setting, then enable selection
            chrome.storage.local.get(['showSelectionDimensions'], (result) => {
              const options = {
                showDimensions: result.showSelectionDimensions || false,
              };

              chrome.tabs.sendMessage(
                tabs[0].id,
                { action: 'enableSelection', options },
                (response) => {
                  if (chrome.runtime.lastError) {
                    console.error(
                      'Error enabling selection:',
                      chrome.runtime.lastError
                    );
                    setResponseData({
                      type: 'error',
                      message:
                        'Error enabling selection. Please refresh the page and try again.',
                    });
                    return;
                  }
                  console.log('Selection mode enabled', response);
                  setIsSelectingArea(true);
                }
              );
            });
          }
        );
      } catch (error) {
        console.error('Selection mode failed:', error);
        setResponseData({
          type: 'error',
          message: 'Failed to enable selection mode: ' + error.message,
        });
      }
    });
  };

  // Handler for cancelling area selection mode
  const handleCancelSelectArea = () => {
    setIsSelectingArea(false);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0) return;
      chrome.tabs.sendMessage(tabs[0].id, { action: 'cancelSelection' });
    });
  };

  // Handler for sending screenshot to Gemini
  const handleSendToGemini = () => {
    if (!currentScreenshot) return;

    setIsLoading(true);

    // Extract base64 data
    const base64Data = extractBase64FromDataUrl(currentScreenshot);

    // Clear previous response
    setResponseData(null);

    // Create request to Gemini API
    chrome.runtime.sendMessage(
      {
        action: 'sendToGemini',
        imageData: base64Data,
        instruction: customInstruction,
      },
      async (response) => {
        if (response && response.success) {
          // Extract the text response from Gemini
          const geminiText = extractTextFromGeminiResponse(response.result);

          // Set response data
          setResponseData({
            type: 'success',
            content: geminiText || null,
          });

          // Save to history
          const updatedHistory = await saveToHistory(
            currentScreenshot,
            geminiText,
            screenshotHistory
          );
          setScreenshotHistory(updatedHistory);
        } else {
          // Show error message
          setResponseData({
            type: 'error',
            message:
              response.error ||
              'Failed to send screenshot to Gemini AI. Please try again.',
          });
        }

        setIsLoading(false);
      }
    );
  };

  // Handler for toggling history panel
  const handleToggleHistory = () => {
    if (showHistoryPanel || viewingHistoryItem) {
      // Closing or exiting history item: reset to initial state
      setShowHistoryPanel(false);
      setViewingHistoryItem(false);
      setActiveHistoryItemId(null);
      setCurrentScreenshot(null);
      setResponseData(null);
      return;
    }

    // Opening: close settings panel if open
    if (showSettingsPanel) {
      setShowSettingsPanel(false);
    }

    setShowHistoryPanel(true);
    loadHistoryPanel();
  };

  // Handler for going back to history from a history item view
  const handleBackToHistory = () => {
    setViewingHistoryItem(false);
    setActiveHistoryItemId(null);
    setCurrentScreenshot(null);
    setResponseData(null);
    setShowHistoryPanel(true);
    loadHistoryPanel();
  };

  // Handler for toggling settings panel
  const handleToggleSettings = () => {
    // Close history panel if open
    if (showHistoryPanel) {
      setShowHistoryPanel(false);
    }

    // Toggle settings panel
    setShowSettingsPanel(!showSettingsPanel);
  };

  // Load screenshot history
  const loadHistoryPanel = async () => {
    const history = await loadScreenshotHistory();
    setScreenshotHistory(history);
  };

  // Load a specific history item
  const handleLoadHistoryItem = (itemId) => {
    const item = getHistoryItem(itemId, screenshotHistory);
    if (!item) return;

    // Set as active item
    setActiveHistoryItemId(itemId);
    setViewingHistoryItem(true);
    setCurrentScreenshot(item.screenshotUrl);

    // Display the response if available
    if (item.response) {
      setResponseData({
        type: 'history',
        message: 'Viewing item from history',
        content: item.response,
      });
    }

    // Close the history panel
    setShowHistoryPanel(false);
  };

  // Handle custom instruction change
  const handleCustomInstructionChange = (instruction) => {
    setCustomInstruction(instruction);
  };

  return (
    <div className="container">
      <Header
        onHistoryToggle={handleToggleHistory}
        onSettingsToggle={handleToggleSettings}
        viewingHistoryItem={viewingHistoryItem}
        showHistoryPanel={showHistoryPanel}
        showSettingsPanel={showSettingsPanel}
      />

      {/* Main content section that will be hidden when history or settings is open */}
      {!showHistoryPanel && !showSettingsPanel && (
        <div className="main-content" id="mainContent">
          <PreviewArea screenshot={currentScreenshot} />

          {responseData && (
            <ResponseContainer
              data={responseData}
              parseMarkdown={parseMarkdown}
            />
          )}
        </div>
      )}

      {/* History Panel */}
      {showHistoryPanel && (
        <HistoryPanel
          history={screenshotHistory}
          onSelectItem={handleLoadHistoryItem}
        />
      )}

      {/* Settings Panel */}
      {showSettingsPanel && (
        <SettingsPanel
          onCustomInstructionChange={handleCustomInstructionChange}
        />
      )}

      {/* Status bar + Action Button */}
      {!showHistoryPanel && !showSettingsPanel && (
        <>
          {responseData && responseData.message && (
            <div className={`status-bar status-bar--${responseData.type}`}>
              <span className="status-bar__dot" />
              {responseData.message}
            </div>
          )}
          <ActionButton
            onSelectArea={handleSelectArea}
            onTakeScreenshot={handleTakeScreenshot}
            onSendToGemini={handleSendToGemini}
            onClearResults={() => { setResponseData(null); setCurrentScreenshot(null); }}
            onBackToHistory={handleBackToHistory}
            onCancelSelectArea={handleCancelSelectArea}
            isLoading={isLoading}
            hasScreenshot={!!currentScreenshot}
            hasResponse={!!(responseData && (responseData.type === 'success' || responseData.type === 'history'))}
            viewingHistoryItem={viewingHistoryItem}
            isSelectingArea={isSelectingArea}
          />
        </>
      )}
    </div>
  );
}
