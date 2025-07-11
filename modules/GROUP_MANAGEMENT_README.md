# 分组管理模块拆分说明

## 概述

分组管理功能已从 `content.js` 主文件中拆分到独立的 `modules/group-management.js` 模块中，提高了代码的模块化程度和可维护性。

## 拆分前后对比

### 拆分前
- 所有分组管理功能都在 `content.js` 中
- 代码耦合度高，文件过大
- 难以独立测试和维护

### 拆分后
- 分组管理功能独立成 `GroupManagement` 类
- 代码职责清晰，模块化程度高
- 便于独立测试和维护

## 分组管理入口

### 1. UI入口
- **位置**: 管理面板中的"分组管理"区域
- **触发**: 点击侧边栏的"管理"按钮进入管理面板

### 2. 功能入口
- **添加分组**: 点击"添加分组"按钮
- **编辑分组**: 点击分组列表中的"编辑"按钮
- **删除分组**: 点击分组列表中的"删除"按钮

### 3. 代码入口
- **主类**: `GroupManagement` (位于 `modules/group-management.js`)
- **初始化**: 在 `content.js` 的 `init()` 方法中调用 `initGroupManagement()`
- **事件绑定**: 通过 `groupManagement.bindEvents()` 绑定相关事件

## 核心功能

### 1. 分组CRUD操作
- `addGroup()` - 添加新分组
- `editGroup(groupId)` - 编辑指定分组
- `deleteGroup(groupId)` - 删除指定分组
- `getGroupById(groupId)` - 获取分组信息

### 2. 分组验证
- `validateGroupName(name, excludeId)` - 验证分组名称
- 检查名称是否为空、长度限制、重名检查

### 3. 分组统计
- `getScriptCountByGroup(groupId)` - 获取分组下话术数量
- `getUngroupedScriptCount()` - 获取未分组话术数量
- `getGroupStats()` - 获取完整统计信息

### 4. 高级功能
- `createGroup(name, color)` - 创建分组（支持自定义颜色）
- `updateGroup(groupId, updates)` - 更新分组信息
- `moveScriptToGroup(scriptId, targetGroupId)` - 移动话术到指定分组

## 文件结构

```
chat-list/
├── content.js                    # 主文件（保留委托调用）
├── manifest.json                 # 已添加新模块引用
└── modules/
    ├── group-management.js       # 分组管理模块（新增）
    ├── script-management.js      # 话术管理模块
    ├── data-import-export.js     # 数据导入导出模块
    └── ui-renderer.js            # UI渲染模块
```

## 模块依赖关系

```
GroupManagement
├── 依赖: widget (主插件实例)
├── 调用: widget.saveData()
├── 调用: widget.renderGroups()
├── 调用: widget.renderScripts()
└── 调用: widget.updateScriptSelection()
```

## 事件处理

### 原有方式（已移除）
```javascript
// content.js 中的事件绑定（已移除）
this.widget.querySelector('.cls-btn-add-group').addEventListener('click', () => {
  this.addGroup();
});
```

### 新方式
```javascript
// GroupManagement 模块中的事件绑定
bindEvents() {
  // 添加分组按钮
  const addGroupBtn = widget.querySelector('.cls-btn-add-group');
  if (addGroupBtn) {
    addGroupBtn.addEventListener('click', () => {
      this.addGroup();
    });
  }
  
  // 分组管理事件委托
  const groupList = widget.querySelector('.group-list');
  if (groupList) {
    groupList.addEventListener('click', (e) => {
      if (e.target.classList.contains('cls-btn-edit-group')) {
        const groupId = e.target.dataset.id;
        this.editGroup(groupId);
      } else if (e.target.classList.contains('cls-btn-delete-group')) {
        const groupId = e.target.dataset.id;
        this.deleteGroup(groupId);
      }
    });
  }
}
```

## 委托调用

在 `content.js` 中保留了委托方法，确保向后兼容：

```javascript
// 委托给 GroupManagement 模块
addGroup() {
  if (this.groupManagement) {
    return this.groupManagement.addGroup();
  } else {
    console.error('GroupManagement 模块未初始化');
  }
}

editGroup(groupId) {
  if (this.groupManagement) {
    return this.groupManagement.editGroup(groupId);
  } else {
    console.error('GroupManagement 模块未初始化');
  }
}

deleteGroup(groupId) {
  if (this.groupManagement) {
    return this.groupManagement.deleteGroup(groupId);
  } else {
    console.error('GroupManagement 模块未初始化');
  }
}
```

## 初始化流程

1. `content.js` 的 `init()` 方法调用 `initGroupManagement()`
2. `initGroupManagement()` 创建 `GroupManagement` 实例
3. 在 `initEventListeners()` 中调用 `groupManagement.bindEvents()`
4. 分组管理功能正常工作

## 优势

1. **模块化**: 分组管理功能独立封装
2. **可维护性**: 代码职责清晰，便于维护
3. **可测试性**: 可以独立测试分组管理功能
4. **可扩展性**: 便于添加新的分组管理功能
5. **向后兼容**: 保留了原有的API接口

## 注意事项

1. 确保在 `manifest.json` 中正确引用了新模块
2. 模块加载顺序很重要，`group-management.js` 需要在 `content.js` 之前加载
3. 所有分组管理相关的事件现在由 `GroupManagement` 模块处理
4. 保持与其他模块的接口一致性