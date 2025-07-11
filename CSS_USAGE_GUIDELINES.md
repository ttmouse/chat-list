# CSS使用规范和最佳实践

## 概述

本文档定义了项目中CSS的使用规范，确保代码的一致性、可维护性和可扩展性。

## 核心原则

### 1. 优先级原则
1. **全局CSS变量** - 使用CSS变量定义设计令牌
2. **组件类** - 使用语义化的组件类名
3. **工具类** - 使用原子级工具类处理简单样式
4. **内联样式** - 仅在动态样式或特殊情况下使用

### 2. 命名规范

#### CSS变量命名
```css
/* 颜色变量 */
--primary-color
--secondary-color
--success-color

/* 间距变量 */
--spacing-xs
--spacing-sm
--spacing-md

/* 字体变量 */
--font-size-base
--font-weight-medium
```

#### 组件类命名
```css
/* 组件名-元素名-修饰符 */
.btn                    /* 基础按钮 */
.btn-primary           /* 主要按钮 */
.btn-sm               /* 小尺寸按钮 */

.modal                /* 模态框 */
.modal-header         /* 模态框头部 */
.modal-dialog-centered /* 居中的模态框 */
```

#### 工具类命名
```css
/* 属性缩写-值 */
.m-0, .m-1, .m-2      /* margin */
.p-0, .p-1, .p-2      /* padding */
.text-center          /* text-align: center */
.d-flex              /* display: flex */
```

## 使用指南

### 1. 颜色使用

**✅ 推荐做法：**
```css
.custom-element {
  color: var(--primary-color);
  background-color: var(--gray-100);
  border-color: var(--gray-300);
}
```

**❌ 避免做法：**
```css
.custom-element {
  color: #007bff;
  background-color: #f8f9fa;
  border-color: #dee2e6;
}
```

### 2. 间距使用

**✅ 推荐做法：**
```html
<!-- 使用工具类 -->
<div class="mb-4 p-3">内容</div>

<!-- 或使用CSS变量 -->
<style>
.custom-spacing {
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
}
</style>
```

**❌ 避免做法：**
```html
<div style="margin-bottom: 16px; padding: 12px;">内容</div>
```

### 3. 组件样式

**✅ 推荐做法：**
```html
<!-- 使用标准组件类 -->
<button class="btn btn-primary btn-lg">保存</button>
<div class="form-group">
  <label class="form-label">标题</label>
  <input class="form-control" type="text">
</div>
```

**❌ 避免做法：**
```html
<!-- 自定义样式类 -->
<button class="my-custom-button">保存</button>
```

### 4. 布局使用

**✅ 推荐做法：**
```html
<div class="d-flex justify-between items-center">
  <span>标题</span>
  <button class="btn btn-sm">操作</button>
</div>
```

**❌ 避免做法：**
```html
<div style="display: flex; justify-content: space-between; align-items: center;">
  <span>标题</span>
  <button>操作</button>
</div>
```

## 扩展指南

### 1. 新增CSS变量

在 `styles/variables.css` 中添加新变量：

```css
:root {
  /* 新增颜色 */
  --brand-color: #ff6b6b;
  
  /* 新增间距 */
  --spacing-4xl: 40px;
  
  /* 新增字体 */
  --font-size-2xl: 24px;
}
```

### 2. 新增组件样式

在 `styles/components/` 目录下创建新的组件文件：

```css
/* styles/components/cards.css */
.card {
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
}

.card-header {
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--gray-200);
}

.card-body {
  padding: var(--spacing-lg);
}
```

然后在 `styles/global.css` 中导入：

```css
@import url('./components/cards.css');
```

### 3. 新增工具类

在 `styles/utilities.css` 中添加新的工具类：

```css
/* 新的显示工具类 */
.d-grid { display: grid; }
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }

/* 新的间距工具类 */
.gap-1 { gap: var(--spacing-xs); }
.gap-2 { gap: var(--spacing-sm); }
.gap-3 { gap: var(--spacing-md); }
```

## 性能优化

### 1. CSS文件组织

```
styles/
├── variables.css      # CSS变量定义
├── base.css          # 基础样式重置
├── components/       # 组件样式
│   ├── buttons.css
│   ├── forms.css
│   └── modals.css
├── utilities.css     # 工具类
└── global.css       # 主入口文件
```

### 2. 选择器优化

**✅ 推荐做法：**
```css
.btn { /* 低特异性 */ }
.btn-primary { /* 适中特异性 */ }
```

**❌ 避免做法：**
```css
div.container .content .btn.primary { /* 过高特异性 */ }
```

### 3. 避免重复

**✅ 推荐做法：**
```css
/* 使用组合类 */
.btn.btn-primary.btn-lg
```

**❌ 避免做法：**
```css
/* 重复定义相似样式 */
.save-button { /* 与 .btn-primary 重复 */ }
.submit-button { /* 与 .btn-primary 重复 */ }
```

## 调试和维护

### 1. 样式调试

使用浏览器开发者工具检查：
- CSS变量的计算值
- 样式的继承和覆盖关系
- 组件类的应用情况

### 2. 代码审查检查点

- [ ] 是否使用了CSS变量而不是硬编码值
- [ ] 是否优先使用了现有的组件类
- [ ] 是否合理使用了工具类
- [ ] 是否避免了不必要的内联样式
- [ ] 新增的样式是否遵循命名规范

### 3. 兼容性考虑

- CSS变量在IE中不支持，需要提供fallback
- Flexbox和Grid的浏览器兼容性
- 新CSS特性的渐进增强

## 常见问题

### Q: 什么时候可以使用内联样式？
A: 仅在以下情况使用：
- 动态计算的样式值
- 第三方组件的样式覆盖
- 临时调试

### Q: 如何处理样式优先级冲突？
A: 
1. 优先调整HTML结构和类名顺序
2. 使用更具体的组件类
3. 最后考虑使用 `!important`

### Q: 如何确保样式的一致性？
A: 
1. 严格使用CSS变量
2. 定期进行代码审查
3. 使用样式指南进行验收

## 工具推荐

1. **CSS变量检查器** - 浏览器扩展，检查CSS变量使用情况
2. **样式指南生成器** - 自动生成组件样式文档
3. **CSS优化工具** - 检测重复和未使用的样式