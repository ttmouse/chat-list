/**
 * UI创建和渲染模块
 * 负责创建和渲染插件的所有UI组件
 * 包括主界面、触发器、分组、话术列表等
 */
class UIRenderer {
  constructor(widget) {
    this.widget = widget;
    this.version = widget.version;
  }

  /**
   * 创建主界面HTML结构
   */
  createWidget() {
    // 检查是否已经存在，防止重复创建
    const existingWidget = document.getElementById('chat-list-widget');
    if (existingWidget) {
      console.log('发现已存在的话术助手界面，移除旧版本');
      existingWidget.remove();
    }

    // 创建主容器
    const widgetElement = document.createElement('div');
    widgetElement.id = 'chat-list-widget';
    widgetElement.innerHTML = `
      <div class="widget-wrapper">
        <div class="widget-header">
          <span class="widget-title">话术助手 <span class="version">v${this.version || '1.0.0'}</span></span>
          <div class="widget-controls">
            <div class="cls-more-container">
              <button class="cls-btn cls-btn-ghost cls-btn-more" title="更多">⋯</button>
              <div class="cls-more-menu" style="display:none;">
                <button class="cls-more-item cls-menu-manage">管理话术</button>
                <button class="cls-more-item cls-menu-import">导入JSON</button>
                <button class="cls-more-item cls-menu-export">导出JSON</button>
                <button class="cls-more-item cls-menu-filter-all">显示全部</button>
                <button class="cls-more-item cls-menu-filter-private">仅个人</button>
                ${this.widget.remoteEnabled ? '<button class="cls-more-item cls-menu-sync">同步到云端</button>' : ''}
                ${this.widget.remoteEnabled ? '<button class="cls-more-item cls-menu-test">测试云端连接</button>' : ''}
                ${this.widget.remoteEnabled ? '<button class="cls-more-item cls-menu-publish-public">上传到公共库</button>' : ''}
                ${this.widget.remoteEnabled ? '<button class="cls-more-item cls-menu-publish-all">批量上传公共库</button>' : ''}
                ${this.widget.remoteEnabled ? '<button class="cls-more-item cls-menu-login">登录共享账户</button>' : ''}
                ${this.widget.remoteEnabled ? '<button class="cls-more-item cls-menu-filter-public">仅公共</button>' : ''}
                ${this.widget.remoteEnabled ? '<button class="cls-more-item cls-menu-refresh-public">刷新公共库</button>' : ''}
                ${this.widget.remoteEnabled ? '<button class="cls-more-item cls-menu-admin">打开管理后台</button>' : ''}
              </div>
            </div>
            <button class="cls-btn-manage" title="管理话术"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.85643 16.1891C5.59976 15.8149 4.48117 15.1203 3.59545 14.1999C3.92587 13.8083 4.125 13.3023 4.125 12.7499C4.125 11.5072 3.11764 10.4999 1.875 10.4999C1.79983 10.4999 1.72552 10.5036 1.65225 10.5108C1.55242 10.0227 1.5 9.51743 1.5 8.99986C1.5 8.21588 1.62029 7.45999 1.84342 6.74963C1.85393 6.74978 1.86446 6.74986 1.875 6.74986C3.11764 6.74986 4.125 5.74249 4.125 4.49986C4.125 4.14312 4.04197 3.80581 3.89422 3.50611C4.76156 2.69963 5.82019 2.09608 6.99454 1.771C7.36665 2.50039 8.12501 2.99987 9 2.99987C9.87499 2.99987 10.6334 2.50039 11.0055 1.771C12.1798 2.09608 13.2384 2.69963 14.1058 3.50611C13.958 3.80581 13.875 4.14312 13.875 4.49986C13.875 5.74249 14.8824 6.74986 16.125 6.74986C16.1355 6.74986 16.1461 6.74978 16.1566 6.74963C16.3797 7.45999 16.5 8.21588 16.5 8.99986C16.5 9.51743 16.4476 10.0227 16.3478 10.5108C16.2745 10.5036 16.2002 10.4999 16.125 10.4999C14.8824 10.4999 13.875 11.5072 13.875 12.7499C13.875 13.3023 14.0741 13.8083 14.4045 14.1999C13.5188 15.1203 12.4002 15.8149 11.1436 16.1891C10.8535 15.2818 10.0035 14.6249 9 14.6249C7.9965 14.6249 7.14645 15.2818 6.85643 16.1891Z" stroke="#FFFFFF" stroke-width="0.75" stroke-linejoin="round"/><path d="M9 11.625C10.4497 11.625 11.625 10.4497 11.625 9C11.625 7.55025 10.4497 6.375 9 6.375C7.55025 6.375 6.375 7.55025 6.375 9C6.375 10.4497 7.55025 11.625 9 11.625Z" stroke="#FFFFFF" stroke-width="0.75" stroke-linejoin="round"/></svg></button>
            <button class="cls-btn-close" title="关闭"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 3L15 15" stroke="#FFFFFF" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 15L15 3" stroke="#FFFFFF" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          </div>
        </div>
        <div class="widget-content">
          <div class="group-tabs"></div>
          <div class="search-container">
            <input type="text" class="search-input" placeholder="搜索话术..." />
            <button class="cls-btn-clear-search" title="清除搜索"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 3L15 15" stroke="#333333" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 15L15 3" stroke="#333333" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          </div>
          <div class="script-list"></div>
        </div>
        <div class="manage-panel" style="display: none;">
          <div class="manage-header">
            <span>话术管理</span>
            <button class="cls-btn-close-manage"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 16.5C13.1421 16.5 16.5 13.1421 16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5Z" stroke="#333333" stroke-width="0.75" stroke-linejoin="round"/><path d="M11.1211 6.87891L6.87842 11.1215" stroke="#333333" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.87891 6.87891L11.1215 11.1215" stroke="#333333" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          </div>
          <div class="manage-content">
            <div class="group-management">
              <h4>分组管理</h4>
              <div class="group-list"></div>
              <div class="group-actions">
                <button class="cls-btn-add-group">+ 添加分组</button>
                <button class="cls-btn-import-data">📥 导入话术</button>
              </div>
            </div>
            <div class="script-management">
              <h4>话术编辑</h4>
              <div class="script-form">
                <input type="hidden" id="edit-script-id">
                <div class="script-group-selector">
                  <div class="script-group-selector-label">所属分组</div>
                  <div class="script-group-selector-tabs" id="script-group-selector"></div>
                  <select id="script-group" class="script-group-select" aria-label="分组选择">
                    <option value="">未分组</option>
                  </select>
                </div>
                <input type="text" id="script-title" placeholder="话术标题">
                <textarea id="script-note" placeholder="备注（可选）" rows="2"></textarea>
                <textarea id="script-content" placeholder="话术内容"></textarea>
                <div class="form-actions">
                  <button class="cls-btn-save-script">保存</button>
                  <button class="cls-btn-cancel-edit">取消</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <button class="cls-btn-add-script" aria-label="添加话术" title="添加话术">＋</button>
      </div>
    `;

    document.body.appendChild(widgetElement);
    this.widget.widget = widgetElement;

    return widgetElement;
  }

  /**
   * 创建侧边触发器
   */
  createTrigger() {
    // 检查是否已经存在触发器，防止重复创建
    const existingTrigger = document.getElementById('chat-widget-trigger');
    if (existingTrigger) {
      console.log('发现已存在的话术助手触发器，移除旧版本');
      existingTrigger.remove();
    }

    // 创建右侧触发器
    const trigger = document.createElement('div');
    trigger.id = 'chat-widget-trigger';
    trigger.innerHTML = `
      <div class="trigger-icon">💬</div>
    `;
    trigger.title = '打开话术助手';
    trigger.style.display = 'block'; // 初始显示触发器

    document.body.appendChild(trigger);
    this.widget.trigger = trigger;

    return trigger;
  }

  /**
   * 初始化预览模块
   */
  initPreviewModule() {
    // 初始化预览模块
    this.widget.previewModule = new PreviewModule(this.widget);
    this.widget.previewModule.createPreviewLayer();
  }

  /**
   * 渲染分组相关UI
   * 包括分组标签、选择器和管理列表
   */
  renderGroups() {
    try {
      const groupTabs = this.widget.widget.querySelector('.group-tabs');
      const groupSelect = this.widget.widget.querySelector('#script-group');
      const groupSelector = this.widget.widget.querySelector('#script-group-selector');
      const groupList = this.widget.widget.querySelector('.group-list');

      // 检查必要元素是否存在
      if (!groupTabs) {
        console.error('找不到分组标签容器 .group-tabs');
        return;
      }
      if (!groupSelect) {
        console.error('找不到分组选择器 #script-group');
        return;
      }
      if (!groupSelector) {
        console.error('找不到脚本分组标签容器 #script-group-selector');
        return;
      }
      if (!groupList) {
        console.error('找不到分组列表容器 .group-list');
        return;
      }

      // 确保groups数组存在
      if (!this.widget.groups || !Array.isArray(this.widget.groups)) {
        console.warn('分组数据不存在或格式错误，使用空数组');
        this.widget.groups = [];
      }

      console.log('开始渲染分组，分组数量:', this.widget.groups.length);

      // 渲染分组标签
      groupTabs.innerHTML = `
        <div class="group-tab ${!this.widget.currentGroup ? 'active' : ''}" data-group="all">
          全部
        </div>
        ${this.widget.groups.map(group => `
          <div class="group-tab ${this.widget.currentGroup === group.id ? 'active' : ''}" 
               data-group="${group.id}" style="border-left: 3px solid ${group.color}">
            ${group.name}
          </div>
        `).join('')}
      `;

      // 渲染分组选择器
      const currentSelectValue = groupSelect.value || '';
      groupSelect.innerHTML = `
        <option value="">未分组</option>
        ${this.widget.groups.map(group => `
          <option value="${group.id}">${group.name}</option>
        `).join('')}
      `;
      groupSelect.value = currentSelectValue || '';

      // 渲染脚本编辑分组选项（横向 Chips）
      const selectorItems = [
        { id: '', name: '未分组', color: '#d0d0d0' },
        ...this.widget.groups.map(group => ({
          id: group.id,
          name: group.name,
          color: group.color || '#d0d0d0'
        }))
      ];

      groupSelector.innerHTML = selectorItems.map(item => `
        <button type="button"
                class="script-group-chip ${currentSelectValue === item.id ? 'active' : ''}"
                data-value="${item.id}">
          <span class="chip-color" style="background:${item.color}"></span>
          <span class="chip-label">${item.name}</span>
        </button>
      `).join('');

      const chipButtons = Array.from(groupSelector.querySelectorAll('.script-group-chip'));
      const updateChipSelection = (value = groupSelect.value || '') => {
        chipButtons.forEach(btn => {
          const val = btn.dataset.value || '';
          btn.classList.toggle('active', val === value);
        });
      };

      chipButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const value = btn.dataset.value || '';
          groupSelect.value = value;
          updateChipSelection(value);
        });
      });

      this.widget.syncScriptGroupSelector = updateChipSelection;
      updateChipSelection(currentSelectValue);

      // 渲染分组管理列表
      groupList.innerHTML = this.widget.groups.map(group => `
        <div class="group-item">
          <span class="group-color" style="background: ${group.color}"></span>
          <span class="group-name">${group.name}</span>
          <button class="cls-btn-edit-group" data-id="${group.id}">编辑</button>
          <button class="cls-btn-delete-group" data-id="${group.id}">删除</button>
        </div>
      `).join('');

      console.log('分组渲染完成');
    } catch (error) {
      console.error('渲染分组时出错:', error);
      console.error('错误堆栈:', error.stack);
    }
  }

  /**
   * 渲染话术列表
   * 支持搜索过滤、关键词高亮和按使用次数排序
   */
  renderScripts() {
    const scriptList = this.widget.widget.querySelector('.script-list');

    // 使用新的排序逻辑获取过滤和排序后的话术
    let filteredScripts = this.widget.getSortedScripts();

    if (filteredScripts.length === 0) {
      scriptList.innerHTML = `
        <div class="empty-state">
          <p>${this.widget.searchKeyword ? '未找到匹配的话术' : '暂无话术'}</p>
        </div>
      `;
      return;
    }

    scriptList.innerHTML = filteredScripts.map(script => {
      const group = this.widget.groups.find(g => g.id === script.groupId);

      // 高亮搜索关键词（支持空格分隔的多关键词）
      let highlightedTitle = script.title;
      let highlightedNote = script.note || '';
      let highlightedContent = script.content;

      if (this.widget.searchKeyword) {
        // 分词并去空，构造 OR 高亮（即便是 AND 筛选，展示时应全部关键词高亮）
        const tokens = this.widget.searchKeyword
          .split(/[\s\u3000]+/)
          .map(t => t.trim())
          .filter(Boolean);

        if (tokens.length > 0) {
          // 转义正则特殊字符
          const escapeRegExp = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const pattern = tokens.map(escapeRegExp).join('|');
          const regex = new RegExp(`(${pattern})`, 'gi');

          highlightedTitle = script.title.replace(regex, '<mark>$1</mark>');
          if (script.note) {
            highlightedNote = script.note.replace(regex, '<mark>$1</mark>');
          }
          highlightedContent = script.content.replace(regex, '<mark>$1</mark>');
        }
      }
      const isPublic = script.__source === 'public';
      const actions = isPublic ? '' : `
            <div class="script-actions">
              <button class="cls-btn-edit" data-id="${script.id}" title="编辑"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.75 9.75V15C15.75 15.4142 15.4142 15.75 15 15.75H3C2.58579 15.75 2.25 15.4142 2.25 15V3C2.25 2.58579 2.58579 2.25 3 2.25H8.25" stroke="#333333" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.25 10.02V12.75H7.99395L15.75 4.99054L13.0107 2.25L5.25 10.02Z" stroke="#333333" stroke-width="0.75" stroke-linejoin="round"/></svg></button>
              <button class="cls-btn-submit" data-id="${script.id}" title="提交到公共库"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 15.75V2.25" stroke="#333333" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.5 6.75L9 2.25L13.5 6.75" stroke="#333333" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 15.75H15" stroke="#333333" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
              <button class="cls-btn-delete" data-id="${script.id}" title="删除"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M3 5.625H15L13.875 16.5H4.125L3 5.625Z" stroke="#333333" stroke-width="0.75" stroke-linejoin="round"/><path d="M7.50098 9.37598V13.1261" stroke="#333333" stroke-width="0.75" stroke-linecap="round"/><path d="M10.501 9.375V13.1241" stroke="#333333" stroke-width="0.75" stroke-linecap="round"/><path d="M4.5 5.62496L10.6216 1.125L13.5 5.625" stroke="#333333" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
            </div>`;
      const badge = isPublic ? '【公】' : '';
      return `
        <div class="script-item" data-id="${script.id}" data-title="${script.title.replace(/"/g, '&quot;')}" data-note="${(script.note || '').replace(/"/g, '&quot;')}" data-content="${script.content.replace(/"/g, '&quot;')}" data-group-id="${script.groupId}">
          <div class="script-header">
            <span class="script-title">${badge}${highlightedTitle}</span>
            ${actions}
          </div>
          <div class="script-content">${highlightedContent}</div>
        </div>
      `;
    }).join('');

    // 如果有搜索关键词且有结果，自动选中第一个话术
    if (this.widget.searchKeyword && filteredScripts.length > 0) {
      this.widget.selectedScriptIndex = 0;
      this.updateScriptSelection();
    }
  }

  /**
   * 更新话术选择状态
   * 支持键盘导航
   */
  updateScriptSelection() {
    const scriptItems = this.widget.widget.querySelectorAll('.script-item');

    // 移除所有选中状态
    scriptItems.forEach(item => item.classList.remove('keyboard-selected'));

    // 添加当前选中项的状态
    if (this.widget.selectedScriptIndex >= 0 && scriptItems[this.widget.selectedScriptIndex]) {
      const selectedItem = scriptItems[this.widget.selectedScriptIndex];
      selectedItem.classList.add('keyboard-selected');

      // 滚动到可见区域
      selectedItem.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });

      // 键盘选择时也显示预览
      if (this.widget.previewModule) {
        this.widget.previewModule.showPreview(selectedItem);
      }
    } else {
      // 没有选中项时隐藏预览
      if (this.widget.previewModule) {
        this.widget.previewModule.forceHidePreview();
      }
    }
  }

  /**
   * 获取当前选中的话术数据
   */
  getSelectedScript() {
    const scriptItems = this.widget.widget.querySelectorAll('.script-item');
    if (this.widget.selectedScriptIndex >= 0 && scriptItems[this.widget.selectedScriptIndex]) {
      const selectedItem = scriptItems[this.widget.selectedScriptIndex];
      return {
        id: selectedItem.dataset.id,
        title: selectedItem.dataset.title,
        note: selectedItem.dataset.note,
        content: selectedItem.dataset.content,
        groupId: selectedItem.dataset.groupId
      };
    }
    return null;
  }

  /**
   * 重新渲染所有UI组件
   */
  refreshUI() {
    this.renderGroups();
    this.renderScripts();
  }
}

// 全局暴露
window.UIRenderer = UIRenderer;
