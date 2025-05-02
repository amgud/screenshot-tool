import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ScreenshotButtons from './components/ScreenshotButtons';
import PreviewArea from './components/PreviewArea';
import ResponseContainer from './components/ResponseContainer';
import HistoryPanel from './components/HistoryPanel';
import SettingsPanel from './components/SettingsPanel';
import ActionButtons from './components/ActionButtons';
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

const App = () => {
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
      if (request.action === 'areaScreenshot') {
        console.log('Area screenshot request received:', request);
        // Capture the selected area
        chrome.tabs.captureVisibleTab(
          null,
          { format: 'png' },
          async (dataUrl) => {
            if (chrome.runtime.lastError) {
              console.error(
                'Error capturing screenshot:',
                chrome.runtime.lastError
              );
              return;
            }

            try {
              // Process the area screenshot
              const croppedDataUrl = await processAreaScreenshot(
                dataUrl,
                request.area,
                request.devicePixelRatio
              );

              // Update the screenshot state
              setCurrentScreenshot(croppedDataUrl);
              setResponseData(null);
            } catch (error) {
              console.error('Error processing area screenshot:', error);
            }

            return true;
          }
        );
      }

      if (request.action === 'closeSidePanel') {
        window.close();
        return true;
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    // Clean up listener on component unmount
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

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
        // Send message to content script to enable selection mode
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: 'enableSelection' },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error(
                'Error enabling selection:',
                chrome.runtime.lastError
              );
              setResponseData({
                type: 'error',
                message:
                  'Error enabling selection: ' +
                  chrome.runtime.lastError.message,
              });
              return;
            }
            console.log('Selection mode enabled', response);
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
            message: 'Screenshot sent to Gemini AI successfully!',
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
    if (viewingHistoryItem) {
      // Reset history view
      setViewingHistoryItem(false);
      setActiveHistoryItemId(null);
      setCurrentScreenshot(null);
      setResponseData(null);
      return;
    }

    // Close settings panel if open
    if (showSettingsPanel) {
      setShowSettingsPanel(false);
    }

    // Toggle history panel
    const newHistoryState = !showHistoryPanel;
    setShowHistoryPanel(newHistoryState);

    // Load history when panel is opened
    if (newHistoryState) {
      loadHistoryPanel();
    }
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
          {!viewingHistoryItem && (
            <ScreenshotButtons
              onTakeScreenshot={handleTakeScreenshot}
              onSelectArea={handleSelectArea}
            />
          )}

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

      {/* Action Buttons */}
      {!showHistoryPanel && !showSettingsPanel && (
        <ActionButtons
          onSendToGemini={handleSendToGemini}
          disabled={!currentScreenshot || isLoading}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default App;
