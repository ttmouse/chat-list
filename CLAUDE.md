# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

话术助手是一个 Chrome 浏览器扩展插件，主要功能是在网页右侧显示悬浮话术列表，支持话术管理和自动填充。该项目使用 Manifest V3 标准开发，采用纯原生 JavaScript 实现，无外部依赖。

## 核心架构

### 模块化设计
项目已进行模块化重构，核心功能拆分为以下模块：

- **主控制器**: `content.js` - ChatListWidget 主类，负责插件生命周期管理
- **模块加载器**: `modules/module-loader.js` - 统一模块初始化管理
- **输入框管理**: `modules/input-*.js` - 输入框检测、选择和内容填充
- **数据管理**: `modules/data-import-export.js` - 话术数据的导入导出
- **界面管理**: `modules/ui-renderer.js`, `modules/modal-management.js` - UI渲染和模态框管理
- **功能模块**: `modules/script-management.js`, `modules/group-management.js` - 话术和分组管理

### 样式系统
采用统一的CSS设计系统：
- 基础与组件样式: `styles/unified-styles.css`（包含变量、按钮/表单/分组/模态等通用样式）
- 主样式: `content.css`（仅保留小部件布局与个性化覆盖）

### 数据存储
使用 Chrome Storage API 进行本地数据存储：
- 话术数据 (`scripts`)
- 分组数据 (`groups`) 
（白名单功能已移除）
- 使用统计 (`usageCount`)

## 开发命令

### 安装和测试
```bash
# 在 Chrome 中加载扩展
# 1. 打开 chrome://extensions/
# 2. 开启开发者模式
# 3. 点击"加载已解压的扩展程序"
# 4. 选择项目根目录

# 重新加载扩展（修改代码后）
# 在 chrome://extensions/ 页面点击重新加载按钮
```

### 调试
```bash
# 查看内容脚本日志
# 在网页上按 F12 打开开发者工具，查看 Console

# 查看扩展背景页日志
# 在 chrome://extensions/ 中点击"查看视图"
```

## 代码约定

### 文件加载顺序
`manifest.json` 中定义的脚本加载顺序重要，必须按以下顺序：
1. `utils.js` - 基础工具函数
2. `modules/common-utils.js` - 通用工具类
3. `modules/module-loader.js` - 模块加载器
4. 其他模块文件
5. `content.js` - 主文件

### 模块依赖关系
- 所有模块都依赖 `ChatListUtils` 通用工具类
- 主类 `ChatListWidget` 通过 `ModuleLoader` 初始化其他模块
- 模块间通过构造函数注入主类实例进行通信

### 样式组织
- 使用CSS变量统一颜色和尺寸定义
- 通用组件样式统一放在 `styles/unified-styles.css` 中，避免重复
- 避免内联样式，所有样式定义在CSS文件中

## 关键技术特性

### 输入框智能识别
- 支持多种输入框类型：input、textarea、contenteditable
- 智能排除搜索框、密码框等非消息输入框
- 焦点历史记录，智能选择最佳填充目标

### 特殊网站适配
- 针对 Zalo 等复杂 SPA 应用的特殊处理
- 支持动态DOM结构的输入框检测

### 数据管理
- JSON格式的导入导出功能
- 话术使用次数统计和排序
- 分组颜色管理和筛选功能

## 重要注意事项

1. **模块拆分进行中**: 根据 `CODE_MODULES_ANALYSIS.md`，仍有部分功能待拆分为独立模块
2. **样式冲突预防**: 所有样式都添加了 `#chatlist-widget` 前缀避免与网页样式冲突
3. **权限最小化**: 仅使用 `storage` 和 `activeTab` 权限，不收集用户数据
4. **兼容性**: 支持 Chrome 88+ 和基于 Chromium 的浏览器

## 常见开发任务

### 添加新模块
1. 在 `modules/` 目录创建新的 `.js` 文件
2. 在 `manifest.json` 中添加脚本引用
3. 在主类中通过 `ModuleLoader` 初始化
4. 确保模块依赖关系正确

### 修改界面样式
1. 优先使用 `styles/unified-styles.css` 中的CSS变量
2. 组件样式添加到对应的 `styles/components/` 文件
3. 确保样式具有正确的作用域前缀

### 调试输入框识别问题
- 使用 `InputDetector.getElementInfo()` 获取元素详细信息
- 检查 `focusHistory` 数组中的元素有效性
（白名单功能已移除）
