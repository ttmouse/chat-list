# ⌘G 快捷键兼容性修复说明

## 问题描述

用户反馈 ⌘G 快捷键在某些浏览器中有效，某些不行。这是一个常见的跨浏览器兼容性问题。

## 问题原因分析

### 1. 平台差异
- **Mac**: 使用 `metaKey` (⌘ 键)
- **Windows/Linux**: 使用 `ctrlKey` (Ctrl 键)
- 原代码使用 `(e.metaKey || e.ctrlKey)` 可能在某些浏览器中不够准确

### 2. 键盘事件检测差异
- 不同浏览器对 `e.key` 属性的支持程度不同
- 老版本浏览器可能需要使用 `e.keyCode` 作为备选

### 3. 事件处理优先级
- 其他脚本可能干扰快捷键处理
- 浏览器默认行为可能无法被正确阻止

### 4. 事件传播问题
- 事件冒泡阶段可能被其他监听器拦截
- 需要使用事件捕获阶段确保优先处理

## 修复方案

### 1. 增强的平台检测

```javascript
// 检测操作系统平台
const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
const isModifierPressed = isMac ? e.metaKey : e.ctrlKey;
```

### 2. 兼容的键盘检测

```javascript
// 同时支持 e.key 和 e.keyCode
const isGPressed = e.key && e.key.toLowerCase() === 'g' || e.keyCode === 71;
```

### 3. 增强的事件阻止

```javascript
// 防止默认行为和事件传播
e.preventDefault();
e.stopImmediatePropagation();
```

### 4. 事件捕获优先级

```javascript
// 使用事件捕获阶段
document.addEventListener('keydown', handler, true);
```

## 完整的修复代码

```javascript
// 全局快捷键监听 - ⌘+g 启动搜索
document.addEventListener('keydown', (e) => {
  // 增强的快捷键检测，提高跨浏览器兼容性
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const isModifierPressed = isMac ? e.metaKey : e.ctrlKey;
  const isGPressed = e.key && e.key.toLowerCase() === 'g' || e.keyCode === 71;
  
  if (isModifierPressed && isGPressed) {
    // 防止浏览器默认的查找行为
    e.preventDefault();
    e.stopImmediatePropagation(); // 防止其他脚本干扰
    
    // ... 其他处理逻辑
  }
}, true); // 使用事件捕获阶段，确保优先处理
```

## 测试方法

1. 打开 `test-shortcut-compatibility.html` 测试页面
2. 在不同浏览器中测试 ⌘G 快捷键
3. 查看事件日志和兼容性测试结果
4. 根据测试结果进一步调整代码

## 支持的浏览器

修复后的代码应该支持以下浏览器：

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+
- ✅ Opera 47+

## 已知限制

1. **某些网站的 CSP 策略**可能阻止内容脚本的键盘事件监听
2. **其他扩展程序**可能与快捷键冲突
3. **浏览器的无障碍功能**可能影响键盘事件处理

## 进一步优化建议

### 1. 添加调试模式

```javascript
const DEBUG_SHORTCUTS = false; // 可通过配置开启

if (DEBUG_SHORTCUTS) {
  console.log('快捷键事件:', {
    key: e.key,
    keyCode: e.keyCode,
    metaKey: e.metaKey,
    ctrlKey: e.ctrlKey,
    platform: navigator.platform
  });
}
```

### 2. 添加备选快捷键

```javascript
// 支持多个快捷键组合
const shortcuts = [
  { meta: true, key: 'g' },      // ⌘G
  { ctrl: true, key: 'g' },      // Ctrl+G
  { alt: true, key: 's' },       // Alt+S (备选)
];
```

### 3. 用户自定义快捷键

允许用户在设置中自定义快捷键组合，提高灵活性。

## 更新日志

- **v1.3.6**: 修复 ⌘G 快捷键跨浏览器兼容性问题
  - 增强平台检测逻辑
  - 添加 keyCode 备选支持
  - 使用事件捕获阶段
  - 添加 stopImmediatePropagation 防止干扰

## 相关文件

- `content.js`: 主要修复代码
- `test-shortcut-compatibility.html`: 兼容性测试页面
- `SHORTCUT_COMPATIBILITY_FIX.md`: 本说明文档