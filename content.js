// 话术助手内容脚本
class ChatListWidget {
  constructor() {
    this.isVisible = false;
    this.widget = null;
    this.previewLayer = null; // 独立的预览浮层
    this.hidePreviewTimeout = null; // 预览浮层延迟隐藏定时器
    this.scripts = [];
    this.groups = [];
    this.currentGroup = null;
    this.searchKeyword = ''; // 搜索关键词
    this.lastFocusedElement = null; // 记住最后聚焦的元素
    this.init();
  }

  async init() {
    await this.loadData();
    this.createWidget();
    this.createPreviewLayer();
    this.bindEvents();
  }

  async loadData() {
    try {
      // 检查扩展上下文是否有效
      if (!this.isExtensionContextValid()) {
        console.warn('扩展上下文已失效，使用默认数据');
        this.scripts = this.getDefaultScripts();
        this.groups = this.getDefaultGroups();
        return;
      }
      
      const result = await chrome.storage.local.get(['chatScripts', 'chatGroups']);
      this.scripts = result.chatScripts || this.getDefaultScripts();
      this.groups = result.chatGroups || this.getDefaultGroups();
    } catch (error) {
      console.error('加载数据失败:', error);
      this.scripts = this.getDefaultScripts();
      this.groups = this.getDefaultGroups();
      
      // 如果是扩展上下文失效错误，提示用户刷新页面
      if (error.message && error.message.includes('Extension context invalidated')) {
        this.showContextInvalidatedNotice();
      }
    }
  }

  getDefaultGroups() {
    return [
      { id: 'greeting', name: '问候语', color: '#4CAF50' },
      { id: 'service', name: '服务话术', color: '#2196F3' },
      { id: 'closing', name: '结束语', color: '#FF9800' }
    ];
  }

  getDefaultScripts() {
    return [
      { id: '1', title: '欢迎语', content: '您好，很高兴为您服务！有什么可以帮助您的吗？', groupId: 'greeting' },
      { id: '2', title: '产品介绍', content: '我们的产品具有以下特点：高质量、高性价比、优质服务。', groupId: 'service' },
      { id: '3', title: '感谢语', content: '感谢您的咨询，祝您生活愉快！', groupId: 'closing' }
    ];
  }

  createWidget() {
    // 创建主容器
    this.widget = document.createElement('div');
    this.widget.id = 'chat-list-widget';
    this.widget.innerHTML = `
      <div class="widget-wrapper">
        <div class="widget-header">
          <span class="widget-title">话术助手 <span class="version">v1.3.2</span></span>
          <div class="widget-controls">
            <button class="btn-manage" title="管理话术"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.85643 16.1891C5.59976 15.8149 4.48117 15.1203 3.59545 14.1999C3.92587 13.8083 4.125 13.3023 4.125 12.7499C4.125 11.5072 3.11764 10.4999 1.875 10.4999C1.79983 10.4999 1.72552 10.5036 1.65225 10.5108C1.55242 10.0227 1.5 9.51743 1.5 8.99986C1.5 8.21588 1.62029 7.45999 1.84342 6.74963C1.85393 6.74978 1.86446 6.74986 1.875 6.74986C3.11764 6.74986 4.125 5.74249 4.125 4.49986C4.125 4.14312 4.04197 3.80581 3.89422 3.50611C4.76156 2.69963 5.82019 2.09608 6.99454 1.771C7.36665 2.50039 8.12501 2.99987 9 2.99987C9.87499 2.99987 10.6334 2.50039 11.0055 1.771C12.1798 2.09608 13.2384 2.69963 14.1058 3.50611C13.958 3.80581 13.875 4.14312 13.875 4.49986C13.875 5.74249 14.8824 6.74986 16.125 6.74986C16.1355 6.74986 16.1461 6.74978 16.1566 6.74963C16.3797 7.45999 16.5 8.21588 16.5 8.99986C16.5 9.51743 16.4476 10.0227 16.3478 10.5108C16.2745 10.5036 16.2002 10.4999 16.125 10.4999C14.8824 10.4999 13.875 11.5072 13.875 12.7499C13.875 13.3023 14.0741 13.8083 14.4045 14.1999C13.5188 15.1203 12.4002 15.8149 11.1436 16.1891C10.8535 15.2818 10.0035 14.6249 9 14.6249C7.9965 14.6249 7.14645 15.2818 6.85643 16.1891Z" stroke="#FFFFFF" stroke-width="0.75" stroke-linejoin="round"/><path d="M9 11.625C10.4497 11.625 11.625 10.4497 11.625 9C11.625 7.55025 10.4497 6.375 9 6.375C7.55025 6.375 6.375 7.55025 6.375 9C6.375 10.4497 7.55025 11.625 9 11.625Z" stroke="#FFFFFF" stroke-width="0.75" stroke-linejoin="round"/></svg></button>
            <button class="btn-toggle" title="收起/展开">📋</button>
            <button class="btn-close" title="关闭"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 16.5C13.1421 16.5 16.5 13.1421 16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5Z" stroke="#FFFFFF" stroke-width="0.75" stroke-linejoin="round"/><path d="M11.1211 6.87891L6.87842 11.1215" stroke="#FFFFFF" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.87891 6.87891L11.1215 11.1215" stroke="#FFFFFF" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          </div>
        </div>
        <div class="widget-content">
          <div class="group-tabs"></div>
          <div class="search-container">
            <input type="text" class="search-input" placeholder="搜索话术..." />
            <button class="btn-clear-search" title="清除搜索">×</button>
          </div>
          <div class="script-list"></div>
          <div class="widget-actions">
            <button class="btn-add-script">+ 添加话术</button>
          </div>
        </div>
        <div class="manage-panel" style="display: none;">
          <div class="manage-header">
            <span>话术管理</span>
            <button class="btn-close-manage"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 16.5C13.1421 16.5 16.5 13.1421 16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5Z" stroke="#333333" stroke-width="0.75" stroke-linejoin="round"/><path d="M11.1211 6.87891L6.87842 11.1215" stroke="#333333" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.87891 6.87891L11.1215 11.1215" stroke="#333333" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          </div>
          <div class="manage-content">
            <div class="group-management">
              <h4>分组管理</h4>
              <div class="group-list"></div>
              <button class="btn-add-group">+ 添加分组</button>
            </div>
            <div class="script-management">
              <h4>话术编辑</h4>
              <div class="script-form">
                <input type="hidden" id="edit-script-id">
                <input type="text" id="script-title" placeholder="话术标题">
                <select id="script-group">
                  <option value="">选择分组</option>
                </select>
                <textarea id="script-content" placeholder="话术内容"></textarea>
                <div class="form-actions">
                  <button class="btn-save-script">保存</button>
                  <button class="btn-cancel-edit">取消</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.widget);
    this.createTrigger();
    this.renderGroups();
    this.renderScripts();
    
    // 加载保存的位置
    setTimeout(() => {
      this.loadPosition();
    }, 100);
  }

  createPreviewLayer() {
    // 创建独立的预览浮层
    this.previewLayer = document.createElement('div');
    this.previewLayer.id = 'script-preview-layer';
    this.previewLayer.innerHTML = `
      <div class="preview-content">
        <div class="preview-title"></div>
        <div class="preview-text"></div>
      </div>
    `;
    
    document.body.appendChild(this.previewLayer);
  }

  createTrigger() {
    // 创建右侧触发器
    this.trigger = document.createElement('div');
    this.trigger.id = 'chat-widget-trigger';
    this.trigger.innerHTML = `
      <div class="trigger-icon">💬</div>
    `;
    this.trigger.title = '打开话术助手';
    this.trigger.style.display = 'none'; // 初始隐藏
    
    document.body.appendChild(this.trigger);
  }

  renderGroups() {
    const groupTabs = this.widget.querySelector('.group-tabs');
    const groupSelect = this.widget.querySelector('#script-group');
    const groupList = this.widget.querySelector('.group-list');
    
    // 渲染分组标签
    groupTabs.innerHTML = `
      <div class="group-tab ${!this.currentGroup ? 'active' : ''}" data-group="all">
        全部
      </div>
      ${this.groups.map(group => `
        <div class="group-tab ${this.currentGroup === group.id ? 'active' : ''}" 
             data-group="${group.id}" style="border-left: 3px solid ${group.color}">
          ${group.name}
        </div>
      `).join('')}
    `;

    // 渲染分组选择器
    groupSelect.innerHTML = `
      <option value="">选择分组</option>
      ${this.groups.map(group => `
        <option value="${group.id}">${group.name}</option>
      `).join('')}
    `;

    // 渲染分组管理列表
    groupList.innerHTML = this.groups.map(group => `
      <div class="group-item">
        <span class="group-color" style="background: ${group.color}"></span>
        <span class="group-name">${group.name}</span>
        <button class="btn-edit-group" data-id="${group.id}">编辑</button>
        <button class="btn-delete-group" data-id="${group.id}">删除</button>
      </div>
    `).join('');
  }

  renderScripts() {
    const scriptList = this.widget.querySelector('.script-list');
    let filteredScripts = this.currentGroup 
      ? this.scripts.filter(script => script.groupId === this.currentGroup)
      : this.scripts;

    // 搜索过滤
    if (this.searchKeyword) {
      filteredScripts = filteredScripts.filter(script => 
        script.title.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
        script.content.toLowerCase().includes(this.searchKeyword.toLowerCase())
      );
    }

    if (filteredScripts.length === 0) {
      scriptList.innerHTML = `
        <div class="empty-state">
          <p>${this.searchKeyword ? '未找到匹配的话术' : '暂无话术'}</p>
        </div>
      `;
      return;
    }

    scriptList.innerHTML = filteredScripts.map(script => {
      const group = this.groups.find(g => g.id === script.groupId);
      
      // 高亮搜索关键词
      let highlightedTitle = script.title;
      let highlightedContent = script.content;
      
      if (this.searchKeyword) {
        const regex = new RegExp(`(${this.searchKeyword})`, 'gi');
        highlightedTitle = script.title.replace(regex, '<mark>$1</mark>');
        highlightedContent = script.content.replace(regex, '<mark>$1</mark>');
      }
      
      return `
        <div class="script-item" data-id="${script.id}" data-title="${script.title.replace(/"/g, '&quot;')}" data-content="${script.content.replace(/"/g, '&quot;')}">
          <div class="script-header">
            <span class="script-title">${highlightedTitle}</span>
            <div class="script-actions">
              <button class="btn-edit" data-id="${script.id}" title="编辑"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.75 9.75V15C15.75 15.4142 15.4142 15.75 15 15.75H3C2.58579 15.75 2.25 15.4142 2.25 15V3C2.25 2.58579 2.58579 2.25 3 2.25H8.25" stroke="#333333" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.25 10.02V12.75H7.99395L15.75 4.99054L13.0107 2.25L5.25 10.02Z" stroke="#333333" stroke-width="0.75" stroke-linejoin="round"/></svg></button>
              <button class="btn-delete" data-id="${script.id}" title="删除"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M3 5.625H15L13.875 16.5H4.125L3 5.625Z" stroke="#333333" stroke-width="0.75" stroke-linejoin="round"/><path d="M7.50098 9.37598V13.1261" stroke="#333333" stroke-width="0.75" stroke-linecap="round"/><path d="M10.501 9.375V13.1241" stroke="#333333" stroke-width="0.75" stroke-linecap="round"/><path d="M4.5 5.62496L10.6216 1.125L13.5 5.625" stroke="#333333" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
            </div>
          </div>
          <div class="script-content">${highlightedContent}</div>
        </div>
      `;
    }).join('');
  }

  bindEvents() {
    // 监听全局焦点变化，记住最后聚焦的输入元素
    document.addEventListener('focusin', (e) => {
      if (this.isValidInput(e.target) && !e.target.closest('#chat-list-widget')) {
        this.lastFocusedElement = e.target;
      }
    });

    // 防止浮层点击时失去焦点，但允许输入框获得焦点
    this.widget.addEventListener('mousedown', (e) => {
      // 如果点击的是输入框或搜索相关元素，允许默认行为
      if (e.target.matches('.search-input, .btn-clear-search') || 
          e.target.closest('.search-container')) {
        return;
      }
      e.preventDefault(); // 防止默认的焦点转移
    });



    // 切换显示/隐藏
    this.widget.querySelector('.btn-toggle').addEventListener('click', () => {
      this.toggleWidget();
    });

    // 关闭浮层
    this.widget.querySelector('.btn-close').addEventListener('click', () => {
      this.hideWidget();
    });

    // 触发器点击事件
    this.trigger.addEventListener('click', () => {
      this.showWidget();
    });

    // 管理面板
    this.widget.querySelector('.btn-manage').addEventListener('click', () => {
      try {
        console.log('点击了管理按钮');
        this.showManagePanel();
      } catch (error) {
        console.error('点击管理按钮时出错:', error);
      }
    });

    this.widget.querySelector('.btn-close-manage').addEventListener('click', () => {
      this.hideManagePanel();
    });

    // 搜索功能
    const searchInput = this.widget.querySelector('.search-input');
    const clearSearchBtn = this.widget.querySelector('.btn-clear-search');
    
    searchInput.addEventListener('input', (e) => {
      this.searchKeyword = e.target.value.trim();
      this.renderScripts();
      
      // 显示/隐藏清除按钮
      if (this.searchKeyword) {
        clearSearchBtn.classList.add('visible');
      } else {
        clearSearchBtn.classList.remove('visible');
      }
    });
    
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      this.searchKeyword = '';
      this.renderScripts();
      clearSearchBtn.classList.remove('visible');
      searchInput.focus();
    });

    // 分组切换
    this.widget.querySelector('.group-tabs').addEventListener('click', (e) => {
      if (e.target.classList.contains('group-tab')) {
        const groupId = e.target.dataset.group;
        this.currentGroup = groupId === 'all' ? null : groupId;
        this.renderGroups();
        this.renderScripts();
      }
    });

    // 话术点击填充
    this.widget.querySelector('.script-list').addEventListener('click', (e) => {
      if (e.target.closest('.script-item') && !e.target.closest('.script-actions')) {
        const scriptId = e.target.closest('.script-item').dataset.id;
        const script = this.scripts.find(s => s.id === scriptId);
        if (script) {
          this.fillContent(script.content);
        }
      }
    });

    // 编辑和删除按钮
    this.widget.querySelector('.script-list').addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-edit')) {
        const scriptId = e.target.dataset.id;
        this.editScript(scriptId);
      } else if (e.target.classList.contains('btn-delete')) {
        const scriptId = e.target.dataset.id;
        this.deleteScript(scriptId);
      }
    });

    // 话术项悬停预览
    this.widget.querySelector('.script-list').addEventListener('mouseenter', (e) => {
      const scriptItem = e.target.closest('.script-item');
      if (scriptItem) {
        this.showPreview(scriptItem);
      }
    }, true);

    // 当鼠标离开整个主面板时延迟隐藏预览（给用户时间移动到预览浮层）
    this.widget.addEventListener('mouseleave', () => {
      console.log('主面板 mouseleave 事件触发');
      // 延迟300ms隐藏，如果鼠标进入预览浮层则取消隐藏
      this.hidePreviewTimeout = setTimeout(() => {
        console.log('延迟隐藏定时器执行');
        this.forceHidePreview();
      }, 300);
    });

    // 移除话术项的mouseleave事件，避免与主面板的延迟隐藏逻辑冲突

    // 预览浮层本身的鼠标事件
    this.previewLayer.addEventListener('mouseenter', () => {
      console.log('预览浮层 mouseenter 事件触发');
      // 取消延迟隐藏
      if (this.hidePreviewTimeout) {
        console.log('取消延迟隐藏定时器');
        clearTimeout(this.hidePreviewTimeout);
        this.hidePreviewTimeout = null;
      }
      // 只有在浮层已经可见时才添加hover状态
      if (this.previewLayer.classList.contains('visible')) {
        this.previewLayer.classList.add('hover');
      }
    });

    this.previewLayer.addEventListener('mouseleave', () => {
      console.log('预览浮层 mouseleave 事件触发');
      this.forceHidePreview();
    });

    // 添加话术
    this.widget.querySelector('.btn-add-script').addEventListener('click', () => {
      try {
        console.log('点击添加话术按钮');
        this.showAddScriptModal();
      } catch (error) {
        console.error('添加话术按钮点击处理出错:', error);
      }
    });

    // 保存话术
    this.widget.querySelector('.btn-save-script').addEventListener('click', () => {
      this.saveScript();
    });

    // 取消编辑
    this.widget.querySelector('.btn-cancel-edit').addEventListener('click', () => {
      this.clearScriptForm();
    });

    // 添加分组
    this.widget.querySelector('.btn-add-group').addEventListener('click', () => {
      this.addGroup();
    });

    // 分组管理
    this.widget.querySelector('.group-list').addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-edit-group')) {
        const groupId = e.target.dataset.id;
        this.editGroup(groupId);
      } else if (e.target.classList.contains('btn-delete-group')) {
        const groupId = e.target.dataset.id;
        this.deleteGroup(groupId);
      }
    });

    // 添加拖拽功能
    this.initDragFunctionality();
  }

  toggleWidget() {
    const content = this.widget.querySelector('.widget-content');
    this.isVisible = !this.isVisible;
    content.style.display = this.isVisible ? 'block' : 'none';
  }

  hideWidget() {
    this.widget.style.display = 'none';
    this.trigger.style.display = 'block'; // 显示触发器
    this.isVisible = false;
  }

  showWidget() {
    this.widget.style.display = 'block';
    this.trigger.style.display = 'none'; // 隐藏触发器
    this.isVisible = true;
    // 确保内容区域也是显示的
    const content = this.widget.querySelector('.widget-content');
    content.style.display = 'block';
  }

  showManagePanel() {
    try {
      console.log('开始显示管理面板');
      
      const managePanel = this.widget.querySelector('.manage-panel');
      const widgetContent = this.widget.querySelector('.widget-content');
      
      if (!managePanel) {
        console.error('找不到管理面板元素 .manage-panel');
        return;
      }
      
      if (!widgetContent) {
        console.error('找不到内容区域元素 .widget-content');
        return;
      }
      
      console.log('管理面板元素:', managePanel);
      console.log('内容区域元素:', widgetContent);
      
      managePanel.style.display = 'block';
      widgetContent.style.display = 'none';
      
      console.log('管理面板显示成功');
    } catch (error) {
      console.error('显示管理面板时出错:', error);
    }
  }

  // 新增话术模态框相关方法
  showAddScriptModal() {
    console.log('显示添加话术模态框');
    
    // 创建模态框HTML
    const modalHTML = `
        <div class="modal-overlay" id="addScriptModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">添加新话术</h3>
                    <button class="btn-close-modal"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 16.5C13.1421 16.5 16.5 13.1421 16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5Z" stroke="#333333" stroke-width="0.75" stroke-linejoin="round"/><path d="M11.1211 6.87891L6.87842 11.1215" stroke="#333333" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.87891 6.87891L11.1215 11.1215" stroke="#333333" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
                </div>
                <div class="modal-body">
                    <form id="addScriptForm">
                        <div class="form-group">
                            <label class="form-label" for="modalScriptTitle">话术标题 *</label>
                            <input type="text" id="modalScriptTitle" class="form-control" placeholder="请输入话术标题" required>
                            <div id="titleError" class="error-message" style="display: none;"></div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label" for="modalScriptGroup">所属分组</label>
                            <select id="modalScriptGroup" class="form-control">
                                <option value="">选择分组（可选）</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label" for="modalScriptContent">话术内容 *</label>
                            <textarea id="modalScriptContent" class="form-control textarea" placeholder="请输入话术内容" required></textarea>
                            <div id="contentError" class="error-message" style="display: none;"></div>
                        </div>
                    </form>
                    
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary btn-cancel-modal">取消</button>
                        <button type="button" class="btn btn-primary btn-save-modal">保存话术</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 移除已存在的模态框
    const existingModal = document.getElementById('addScriptModal');
    if (existingModal) {
      existingModal.remove();
    }
    
    // 添加模态框到页面
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // 填充分组选项
    this.populateGroupOptions();
    
    // 绑定事件
    this.bindModalEvents();
    
    // 显示模态框
    const modal = document.getElementById('addScriptModal');
    modal.style.display = 'flex';
    
    // 设置焦点
    setTimeout(() => {
      const titleInput = document.getElementById('modalScriptTitle');
      if (titleInput) {
        titleInput.focus();
      }
    }, 100);
  }

  hideAddScriptModal() {
    console.log('隐藏添加话术模态框');
    const modal = document.getElementById('addScriptModal');
    if (modal) {
      modal.remove();
    }
  }

  populateGroupOptions() {
    const groupSelect = document.getElementById('modalScriptGroup');
    if (!groupSelect) return;
    
    // 清空现有选项（保留默认选项）
    groupSelect.innerHTML = '<option value="">选择分组（可选）</option>';
    
    // 添加现有分组
    this.groups.forEach(group => {
      const option = document.createElement('option');
      option.value = group.id;
      option.textContent = group.name;
      groupSelect.appendChild(option);
    });
  }

  bindModalEvents() {
    // 关闭按钮事件
    const closeBtn = document.querySelector('.btn-close-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hideAddScriptModal());
    }
    
    // 取消按钮事件
    const cancelBtn = document.querySelector('.btn-cancel-modal');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.hideAddScriptModal());
    }
    
    // 保存按钮事件
    const saveBtn = document.querySelector('.btn-save-modal');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveNewScript());
    }
    
    // 点击遮罩层关闭
    const modal = document.getElementById('addScriptModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
          this.hideAddScriptModal();
        }
      });
    }
    
    // 键盘事件
    document.addEventListener('keydown', (e) => {
      const modal = document.getElementById('addScriptModal');
      if (modal && modal.style.display === 'flex') {
        if (e.key === 'Escape') {
          this.hideAddScriptModal();
        } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          this.saveNewScript();
        }
      }
    });
    
    // 实时验证
    const titleInput = document.getElementById('modalScriptTitle');
    const contentInput = document.getElementById('modalScriptContent');
    
    if (titleInput) {
      titleInput.addEventListener('input', () => {
        const titleError = document.getElementById('titleError');
        if (titleError && titleError.style.display === 'block') {
          this.validateModalForm();
        }
      });
    }
    
    if (contentInput) {
      contentInput.addEventListener('input', () => {
        const contentError = document.getElementById('contentError');
        if (contentError && contentError.style.display === 'block') {
          this.validateModalForm();
        }
      });
    }
  }

  validateModalForm() {
    const title = document.getElementById('modalScriptTitle')?.value.trim() || '';
    const content = document.getElementById('modalScriptContent')?.value.trim() || '';
    
    let isValid = true;
    
    // 验证标题
    const titleError = document.getElementById('titleError');
    if (titleError) {
      if (!title) {
        titleError.textContent = '请输入话术标题';
        titleError.style.display = 'block';
        isValid = false;
      } else if (title.length > 50) {
        titleError.textContent = '标题长度不能超过50个字符';
        titleError.style.display = 'block';
        isValid = false;
      } else {
        titleError.style.display = 'none';
      }
    }
    
    // 验证内容
    const contentError = document.getElementById('contentError');
    if (contentError) {
      if (!content) {
        contentError.textContent = '请输入话术内容';
        contentError.style.display = 'block';
        isValid = false;
      } else if (content.length > 1000) {
        contentError.textContent = '内容长度不能超过1000个字符';
        contentError.style.display = 'block';
        isValid = false;
      } else {
        contentError.style.display = 'none';
      }
    }
    
    return isValid;
  }

  saveNewScript() {
    console.log('开始保存新话术');
    
    try {
      if (!this.validateModalForm()) {
        console.log('表单验证失败');
        return;
      }
      
      const title = document.getElementById('modalScriptTitle')?.value.trim() || '';
      const groupId = document.getElementById('modalScriptGroup')?.value || '';
      const content = document.getElementById('modalScriptContent')?.value.trim() || '';
      
      const newScript = {
        id: Date.now().toString(),
        title,
        content,
        groupId,
        createTime: new Date().toISOString()
      };
      
      console.log('新话术数据:', newScript);
      
      // 添加到话术列表
      this.scripts.push(newScript);
      
      // 保存数据
      this.saveData().then(() => {
        console.log('话术保存成功');
        this.showSuccessMessage('话术添加成功！');
        this.renderScripts();
        this.hideAddScriptModal();
      }).catch(error => {
        console.error('保存话术失败:', error);
        alert('保存失败，请重试');
      });
      
    } catch (error) {
      console.error('保存新话术时出错:', error);
      alert('保存失败，请重试');
    }
  }

  hideManagePanel() {
    this.widget.querySelector('.manage-panel').style.display = 'none';
    this.widget.querySelector('.widget-content').style.display = 'block';
    this.clearScriptForm();
  }

  fillContent(content) {
    // 优先使用记住的焦点元素
    if (this.lastFocusedElement && this.isValidInput(this.lastFocusedElement)) {
      // 检查元素是否仍然存在于DOM中
      if (document.contains(this.lastFocusedElement)) {
        this.insertContent(this.lastFocusedElement, content);
        return;
      } else {
        // 如果元素已被移除，清除引用
        this.lastFocusedElement = null;
      }
    }
    
    // 查找当前焦点的输入框
    const activeElement = document.activeElement;
    
    // 如果当前有焦点的输入框，优先使用
    if (activeElement && this.isValidInput(activeElement)) {
      this.insertContent(activeElement, content);
      return;
    }
    
    // 查找页面中可能的输入框，按优先级排序
    const inputs = this.findValidInputs();
    
    if (inputs.length === 0) {
      alert('未找到可填充的输入框，请先点击输入框');
      return;
    }
    
    // 如果只有一个输入框，直接使用
    if (inputs.length === 1) {
      this.insertContent(inputs[0], content);
      return;
    }
    
    // 多个输入框时，优先选择可见且在视窗内的
    const visibleInputs = inputs.filter(input => this.isElementVisible(input));
    const target = visibleInputs.length > 0 ? visibleInputs[0] : inputs[0];
    
    this.insertContent(target, content);
  }
  
  isValidInput(element) {
    if (!element) return false;
    
    // 检查是否为有效的输入元素
    const tagName = element.tagName.toLowerCase();
    if (tagName === 'textarea') return true;
    if (tagName === 'input') {
      const type = element.type.toLowerCase();
      return ['text', 'search', 'url', 'email', 'password'].includes(type);
    }
    if (element.contentEditable === 'true') return true;
    
    return false;
  }
  
  findValidInputs() {
    // 查找所有可能的输入框
    const selectors = [
      'textarea:not([readonly]):not([disabled])',
      'input[type="text"]:not([readonly]):not([disabled])',
      'input[type="search"]:not([readonly]):not([disabled])',
      'input[type="url"]:not([readonly]):not([disabled])',
      'input[type="email"]:not([readonly]):not([disabled])',
      'input:not([type]):not([readonly]):not([disabled])',
      '[contenteditable="true"]',
      // Facebook 特殊选择器
      'div[role="textbox"]',
      'div[contenteditable="true"]',
      'div[data-text="true"]',
      // 微信网页版
      '.input_area',
      '.chat_textarea',
      // 通用社交媒体输入框
      '[role="textbox"]',
      '[aria-label*="消息"]',
      '[aria-label*="message"]',
      '[aria-label*="评论"]',
      '[aria-label*="comment"]',
      '[placeholder*="消息"]',
      '[placeholder*="message"]',
      '[placeholder*="评论"]',
      '[placeholder*="comment"]'
    ];
    
    const inputs = [];
    selectors.forEach(selector => {
      try {
        document.querySelectorAll(selector).forEach(input => {
          // 排除插件自身的输入框
          if (!input.closest('#chat-list-widget') && this.isValidInputElement(input)) {
            inputs.push(input);
          }
        });
      } catch (e) {
        // 忽略无效选择器错误
        console.warn('选择器错误:', selector, e);
      }
    });
    
    return inputs;
  }
  
  // 新增方法：验证输入元素的有效性
  isValidInputElement(element) {
    if (!element) return false;
    
    // 检查元素是否可见
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') {
      return false;
    }
    
    // 检查元素尺寸
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return false;
    }
    
    // 检查是否为只读或禁用
    if (element.readOnly || element.disabled) {
      return false;
    }
    
    // 对于contenteditable元素，确保真的可编辑
    if (element.contentEditable === 'true' || element.getAttribute('contenteditable') === 'true') {
      return true;
    }
    
    // 对于role="textbox"的元素
    if (element.getAttribute('role') === 'textbox') {
      return true;
    }
    
    // 对于传统input和textarea
    const tagName = element.tagName.toLowerCase();
    if (tagName === 'textarea' || tagName === 'input') {
      return true;
    }
    
    return false;
  }
  
  isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.visibility !== 'hidden' &&
      style.display !== 'none' &&
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth
    );
  }
  
  insertContent(element, content) {
    try {
      // 聚焦到目标元素
      element.focus();
      
      // 等待一小段时间确保焦点设置完成
      setTimeout(() => {
        this.setElementContent(element, content);
        this.triggerInputEvents(element);
      }, 50);
      
    } catch (error) {
      console.error('填充内容失败:', error);
      alert('填充失败，请手动复制内容');
    }
  }
  
  // 新增方法：设置元素内容
  setElementContent(element, content) {
    const tagName = element.tagName.toLowerCase();
    const isContentEditable = element.contentEditable === 'true' || element.getAttribute('contenteditable') === 'true';
    const hasRole = element.getAttribute('role') === 'textbox';
    
    if (isContentEditable || hasRole) {
      // 处理可编辑元素和role="textbox"元素
      if (tagName === 'div') {
        // 对于div元素，尝试多种方式设置内容
        element.innerHTML = '';
        element.textContent = content;
        
        // Facebook特殊处理：创建文本节点
        if (element.innerHTML === '') {
          const textNode = document.createTextNode(content);
          element.appendChild(textNode);
        }
      } else {
        element.textContent = content;
      }
    } else if (tagName === 'input' || tagName === 'textarea') {
      // 处理传统输入框
      element.value = content;
    } else {
      // 兜底处理
      if (element.value !== undefined) {
        element.value = content;
      } else {
        element.textContent = content;
      }
    }
  }
  
  // 新增方法：触发输入事件
  triggerInputEvents(element) {
    const events = [
      'input',
      'change', 
      'keyup',
      'keydown',
      'blur',
      'focus'
    ];
    
    events.forEach(eventType => {
      try {
        const event = new Event(eventType, { 
          bubbles: true, 
          cancelable: true,
          composed: true
        });
        element.dispatchEvent(event);
      } catch (e) {
        // 忽略事件触发错误
        console.warn(`触发${eventType}事件失败:`, e);
      }
    });
    
    // 额外触发键盘事件（某些网站需要）
    try {
      const keyboardEvent = new KeyboardEvent('keypress', {
        bubbles: true,
        cancelable: true,
        key: ' ',
        code: 'Space'
      });
      element.dispatchEvent(keyboardEvent);
    } catch (e) {
      console.warn('触发键盘事件失败:', e);
    }
    
    // 显示成功提示
    this.showSuccessMessage('话术已填充');
  }
  
  showSuccessMessage(message) {
    // 创建成功提示
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 10px 20px;
      border-radius: 4px;
      z-index: 10001;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // 3秒后自动移除
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }

  showPreview(scriptItem) {
    console.log('showPreview 被调用');
    const title = scriptItem.dataset.title;
    const content = scriptItem.dataset.content;
    
    if (!title || !content) {
      console.log('缺少标题或内容，退出预览');
      return;
    }
    console.log('显示预览:', title);
    
    // 更新预览内容
    this.previewLayer.querySelector('.preview-title').textContent = title;
    this.previewLayer.querySelector('.preview-text').textContent = content;
    
    // 先显示预览浮层以获取实际尺寸（但设置为不可见）
    this.previewLayer.style.visibility = 'hidden';
    this.previewLayer.style.opacity = '0';
    this.previewLayer.style.display = 'block';
    
    // 计算位置
    const itemRect = scriptItem.getBoundingClientRect();
    const widgetRect = this.widget.getBoundingClientRect();
    
    // 获取预览浮层的实际尺寸
    const previewRect = this.previewLayer.getBoundingClientRect();
    const previewWidth = previewRect.width;
    const previewHeight = previewRect.height;
    
    // 预览浮层右对齐，距离主界面5px
    let left = widgetRect.right + 5;
    let top = itemRect.top;
    
    // 检查是否会超出右边界
    if (left + previewWidth > window.innerWidth) {
      // 显示在左侧
      left = widgetRect.left - previewWidth - 5;
    }
    
    // 检查是否会超出下边界
    if (top + previewHeight > window.innerHeight) {
      top = window.innerHeight - previewHeight - 10;
    }
    
    // 检查是否会超出上边界
    if (top < 10) {
      top = 10;
    }
    
    // 设置最终位置并正常显示
    this.previewLayer.style.left = left + 'px';
    this.previewLayer.style.top = top + 'px';
    // 清除临时样式并添加visible类
    this.previewLayer.style.visibility = '';
    this.previewLayer.style.opacity = '';
    this.previewLayer.style.display = '';
    this.previewLayer.classList.add('visible');
    console.log('预览浮层已显示，visible类已添加');
  }

  hidePreview() {
    if (!this.previewLayer.classList.contains('hover')) {
      this.previewLayer.classList.remove('visible');
    }
  }

  // 强制隐藏预览浮层（用于主面板mouseleave事件）
  forceHidePreview() {
    console.log('forceHidePreview 被调用');
    // 清除延迟隐藏定时器
    if (this.hidePreviewTimeout) {
      clearTimeout(this.hidePreviewTimeout);
      this.hidePreviewTimeout = null;
    }
    // 清除所有样式并移除CSS类
    this.previewLayer.style.visibility = '';
    this.previewLayer.style.opacity = '';
    this.previewLayer.style.display = '';
    this.previewLayer.classList.remove('visible', 'hover');
    console.log('预览浮层已隐藏，visible类已移除');
  }

  editScript(scriptId) {
    const script = this.scripts.find(s => s.id === scriptId);
    if (script) {
      this.showManagePanel();
      document.getElementById('edit-script-id').value = script.id;
      document.getElementById('script-title').value = script.title;
      document.getElementById('script-group').value = script.groupId || '';
      document.getElementById('script-content').value = script.content;
    }
  }

  deleteScript(scriptId) {
    if (confirm('确定要删除这个话术吗？')) {
      this.scripts = this.scripts.filter(s => s.id !== scriptId);
      this.saveData();
      this.renderScripts();
    }
  }

  saveScript() {
    try {
      console.log('开始保存话术...');
      
      const id = document.getElementById('edit-script-id').value;
      const title = document.getElementById('script-title').value.trim();
      const groupId = document.getElementById('script-group').value;
      const content = document.getElementById('script-content').value.trim();

      console.log('获取到的表单数据:', { id, title, groupId, content });

      if (!title || !content) {
        console.warn('验证失败: 标题或内容为空');
        alert('请填写话术标题和内容');
        return;
      }

      if (id) {
        // 编辑现有话术
        const script = this.scripts.find(s => s.id === id);
        if (script) {
          script.title = title;
          script.content = content;
          script.groupId = groupId;
          console.log('更新现有话术:', script);
        } else {
          console.error('未找到要编辑的话术, ID:', id);
          alert('未找到要编辑的话术');
          return;
        }
      } else {
        // 添加新话术
        const newScript = {
          id: Date.now().toString(),
          title,
          content,
          groupId
        };
        this.scripts.push(newScript);
        console.log('添加新话术:', newScript);
        console.log('当前话术总数:', this.scripts.length);
      }

      // 保存数据
      this.saveData()
        .then(() => {
          console.log('数据保存成功');
          this.renderScripts();
          this.clearScriptForm();
          this.hideManagePanel();
          
          // 显示成功提示
          this.showSuccessMessage(id ? '话术更新成功' : '话术添加成功');
        })
        .catch((error) => {
          console.error('保存数据失败:', error);
          alert('保存失败，请重试');
        });
        
    } catch (error) {
      console.error('保存话术时出错:', error);
      alert('保存失败，请检查输入内容');
    }
  }

  clearScriptForm() {
    try {
      console.log('清空话术表单...');
      
      const elements = {
        'edit-script-id': document.getElementById('edit-script-id'),
        'script-title': document.getElementById('script-title'),
        'script-group': document.getElementById('script-group'),
        'script-content': document.getElementById('script-content')
      };
      
      // 检查所有元素是否存在
      for (const [name, element] of Object.entries(elements)) {
        if (!element) {
          console.error(`表单元素不存在: ${name}`);
          return;
        }
      }
      
      // 清空所有表单元素
      elements['edit-script-id'].value = '';
      elements['script-title'].value = '';
      elements['script-group'].value = '';
      elements['script-content'].value = '';
      
      console.log('表单清空完成');
    } catch (error) {
      console.error('清空表单时出错:', error);
    }
  }

  addGroup() {
    const name = prompt('请输入分组名称:');
    if (name && name.trim()) {
      const colors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336', '#00BCD4'];
      const newGroup = {
        id: Date.now().toString(),
        name: name.trim(),
        color: colors[Math.floor(Math.random() * colors.length)]
      };
      this.groups.push(newGroup);
      this.saveData();
      this.renderGroups();
    }
  }

  editGroup(groupId) {
    const group = this.groups.find(g => g.id === groupId);
    if (group) {
      const newName = prompt('请输入新的分组名称:', group.name);
      if (newName && newName.trim()) {
        group.name = newName.trim();
        this.saveData();
        this.renderGroups();
        this.renderScripts();
      }
    }
  }

  deleteGroup(groupId) {
    if (confirm('确定要删除这个分组吗？分组下的话术将移到未分组。')) {
      // 将该分组下的话术移到未分组
      this.scripts.forEach(script => {
        if (script.groupId === groupId) {
          script.groupId = '';
        }
      });
      
      this.groups = this.groups.filter(g => g.id !== groupId);
      this.saveData();
      this.renderGroups();
      this.renderScripts();
    }
  }

  initDragFunctionality() {
    const header = this.widget.querySelector('.widget-header');
    let isDragging = false;
    let startX, startY, startLeft, startTop;

    header.addEventListener('mousedown', (e) => {
      // 只有点击头部区域才能拖拽，排除按钮
      if (e.target.closest('.widget-controls')) return;
      
      isDragging = true;
      this.widget.classList.add('dragging');
      
      const rect = this.widget.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      startLeft = rect.left;
      startTop = rect.top;
      
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      let newLeft = startLeft + deltaX;
      let newTop = startTop + deltaY;
      
      // 边界检查，确保不会拖拽到屏幕外
      const maxLeft = window.innerWidth - this.widget.offsetWidth;
      const maxTop = window.innerHeight - this.widget.offsetHeight;
      
      newLeft = Math.max(0, Math.min(newLeft, maxLeft));
      newTop = Math.max(0, Math.min(newTop, maxTop));
      
      this.widget.style.left = newLeft + 'px';
      this.widget.style.top = newTop + 'px';
      this.widget.style.right = 'auto'; // 清除right定位
      
      e.preventDefault();
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        this.widget.classList.remove('dragging');
        
        // 保存位置到存储
        this.savePosition();
      }
    });
  }

  async savePosition() {
    try {
      // 检查扩展上下文是否有效
      if (!this.isExtensionContextValid()) {
        console.warn('扩展上下文已失效，跳过位置保存');
        return;
      }
      
      const rect = this.widget.getBoundingClientRect();
      await chrome.storage.local.set({
        widgetPosition: {
          left: rect.left,
          top: rect.top
        }
      });
    } catch (error) {
      console.error('保存位置失败:', error);
      // 如果是扩展上下文失效错误，提示用户刷新页面
      if (error.message && error.message.includes('Extension context invalidated')) {
        this.showContextInvalidatedNotice();
      }
    }
  }

  // 检查扩展上下文是否有效
  isExtensionContextValid() {
    try {
      return !!(chrome && chrome.runtime && chrome.runtime.id);
    } catch (error) {
      return false;
    }
  }

  // 显示上下文失效提示
  showContextInvalidatedNotice() {
    // 避免重复显示提示
    if (this.contextNoticeShown) return;
    this.contextNoticeShown = true;
    
    const notice = document.createElement('div');
    notice.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff6b6b;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-size: 14px;
      max-width: 300px;
      cursor: pointer;
    `;
    notice.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 4px;">扩展已更新</div>
      <div style="font-size: 12px; opacity: 0.9;">请刷新页面以继续使用话术助手</div>
    `;
    
    // 点击关闭提示
    notice.addEventListener('click', () => {
      notice.remove();
    });
    
    // 5秒后自动关闭
    setTimeout(() => {
      if (notice.parentNode) {
        notice.remove();
      }
    }, 5000);
    
    document.body.appendChild(notice);
  }

  async loadPosition() {
    try {
      // 检查扩展上下文是否有效
      if (!this.isExtensionContextValid()) {
        console.warn('扩展上下文已失效，跳过位置加载');
        return;
      }
      
      const result = await chrome.storage.local.get(['widgetPosition']);
      if (result.widgetPosition) {
        const { left, top } = result.widgetPosition;
        
        // 检查位置是否在屏幕范围内
        const maxLeft = window.innerWidth - this.widget.offsetWidth;
        const maxTop = window.innerHeight - this.widget.offsetHeight;
        
        const validLeft = Math.max(0, Math.min(left, maxLeft));
        const validTop = Math.max(0, Math.min(top, maxTop));
        
        this.widget.style.left = validLeft + 'px';
        this.widget.style.top = validTop + 'px';
        this.widget.style.right = 'auto';
      }
    } catch (error) {
      console.error('加载位置失败:', error);
      // 如果是扩展上下文失效错误，提示用户刷新页面
      if (error.message && error.message.includes('Extension context invalidated')) {
        this.showContextInvalidatedNotice();
      }
    }
  }

  async saveData() {
    try {
      // 检查扩展上下文是否有效
      if (!this.isExtensionContextValid()) {
        console.warn('扩展上下文已失效，跳过数据保存');
        return;
      }
      
      await chrome.storage.local.set({
        chatScripts: this.scripts,
        chatGroups: this.groups
      });
    } catch (error) {
      console.error('保存数据失败:', error);
      // 如果是扩展上下文失效错误，提示用户刷新页面
      if (error.message && error.message.includes('Extension context invalidated')) {
        this.showContextInvalidatedNotice();
      }
    }
  }
}

// 初始化插件
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ChatListWidget();
  });
} else {
  new ChatListWidget();
}