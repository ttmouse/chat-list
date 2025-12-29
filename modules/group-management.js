/**
 * 分组管理模块
 * 负责分组的增删改查和相关UI操作
 */
class GroupManagement {
  constructor(chatListWidget) {
    this.widget = chatListWidget;
    this.colors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336', '#00BCD4'];
  }

  /**
   * 添加新分组
   */
  addGroup() {
    const name = prompt('请输入分组名称:');
    if (name && name.trim()) {
      const newGroup = {
        id: Date.now().toString(),
        name: name.trim(),
        color: this.colors[Math.floor(Math.random() * this.colors.length)]
      };

      this.widget.groups.push(newGroup);
      this.widget.saveData();
      this.widget.renderGroups();

      // console.log('添加分组成功:', newGroup);
    }
  }

  /**
   * 编辑分组
   * @param {string} groupId - 分组ID
   */
  editGroup(groupId) {
    const group = this.widget.groups.find(g => g.id === groupId);
    if (!group) {
      console.error('未找到要编辑的分组:', groupId);
      return;
    }

    const newName = prompt('请输入新的分组名称:', group.name);
    if (newName && newName.trim()) {
      group.name = newName.trim();
      this.widget.saveData();
      this.widget.renderGroups();
      this.widget.renderScripts();

      // console.log('编辑分组成功:', group);
    }
  }

  /**
   * 删除分组
   * @param {string} groupId - 分组ID
   */
  deleteGroup(groupId) {
    const group = this.widget.groups.find(g => g.id === groupId);
    if (!group) {
      console.error('未找到要删除的分组:', groupId);
      return;
    }

    this.widget.showConfirmDialog(
      '确认删除分组',
      `确定要删除分组"${group.name}"吗？分组下的话术将移到未分组。`,
      () => {
        this._performDeleteGroup(groupId);
      }
    );
  }

  /**
   * 执行删除分组操作
   * @param {string} groupId - 分组ID
   * @private
   */
  _performDeleteGroup(groupId) {
    // 将该分组下的话术移到未分组
    this.widget.scripts.forEach(script => {
      if (script.groupId === groupId) {
        script.groupId = '';
      }
    });

    // 删除分组
    this.widget.groups = this.widget.groups.filter(g => g.id !== groupId);

    // 如果当前选中的是被删除的分组，切换到全部
    if (this.widget.currentGroup === groupId) {
      this.widget.currentGroup = null;
    }

    // 重置选中状态
    this.widget.selectedScriptIndex = -1;

    this.widget.saveData();
    this.widget.renderGroups();
    this.widget.renderScripts();

    // 确保清除选中状态和预览
    this.widget.updateScriptSelection();

    // console.log('删除分组成功:', groupId);
  }

  /**
   * 获取分组信息
   * @param {string} groupId - 分组ID
   * @returns {Object|null} 分组对象
   */
  getGroupById(groupId) {
    return this.widget.groups.find(g => g.id === groupId) || null;
  }

  /**
   * 获取分组下的话术数量
   * @param {string} groupId - 分组ID
   * @returns {number} 话术数量
   */
  getScriptCountByGroup(groupId) {
    return this.widget.scripts.filter(script => script.groupId === groupId).length;
  }

  /**
   * 获取未分组的话术数量
   * @returns {number} 未分组话术数量
   */
  getUngroupedScriptCount() {
    return this.widget.scripts.filter(script => !script.groupId).length;
  }

  /**
   * 验证分组名称
   * @param {string} name - 分组名称
   * @param {string} excludeId - 排除的分组ID（编辑时使用）
   * @returns {Object} 验证结果 {valid: boolean, message: string}
   */
  validateGroupName(name, excludeId = null) {
    if (!name || !name.trim()) {
      return { valid: false, message: '分组名称不能为空' };
    }

    const trimmedName = name.trim();
    if (trimmedName.length > 20) {
      return { valid: false, message: '分组名称不能超过20个字符' };
    }

    // 检查是否重名
    const existingGroup = this.widget.groups.find(g =>
      g.name === trimmedName && g.id !== excludeId
    );
    if (existingGroup) {
      return { valid: false, message: '分组名称已存在' };
    }

    return { valid: true, message: '' };
  }

  /**
   * 创建新分组（高级版本，支持自定义颜色）
   * @param {string} name - 分组名称
   * @param {string} color - 分组颜色（可选）
   * @returns {Object|null} 创建的分组对象
   */
  createGroup(name, color = null) {
    const validation = this.validateGroupName(name);
    if (!validation.valid) {
      console.error('创建分组失败:', validation.message);
      return null;
    }

    const newGroup = {
      id: Date.now().toString(),
      name: name.trim(),
      color: color || this.colors[Math.floor(Math.random() * this.colors.length)],
      createdAt: new Date().toISOString()
    };

    this.widget.groups.push(newGroup);
    return newGroup;
  }

  /**
   * 更新分组信息
   * @param {string} groupId - 分组ID
   * @param {Object} updates - 更新的字段
   * @returns {boolean} 是否更新成功
   */
  updateGroup(groupId, updates) {
    const group = this.getGroupById(groupId);
    if (!group) {
      console.error('未找到要更新的分组:', groupId);
      return false;
    }

    // 如果更新名称，需要验证
    if (updates.name !== undefined) {
      const validation = this.validateGroupName(updates.name, groupId);
      if (!validation.valid) {
        console.error('更新分组失败:', validation.message);
        return false;
      }
    }

    // 应用更新
    Object.assign(group, updates, { updatedAt: new Date().toISOString() });
    return true;
  }

  /**
   * 移动话术到指定分组
   * @param {string} scriptId - 话术ID
   * @param {string} targetGroupId - 目标分组ID
   * @returns {boolean} 是否移动成功
   */
  moveScriptToGroup(scriptId, targetGroupId) {
    const script = this.widget.scripts.find(s => s.id === scriptId);
    if (!script) {
      console.error('未找到要移动的话术:', scriptId);
      return false;
    }

    // 验证目标分组是否存在（空字符串表示未分组，是有效的）
    if (targetGroupId && !this.getGroupById(targetGroupId)) {
      console.error('目标分组不存在:', targetGroupId);
      return false;
    }

    script.groupId = targetGroupId;
    script.updatedAt = new Date().toISOString();

    // console.log('话术移动成功:', { scriptId, targetGroupId });
    return true;
  }

  /**
   * 获取分组统计信息
   * @returns {Object} 统计信息
   */
  getGroupStats() {
    const stats = {
      totalGroups: this.widget.groups.length,
      totalScripts: this.widget.scripts.length,
      ungroupedScripts: this.getUngroupedScriptCount(),
      groupDetails: []
    };

    this.widget.groups.forEach(group => {
      stats.groupDetails.push({
        id: group.id,
        name: group.name,
        color: group.color,
        scriptCount: this.getScriptCountByGroup(group.id)
      });
    });

    return stats;
  }

  /**
   * 绑定分组管理相关的事件
   */
  bindEvents() {
    const widget = this.widget.widget;

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

    // console.log('分组管理事件绑定完成');
  }
}

// 全局暴露
if (typeof window !== 'undefined') {
  window.GroupManagement = GroupManagement;
}