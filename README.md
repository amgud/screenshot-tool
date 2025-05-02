# Gemini Screenshots Chrome Extension

A Chrome extension that allows users to capture screenshots of web pages and analyze them using Google's Gemini AI. This tool provides both full-page screenshots and the ability to select specific areas of a page for analysis.

## Features

- **Full-page Screenshots**: Capture the entire visible portion of a webpage
- **Area Selection**: Select and screenshot specific areas of a webpage
- **Gemini AI Integration**: Send screenshots to Gemini AI for detailed image analysis
- **Convenient Side Panel**: All controls and previews in an easy-to-use side panel

## About This Project

This project was developed with assistance from GitHub Copilot, which contributed approximately 75-80% of the code. The AI helped generate the core functionality, while human input was essential for fine-tuning the user experience and integrating with Chrome extension APIs. The extension demonstrates practical application of Google's Gemini AI API for image analysis within a browser context.

## Installation

### Local Installation (Development Mode)

1. Clone this repository or download the source code:

   ```
   git clone <repository-url>
   ```

   or download and extract the ZIP file

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" by toggling the switch in the top right corner

4. Click "Load unpacked" and select the directory containing the extension files

5. The extension should now appear in your Chrome toolbar

### Setting Up Your Gemini API Key

1. Obtain a Gemini API key from [Google AI Studio](https://ai.google.dev/)

2. In the extension's side panel, click the ⚙️ (Settings) icon

3. Enter your API key in the provided field and click "Save"

## Usage

1. Click the extension icon in your toolbar to open the side panel

2. To take a full-page screenshot, click "Take Screenshot"

3. To capture a specific area, click "Select Area" and drag to create a selection

4. After capturing a screenshot, click "Send to Gemini AI" to analyze the image

5. The AI's analysis will appear below the screenshot in the side panel

## Technologies Used

- JavaScript
- Chrome Extension APIs
- Google Gemini AI API

## Requirements

- Google Chrome browser
- Gemini API key

## Privacy Note

This extension processes screenshots locally and only sends them to Google's Gemini API when you explicitly click the "Send to Gemini AI" button. Your API key is stored in your browser's local storage and is never sent to any server except Google's API endpoints.

## License

[MIT License](LICENSE)
