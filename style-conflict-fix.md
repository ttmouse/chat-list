# 插件样式冲突解决方案

## 问题分析

当前插件的CSS样式使用了许多通用的类名，这些类名可能与页面现有的样式发生冲突，导致样式覆盖或显示异常。

## 发现的冲突类名

### 高风险冲突类名
以下类名在网页开发中非常常见，极易发生冲突：

1. **`.btn`** - 按钮基础类，几乎所有CSS框架都使用
2. **`.btn-primary`** - 主要按钮样式，Bootstrap等框架的标准类名
3. **`.btn-secondary`** - 次要按钮样式
4. **`.modal-overlay`** - 模态框遮罩层
5. **`.modal-content`** - 模态框内容容器
6. **`.modal-header`** - 模态框头部
7. **`.modal-body`** - 模态框主体
8. **`.form-group`** - 表单组容器
9. **`.form-label`** - 表单标签
10. **`.form-control`** - 表单控件
11. **`.form-actions`** - 表单操作区域
12. **`.error-message`** - 错误消息
13. **`.success-message`** - 成功消息

### 中等风险冲突类名
这些类名也比较常见：

1. **`.btn-close-modal`** - 关闭模态框按钮
2. **`.btn-add-group`** - 添加分组按钮
3. **`.btn-edit-group`** - 编辑分组按钮
4. **`.btn-delete-group`** - 删除分组按钮
5. **`.group-item`** - 分组项目
6. **`.group-name`** - 分组名称

## 解决方案

### 1. 添加插件特定前缀
为所有CSS类名添加 `cls-` (chat-list-script) 前缀，确保唯一性：

```css
/* 原来的类名 */
.btn { ... }
.modal-header { ... }
.form-control { ... }

/* 修改后的类名 */
.cls-btn { ... }
.cls-modal-header { ... }
.cls-form-control { ... }
```

### 2. 使用CSS作用域隔离
确保所有样式都在插件的根容器内：

```css
/* 所有样式都应该在 #chat-list-widget 内 */
#chat-list-widget .cls-btn { ... }
#chat-list-widget .cls-modal-header { ... }
```

### 3. 提高CSS选择器优先级
使用更具体的选择器来确保插件样式不被覆盖：

```css
/* 使用ID选择器提高优先级 */
#chat-list-widget .cls-modal-overlay .cls-modal-content .cls-btn {
    /* 样式定义 */
}
```

## 实施步骤

### 第一步：重命名CSS类名
需要修改的主要类名映射：

| 原类名 | 新类名 |
|--------|--------|
| `.btn` | `.cls-btn` |
| `.btn-primary` | `.cls-btn-primary` |
| `.btn-secondary` | `.cls-btn-secondary` |
| `.modal-overlay` | `.cls-modal-overlay` |
| `.modal-content` | `.cls-modal-content` |
| `.modal-header` | `.cls-modal-header` |
| `.modal-body` | `.cls-modal-body` |
| `.form-group` | `.cls-form-group` |
| `.form-label` | `.cls-form-label` |
| `.form-control` | `.cls-form-control` |
| `.form-actions` | `.cls-form-actions` |
| `.error-message` | `.cls-error-message` |
| `.success-message` | `.cls-success-message` |

### 第二步：更新HTML模板
修改所有相关的HTML模板和JavaScript代码中的类名引用。

### 第三步：更新JavaScript代码
修改所有JavaScript文件中对这些类名的引用。

## 预期效果

1. **完全避免样式冲突** - 使用唯一前缀确保不与页面样式冲突
2. **保持功能完整** - 所有插件功能正常工作
3. **提高兼容性** - 在各种网站上都能正常显示
4. **便于维护** - 统一的命名规范便于后续维护

## 注意事项

1. 修改过程中要确保所有引用都同步更新
2. 测试时要在不同的网站上验证兼容性
3. 考虑使用CSS-in-JS或CSS Modules等现代化方案
4. 保持样式的语义化和可读性