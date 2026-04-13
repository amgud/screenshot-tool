# Gemini Screenshots Chrome Extension

A Chrome extension that allows users to capture screenshots of web pages and analyze them using Google's Gemini AI. This tool provides both visible-viewport screenshots and the ability to select specific areas of a page for analysis.

## Features

- **Visible Viewport Screenshots**: Capture the currently visible portion of a webpage with a single click
- **Area Selection**: Select and screenshot a specific region of a webpage using a drag-to-select overlay
- **Gemini AI Integration**: Send screenshots to Google's Gemini AI (gemini-flash-latest model) for analysis with customizable instructions
- **Screenshot History**: Automatically saves up to 50 screenshots with AI responses for later review
- **Custom Instructions**: Configure the prompt sent to Gemini AI to tailor the analysis
- **Markdown Responses**: AI responses are rendered as formatted markdown (GitHub Flavored Markdown)
- **Side Panel UI**: All controls, previews, and settings in a convenient Chrome side panel built with React

## How It Works

### Visible Viewport Screenshot

1. Click **"Full Page"** in the side panel
2. The extension calls Chrome's `captureVisibleTab` API to capture the currently visible viewport as a PNG image
3. The screenshot appears in the preview area, ready to be sent to Gemini AI

> **Note**: This captures only what is currently visible on screen, not the entire scrollable page.

### Area Selection Screenshot

1. Click **"Select Area"** in the side panel
2. The extension injects a semi-transparent dark overlay (`rgba(0, 0, 0, 0.3)`) over the entire page and changes the cursor to a crosshair
3. Click and drag to draw a selection rectangle (shown as a blue dashed border with a light blue fill)
4. On mouse release, the extension:
   - Records the selected coordinates, scaled by `devicePixelRatio` to support high-DPI displays
   - Hides the overlay using a double `requestAnimationFrame` technique to ensure the overlay is fully removed before capture
   - Captures the full visible viewport via `captureVisibleTab`
   - Crops the captured image to the selected area using the Canvas API
5. The cropped screenshot appears in the preview area
6. Press **Escape** at any time to cancel the selection

### Gemini AI Analysis

1. After capturing a screenshot, click **"Send to Gemini AI"**
2. The image is sent as base64-encoded PNG data along with a text instruction to the Gemini API (`gemini-flash-latest` model)
3. The default instruction is: *"Answer the question from the screenshot concisely."* — this can be customized in Settings
4. The AI response is rendered as formatted markdown below the screenshot
5. The screenshot and response are automatically saved to history

### Screenshot History

- The extension stores up to 50 screenshot + response pairs in `chrome.storage.local`
- Each entry includes a compressed JPEG thumbnail (300px wide, 0.7 quality) for efficient storage
- Click the history icon in the header to browse past screenshots
- Click any history item to view the full screenshot and AI response
- Individual history items can be deleted

### Settings

- **Custom Instructions**: A text prompt sent with every Gemini request — customize it to control how the AI analyzes your screenshots
- **API Key**: Your Gemini API key, stored locally in `chrome.storage.local` and never sent anywhere except Google's API endpoint

## Development

### Prerequisites

- [Bun](https://bun.sh/) runtime (used instead of Node/npm)

### Setup

```bash
bun install
```

### Dev Mode

```bash
bun run dev
```

This starts a WebSocket dev server on port 8181 and watches source files for changes. The extension auto-reloads when files are modified (`.js` and `.css` changes in `dist/` trigger a reload with 400ms debounce).

### Production Build

```bash
bun run build
```

### Package for Distribution

```bash
bun run package
```

Builds the extension and creates a `screenshot-tool-extension.zip` file.

### Creating a Release

This project uses GitHub Actions to automate the release process. Run the release command and pick a version bump type:

```bash
bun run release          # interactive prompt to pick next version
bun run release patch    # bump patch version (1.0.0 → 1.0.1)
bun run release minor    # bump minor version (1.0.0 → 1.1.0)
bun run release major    # bump major version (1.0.0 → 2.0.0)
bun run release 1.2.3    # set an explicit version
```

This will:

- Update the version in `manifest.json` and `package.json`
- Commit the changes
- Create and push a new tag (e.g., `v1.0.1`)
- Trigger the GitHub Actions workflow to create a release

The release will be automatically created on GitHub with the packaged extension attached.

## About This Project

This project was developed with assistance from GitHub Copilot, which contributed approximately 75-80% of the code. The AI helped generate the core functionality, while human input was essential for fine-tuning the user experience and integrating with Chrome extension APIs. The extension demonstrates practical application of Google's Gemini AI API for image analysis within a browser context.

## Installation

### Local Installation (Development Mode)

1. Clone this repository or download the source code:

   ```
   git clone <repository-url>
   ```

   or download and extract the ZIP file

2. Install dependencies:

   ```
   bun install
   ```

3. Build the extension:

   ```
   bun run build
   ```

4. Open Chrome and navigate to `chrome://extensions/`

5. Enable "Developer mode" by toggling the switch in the top right corner

6. Click "Load unpacked" and select the `dist/` directory

7. The extension should now appear in your Chrome toolbar

### Setting Up Your Gemini API Key

1. Obtain a Gemini API key from [Google AI Studio](https://ai.google.dev/)

2. In the extension's side panel, click the ⚙️ (Settings) icon

3. Enter your API key in the provided field and click "Save"

## Usage

1. Click the extension icon in your toolbar to toggle the side panel open/closed

2. To capture the visible viewport, click **"Full Page"**

3. To capture a specific area, click **"Select Area"**, then drag to draw a selection rectangle on the page

4. After capturing a screenshot, click **"Send to Gemini AI"** to analyze the image

5. The AI's analysis will appear below the screenshot, rendered as formatted markdown

6. Click the history icon to browse and revisit past screenshots and responses

## Technologies Used

- React 19 with JSX
- Chrome Extension APIs (Manifest V3)
- Google Gemini AI API (gemini-flash-latest)
- Canvas API (image cropping and thumbnail generation)
- [marked](https://github.com/markedjs/marked) (markdown rendering)
- Bun (runtime, bundler, and package manager)

## Requirements

- Google Chrome browser
- Gemini API key
- Bun runtime (for development)

## Privacy Note

This extension processes screenshots locally and only sends them to Google's Gemini API when you explicitly click the "Send to Gemini AI" button. Your API key is stored in your browser's local storage and is never sent to any server except Google's API endpoints.

## License

[MIT License](LICENSE)
