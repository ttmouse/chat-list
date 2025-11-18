# GEMINI.md - 话术助手 (Phrase-Cutter Assistant)

## Project Overview

This project is a browser extension called "话术助手" (Phrase-Cutter Assistant). It's designed to help users manage and quickly use frequently used phrases on any webpage. The extension displays a floating list of pre-saved phrases, which can be clicked to automatically fill into the currently active input field.

**Main Technologies:**

*   **Manifest V3:** The current standard for Chrome extensions.
*   **JavaScript (ES6+):** The core logic is written in modern, modular, plain JavaScript without any major external frameworks.
*   **HTML & CSS:** Used for the structure and styling of the extension's UI components (the floating widget and the popup).
*   **Chrome Storage API (`chrome.storage.local`):** All user data (phrases, groups, settings) is stored locally on the user's machine.

**Architecture:**

*   **`content.js`:** The primary content script. It is injected into web pages and is responsible for rendering the floating widget, handling user interactions (like clicking a phrase), and managing the overall on-page experience.
*   **`popup.html` & `popup.js`:** These files create the popup that appears when the user clicks the extension's icon in the browser toolbar. This popup provides access to settings, statistics, and basic controls for the extension.
*   **`modules/` directory:** The code is modularized into different files based on functionality. This includes modules for:
    *   UI Rendering (`ui-renderer.js`)
    *   Data Management (`data-import-export.js`)
    *   Phrase & Group Management (`script-management.js`, `group-management.js`)
    *   Input Handling (`input-manager.js`, `input-detector.js`)
*   **`styles/` directory:** Contains the CSS for the extension's UI.

## Building and Running

This is a browser extension, so there is no traditional "build" or "run" command. To use it, you need to load it into a compatible browser in developer mode.

**To run the extension:**

1.  Open a Chromium-based browser (like Google Chrome or Microsoft Edge).
2.  Navigate to the extensions page (`chrome://extensions` or `edge://extensions`).
3.  Enable "Developer mode" (usually a toggle in the top-right corner).
4.  Click on "Load unpacked".
5.  Select the root directory of this project (`/Users/douba/Downloads/GPT插件/Browser extension/chat-list`).
6.  The extension will be installed and ready to use.

## Development Conventions

*   **Modularity:** The JavaScript code is broken down into modules, each with a specific responsibility (e.g., `ScriptManagement`, `GroupManagement`). This promotes separation of concerns.
*   **Vanilla JS:** The project relies on native browser APIs and modern JavaScript features, avoiding external libraries and frameworks. This keeps the extension lightweight.
*   **Asynchronous Operations:** The code makes extensive use of `async/await` for interacting with the `chrome.storage` API and other asynchronous browser features.
*   **Event-Driven:** The extension's logic is highly event-driven, responding to user clicks, keyboard shortcuts, and messages from other parts of the extension.
*   **Styling:** CSS variables are used for theming and maintaining a consistent design (`styles/unified-styles.css`).
*   **No Build Step:** As there are no transpilers or bundlers (like Webpack or Rollup) detected, development is straightforward: edit the files and reload the extension in the browser to see changes.
