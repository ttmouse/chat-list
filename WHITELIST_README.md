# 话术助手白名单功能说明

## 功能概述

白名单功能允许您控制话术助手在哪些网站上显示和工作。只有在白名单中的网站才会显示话术浮层，其他网站将不会加载话术助手的UI组件。

## 默认白名单

扩展默认包含以下网站的白名单：

- `https://www.larksuite.com/hc/zh-CN/chat` - 飞书客服聊天页面
- `https://oa.zalo.me/chat` - Zalo聊天页面

## 白名单匹配规则

1. **完整URL匹配**：如果当前页面URL完全匹配白名单中的某个URL，则允许显示
2. **前缀匹配**：如果白名单URL不包含查询参数（?），则进行前缀匹配
3. **带参数匹配**：如果白名单URL包含查询参数，则要求当前URL以该白名单URL开头

### 匹配示例

假设白名单包含：`https://example.com/chat`

✅ **匹配的URL：**
- `https://example.com/chat`
- `https://example.com/chat?id=123`
- `https://example.com/chat/room/456`

❌ **不匹配的URL：**
- `https://example.com/`
- `https://example.com/support`
- `https://other.com/chat`

## 配置白名单

### 方法1：通过扩展存储（推荐）

白名单配置存储在浏览器的扩展存储中，键名为 `siteWhitelist`。您可以通过以下方式修改：

```javascript
// 在浏览器控制台中执行
chrome.storage.local.set({
  siteWhitelist: [
    'https://www.larksuite.com/hc/zh-CN/chat',
    'https://oa.zalo.me/chat',
    'https://your-custom-site.com/chat'
  ]
});
```

### 方法2：修改代码

在 `content.js` 文件中找到 `getDefaultWhitelist()` 方法，修改返回的数组：

```javascript
getDefaultWhitelist() {
  return [
    'https://www.larksuite.com/hc/zh-CN/chat',
    'https://oa.zalo.me/chat',
    'https://your-custom-site.com/chat'  // 添加新的网站
  ];
}
```

## 测试白名单功能

1. 打开 `test-whitelist.html` 文件
2. 检查页面上的扩展状态
3. 查看浏览器控制台的日志信息

### 预期行为

- **在白名单网站**：应该看到话术助手浮层，控制台显示"当前网站在白名单中，初始化话术扩展"
- **不在白名单网站**：不应该看到话术助手浮层，控制台显示"当前网站不在白名单中，跳过初始化话术扩展"

## 调试信息

扩展会在浏览器控制台输出相关的调试信息：

```
当前网站在白名单中，初始化话术扩展
```

或

```
当前网站不在白名单中，跳过初始化话术扩展
```

## 常见问题

### Q: 为什么在某个网站上看不到话术助手？
A: 请检查该网站是否在白名单中。打开浏览器控制台查看相关日志信息。

### Q: 如何添加新的网站到白名单？
A: 可以通过修改扩展存储或直接修改代码中的 `getDefaultWhitelist()` 方法。

### Q: 白名单支持通配符吗？
A: 目前不支持通配符，但支持前缀匹配。例如 `https://example.com/chat` 可以匹配 `https://example.com/chat/room/123`。

### Q: 如何禁用白名单功能？
A: 可以在 `isWhitelistedSite()` 方法中直接返回 `true`，这样扩展将在所有网站上工作。

## 安全考虑

白名单功能有助于：

1. **减少资源消耗**：只在需要的网站上加载扩展功能
2. **提高安全性**：避免在不必要的网站上运行扩展代码
3. **改善用户体验**：避免在不相关的网站上显示话术助手

## 更新日志

- **v1.3.4**: 添加白名单功能，支持动态配置和存储