# 全局CSS设计系统迁移指南

## 概述

本指南将帮助您将现有项目迁移到新的全局CSS设计系统，实现样式的统一管理和复用。

## 迁移步骤

### 1. 引入全局CSS

在所有HTML文件的`<head>`部分添加：

```html
<link rel="stylesheet" href="styles/global.css">
```

### 2. 样式类名映射表

| 旧样式类名/内联样式 | 新的全局CSS类 | 说明 |
|-------------------|--------------|------|
| `cls-btn` | `btn` | 基础按钮类 |
| `cls-btn-primary` | `btn btn-primary` | 主要按钮 |
| `cls-btn-secondary` | `btn btn-secondary` | 次要按钮 |
| `cls-form-control` | `form-control` | 表单控件 |
| `cls-form-group` | `form-group` | 表单组 |
| `cls-form-label` | `form-label` | 表单标签 |
| `cls-modal-overlay` | `modal` | 模态框容器 |
| `cls-modal-content` | `modal-content` | 模态框内容 |
| `cls-modal-header` | `modal-header` | 模态框头部 |
| `cls-modal-body` | `modal-body` | 模态框主体 |
| `cls-modal-footer` | `modal-footer` | 模态框底部 |
| `group-tabs` | `group-tabs` | 分组标签容器 |
| `group-tab` | `group-tab` | 分组标签项 |

### 3. 内联样式替换

#### 颜色替换
```css
/* 旧方式 */
color: #007bff;
background: #28a745;

/* 新方式 */
color: var(--primary-color);
background: var(--success-color);
```

#### 间距替换
```css
/* 旧方式 */
margin: 12px;
padding: 16px 20px;

/* 新方式 */
margin: var(--spacing-md);
padding: var(--spacing-lg) var(--spacing-xl);
```

#### 圆角和阴影替换
```css
/* 旧方式 */
border-radius: 8px;
box-shadow: 0 4px 8px rgba(0,0,0,0.1);

/* 新方式 */
border-radius: var(--border-radius-md);
box-shadow: var(--shadow-md);
```

### 4. 工具类使用

#### 间距工具类
```html
<!-- 旧方式 -->
<div style="margin-bottom: 16px; padding: 12px;">

<!-- 新方式 -->
<div class="mb-4 p-3">
```

#### 文本工具类
```html
<!-- 旧方式 -->
<p style="text-align: center; color: #6c757d; font-size: 14px;">

<!-- 新方式 -->
<p class="text-center text-muted text-base">
```

#### 布局工具类
```html
<!-- 旧方式 -->
<div style="display: flex; justify-content: space-between; align-items: center;">

<!-- 新方式 -->
<div class="d-flex justify-between items-center">
```

## 具体文件迁移示例

### popup.html 迁移

**迁移前：**
```html
<style>
.cls-btn {
    padding: 12px 24px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 8px;
}
</style>
```

**迁移后：**
```html
<link rel="stylesheet" href="styles/global.css">
<!-- 移除内联样式，直接使用全局类 -->
<button class="btn btn-primary">按钮</button>
```

### add-script-modal.html 迁移

**迁移前：**
```html
<div class="cls-modal-overlay">
    <div class="cls-modal-content">
        <div class="cls-form-group">
            <input class="cls-form-control">
        </div>
    </div>
</div>
```

**迁移后：**
```html
<div class="modal show">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="form-group">
                <input class="form-control">
            </div>
        </div>
    </div>
</div>
```

## 迁移检查清单

- [ ] 所有HTML文件已引入 `styles/global.css`
- [ ] 移除重复的内联样式定义
- [ ] 替换自定义类名为全局标准类名
- [ ] 使用CSS变量替换硬编码的颜色值
- [ ] 使用工具类替换简单的内联样式
- [ ] 测试所有页面的视觉效果
- [ ] 验证响应式布局正常工作
- [ ] 检查浏览器兼容性

## 注意事项

1. **渐进式迁移**：建议逐个文件进行迁移，避免一次性修改过多文件
2. **保留备份**：迁移前备份原始文件
3. **测试验证**：每次迁移后都要测试功能和样式是否正常
4. **团队协作**：确保团队成员了解新的CSS类名规范

## 常见问题

### Q: 如何处理特殊的自定义样式？
A: 对于无法用全局类表示的特殊样式，可以在组件级别定义，但要使用CSS变量保持一致性。

### Q: 旧的CSS文件是否可以删除？
A: 迁移完成并测试无误后，可以逐步删除旧的CSS文件。

### Q: 如何确保样式优先级正确？
A: 全局CSS使用较低的选择器优先级，组件特定样式可以正常覆盖。

## 性能优化建议

1. **CSS文件合并**：生产环境可以考虑将所有CSS文件合并压缩
2. **按需加载**：大型项目可以考虑按页面加载所需的CSS模块
3. **缓存策略**：设置适当的CSS文件缓存策略

## 维护指南

1. **新增组件**：优先使用现有的全局类，必要时扩展组件库
2. **样式修改**：修改CSS变量而不是具体的样式值
3. **版本管理**：CSS变更要有版本记录和向后兼容性考虑