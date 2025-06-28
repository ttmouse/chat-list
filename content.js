// 话术助手内容脚本
class ChatListWidget {
  constructor() {
    this.isVisible = false;
    this.widget = null;
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
    this.bindEvents();
  }

  async loadData() {
    try {
      const result = await chrome.storage.local.get(['chatScripts', 'chatGroups']);
      this.scripts = result.chatScripts || this.getDefaultScripts();
      this.groups = result.chatGroups || this.getDefaultGroups();
    } catch (error) {
      console.error('加载数据失败:', error);
      this.scripts = this.getDefaultScripts();
      this.groups = this.getDefaultGroups();
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
          <span class="widget-title">话术助手 <span class="version">v1.1.0</span></span>
          <div class="widget-controls">
            <button class="btn-manage" title="管理话术">⚙️</button>
            <button class="btn-toggle" title="收起/展开">📋</button>
            <button class="btn-close" title="关闭">×</button>
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
            <button class="btn-close-manage">×</button>
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
        <div class="script-item" data-id="${script.id}">
          <div class="script-header">
            <span class="script-title">${highlightedTitle}</span>
            <div class="script-actions">
              <button class="btn-edit" data-id="${script.id}" title="编辑">✏️</button>
              <button class="btn-delete" data-id="${script.id}" title="删除">🗑️</button>
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

    // 添加话术
    this.widget.querySelector('.btn-add-script').addEventListener('click', () => {
      this.showManagePanel();
      this.clearScriptForm();
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
      '[contenteditable="true"]'
    ];
    
    const inputs = [];
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(input => {
        // 排除插件自身的输入框
        if (!input.closest('#chat-list-widget')) {
          inputs.push(input);
        }
      });
    });
    
    return inputs;
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
      
      if (element.contentEditable === 'true') {
        // 处理可编辑元素
        element.textContent = content;
        // 触发输入事件
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        // 处理普通输入框
        element.value = content;
        // 触发多种事件以确保兼容性
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        element.dispatchEvent(new Event('keyup', { bubbles: true }));
      }
      
      // 显示成功提示
      this.showSuccessMessage('话术已填充');
      
    } catch (error) {
      console.error('填充内容失败:', error);
      alert('填充失败，请手动复制内容');
    }
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
    const id = document.getElementById('edit-script-id').value;
    const title = document.getElementById('script-title').value.trim();
    const groupId = document.getElementById('script-group').value;
    const content = document.getElementById('script-content').value.trim();

    if (!title || !content) {
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
    }

    this.saveData();
    this.renderScripts();
    this.clearScriptForm();
  }

  clearScriptForm() {
    document.getElementById('edit-script-id').value = '';
    document.getElementById('script-title').value = '';
    document.getElementById('script-group').value = '';
    document.getElementById('script-content').value = '';
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
      const rect = this.widget.getBoundingClientRect();
      await chrome.storage.local.set({
        widgetPosition: {
          left: rect.left,
          top: rect.top
        }
      });
    } catch (error) {
      console.error('保存位置失败:', error);
    }
  }

  async loadPosition() {
    try {
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
    }
  }

  async saveData() {
    try {
      await chrome.storage.local.set({
        chatScripts: this.scripts,
        chatGroups: this.groups
      });
    } catch (error) {
      console.error('保存数据失败:', error);
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