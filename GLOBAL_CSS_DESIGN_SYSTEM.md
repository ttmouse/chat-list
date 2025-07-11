# 全局CSS设计系统

## 项目状态：✅ 已实施

本项目已成功实施全局CSS设计系统，实现了样式的统一管理和复用。

## 🎯 目标
建立统一的CSS设计系统，避免重复代码，提高维护效率，确保视觉一致性。

## 📁 文件结构重组

```
styles/
├── variables.css          # CSS变量定义
├── base.css              # 基础样式重置
├── components.css        # 可复用组件样式
├── layout.css           # 布局相关样式
├── utilities.css        # 工具类样式
└── main.css            # 主入口文件（导入所有样式）
```

## 🎨 CSS变量系统

### 颜色系统
```css
:root {
  /* 主色调 */
  --primary-color: #007bff;
  --primary-hover: #0056b3;
  --primary-light: #e3f2fd;
  
  /* 次要色调 */
  --secondary-color: #6c757d;
  --secondary-hover: #545b62;
  
  /* 状态色 */
  --success-color: #28a745;
  --warning-color: #ffc107;
  --danger-color: #dc3545;
  --info-color: #17a2b8;
  
  /* 中性色 */
  --gray-50: #f8f9fa;
  --gray-100: #e9ecef;
  --gray-200: #dee2e6;
  --gray-300: #ced4da;
  --gray-400: #adb5bd;
  --gray-500: #6c757d;
  --gray-600: #495057;
  --gray-700: #343a40;
  --gray-800: #212529;
  --gray-900: #000000;
  
  /* 分组颜色 */
  --group-color-1: #4CAF50;
  --group-color-2: #2196F3;
  --group-color-3: #FF9800;
  --group-color-4: #9C27B0;
  --group-color-5: #F44336;
  --group-color-6: #00BCD4;
}
```

### 间距系统
```css
:root {
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
  --spacing-xl: 20px;
  --spacing-2xl: 24px;
  --spacing-3xl: 32px;
}
```

### 字体系统
```css
:root {
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-size-xs: 10px;
  --font-size-sm: 11px;
  --font-size-base: 14px;
  --font-size-lg: 16px;
  --font-size-xl: 18px;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
}
```

### 圆角和阴影
```css
:root {
  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 12px;
  --border-radius-xl: 14px;
  --border-radius-pill: 20px;
  
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 12px 40px rgba(0, 0, 0, 0.15);
}
```

## 🧩 可复用组件

### 按钮组件
```css
/* 基础按钮 */
.cls-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-sm) var(--spacing-lg);
  border: 1px solid transparent;
  border-radius: var(--border-radius-sm);
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 80px;
}

/* 按钮变体 */
.cls-btn-primary {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.cls-btn-primary:hover {
  background: var(--primary-hover);
  border-color: var(--primary-hover);
}

.cls-btn-secondary {
  background: var(--gray-50);
  color: var(--gray-600);
  border-color: var(--gray-200);
}

.cls-btn-secondary:hover {
  background: var(--gray-100);
  color: var(--gray-700);
}

/* 按钮尺寸 */
.cls-btn-sm {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-sm);
  min-width: 60px;
}

.cls-btn-lg {
  padding: var(--spacing-md) var(--spacing-xl);
  font-size: var(--font-size-lg);
  min-width: 100px;
}
```

### 表单组件
```css
.cls-form-group {
  margin-bottom: var(--spacing-xl);
}

.cls-form-label {
  display: block;
  margin-bottom: var(--spacing-sm);
  font-weight: var(--font-weight-medium);
  color: var(--gray-700);
  font-size: var(--font-size-base);
}

.cls-form-control {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--gray-300);
  border-radius: var(--border-radius-sm);
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  background: var(--gray-50);
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.cls-form-control:focus {
  outline: none;
  border-color: var(--primary-color);
  background: white;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.cls-form-control.textarea {
  min-height: 80px;
  resize: vertical;
}
```

### 模态框组件
```css
.cls-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 10001;
  backdrop-filter: blur(4px);
}

.cls-modal-content {
  background: white;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  animation: modalSlideIn 0.3s ease;
}

.cls-modal-header {
  padding: var(--spacing-2xl);
  border-bottom: 1px solid var(--gray-200);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cls-modal-title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--gray-800);
}

.cls-modal-body {
  padding: var(--spacing-2xl);
  overflow-y: auto;
}
```

### 分组标签组件
```css
.group-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  border-bottom: 1px solid var(--gray-200);
  background: white;
  flex-shrink: 0;
  align-items: flex-start;
  line-height: 1.2;
}

.group-tab {
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--gray-50);
  border: 1px solid var(--gray-300);
  border-radius: var(--border-radius-xl);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--gray-600);
  white-space: nowrap;
  min-height: 24px;
  display: flex;
  align-items: center;
}

.group-tab:hover {
  background: var(--gray-100);
  color: var(--gray-800);
}

.group-tab.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
  font-weight: var(--font-weight-semibold);
}
```

## 🛠️ 工具类

### 间距工具类
```css
.m-0 { margin: 0; }
.m-1 { margin: var(--spacing-xs); }
.m-2 { margin: var(--spacing-sm); }
.m-3 { margin: var(--spacing-md); }
.m-4 { margin: var(--spacing-lg); }
.m-5 { margin: var(--spacing-xl); }

.p-0 { padding: 0; }
.p-1 { padding: var(--spacing-xs); }
.p-2 { padding: var(--spacing-sm); }
.p-3 { padding: var(--spacing-md); }
.p-4 { padding: var(--spacing-lg); }
.p-5 { padding: var(--spacing-xl); }

/* 方向性间距 */
.mt-1 { margin-top: var(--spacing-xs); }
.mb-1 { margin-bottom: var(--spacing-xs); }
.ml-1 { margin-left: var(--spacing-xs); }
.mr-1 { margin-right: var(--spacing-xs); }
```

### 文本工具类
```css
.text-center { text-align: center; }
.text-left { text-align: left; }
.text-right { text-align: right; }

.text-primary { color: var(--primary-color); }
.text-secondary { color: var(--secondary-color); }
.text-success { color: var(--success-color); }
.text-warning { color: var(--warning-color); }
.text-danger { color: var(--danger-color); }

.font-weight-normal { font-weight: var(--font-weight-normal); }
.font-weight-medium { font-weight: var(--font-weight-medium); }
.font-weight-semibold { font-weight: var(--font-weight-semibold); }
.font-weight-bold { font-weight: var(--font-weight-bold); }
```

### 显示工具类
```css
.d-none { display: none; }
.d-block { display: block; }
.d-flex { display: flex; }
.d-inline-flex { display: inline-flex; }

.flex-column { flex-direction: column; }
.flex-row { flex-direction: row; }
.justify-content-center { justify-content: center; }
.justify-content-between { justify-content: space-between; }
.align-items-center { align-items: center; }
.align-items-start { align-items: flex-start; }
```

## 📋 实施计划

### 第一阶段：创建设计系统文件
1. 创建 `styles/` 目录
2. 拆分 `content.css` 为模块化文件
3. 定义CSS变量和基础组件

### 第二阶段：重构现有代码
1. 替换内联样式为工具类
2. 统一组件样式使用
3. 移除重复的CSS定义

### 第三阶段：优化和测试
1. 测试所有页面的样式一致性
2. 优化CSS文件大小
3. 建立样式指南文档

## 🎯 预期效果

1. **减少50%以上的CSS代码重复**
2. **提高样式一致性**
3. **简化维护工作**
4. **提升开发效率**
5. **更好的可扩展性**

## 📝 使用规范

### ✅ 推荐做法
```css
/* 使用CSS变量 */
.custom-button {
  background: var(--primary-color);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-sm);
}

/* 使用工具类 */
<div class="d-flex justify-content-between align-items-center p-3">
```

### ❌ 避免做法
```css
/* 避免硬编码值 */
.custom-button {
  background: #007bff;
  padding: 8px 12px;
  border-radius: 4px;
}

/* 避免内联样式 */
<div style="display: flex; justify-content: space-between;">
```

## 🔄 迁移指南

1. **逐步迁移**：不要一次性替换所有样式
2. **保持向后兼容**：在迁移期间保留旧样式
3. **测试验证**：每次迁移后进行充分测试
4. **文档更新**：及时更新相关文档

这个设计系统将大大提高代码的可维护性和一致性，减少重复工作，提升开发效率。