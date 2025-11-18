# GEMINI.md - 话术助手

## 项目概览

本项目是一个名为“话术助手”的浏览器扩展。它旨在帮助用户在任何网页上管理和快速使用常用短语。该扩展会显示一个浮动的预设短语列表，点击短语即可自动填充到当前活动的输入字段中。

**主要技术：**

*   **Manifest V3：** Chrome 扩展的当前标准。
*   **JavaScript (ES6+)：** 核心逻辑使用现代、模块化的纯 JavaScript 编写，不依赖任何主要的外部框架。
*   **HTML & CSS：** 用于扩展 UI 组件（浮动小部件和弹出窗口）的结构和样式。
*   **Chrome 存储 API (`chrome.storage.local`)：** 所有用户数据（短语、分组、设置）都存储在用户的本地机器上。

**架构：**

*   **`content.js`：** 主要的内容脚本。它被注入到网页中，负责渲染浮动小部件、处理用户交互（如点击短语）以及管理整体的页面体验。
*   **`popup.html` & `popup.js`：** 这些文件创建了当用户点击浏览器工具栏中的扩展图标时出现的弹出窗口。此弹出窗口提供对设置、统计信息和扩展基本控制的访问。
*   **`modules/` 目录：** 代码根据功能模块化为不同的文件。这包括以下模块：
    *   UI 渲染 (`ui-renderer.js`)
    *   数据管理 (`data-import-export.js`)
    *   短语和分组管理 (`script-management.js`, `group-management.js`)
    *   输入处理 (`input-manager.js`, `input-detector.js`)
*   **`styles/` 目录：** 包含扩展 UI 的 CSS 样式。

## 构建和运行

这是一个浏览器扩展，因此没有传统的“构建”或“运行”命令。要使用它，您需要以开发者模式将其加载到兼容的浏览器中。

**运行扩展：**

1.  打开基于 Chromium 的浏览器（如 Google Chrome 或 Microsoft Edge）。
2.  导航到扩展程序页面（`chrome://extensions` 或 `edge://extensions`）。
3.  启用“开发者模式”（通常是右上角的切换开关）。
4.  点击“加载已解压的扩展程序”。
5.  选择此项目的根目录（`/Users/douba/Downloads/GPT插件/Browser extension/chat-list`）。
6.  扩展程序将安装并准备就绪。

## 开发约定

*   **模块化：** JavaScript 代码被分解为模块，每个模块都有特定的职责（例如，`ScriptManagement`、`GroupManagement`）。这促进了关注点分离。
*   **纯 JS：** 项目依赖于原生浏览器 API 和现代 JavaScript 特性，避免使用外部库和框架。这使得扩展保持轻量。
*   **异步操作：** 代码广泛使用 `async/await` 来与 `chrome.storage` API 和其他异步浏览器特性进行交互。
*   **事件驱动：** 扩展的逻辑是高度事件驱动的，响应用户点击、键盘快捷键以及来自扩展其他部分的消息。
*   **样式：** CSS 变量用于主题化和保持一致的设计（`styles/unified-styles.css`）。
*   **无构建步骤：** 由于未检测到转译器或打包器（如 Webpack 或 Rollup），开发过程非常简单：编辑文件并在浏览器中重新加载扩展即可查看更改。
