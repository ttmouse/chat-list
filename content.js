// 话术助手内容脚本
class ChatListWidget {
  constructor() {
    this.isVisible = false;
    this.widget = null;
    this.previewModule = null; // 预览模块
    this.scripts = [];
    this.groups = [];
    this.currentGroup = null;
    this.searchKeyword = ''; // 搜索关键词
    this.lastFocusedElement = null; // 记住最后聚焦的元素
    this.focusHistory = []; // 焦点历史记录，最多保存2个
    this.selectedScriptIndex = -1; // 当前选中的话术索引
    // this.focusDebugPanel = null; // 焦点调试面板
    this.whitelist = []; // 网页白名单，将从存储中加载
    this.initialized = false; // 初始化状态标记
    
    this.init();
  }

  // 添加元素到焦点历史记录
  addToFocusHistory(element) {
    // 移除已存在的相同元素
    this.focusHistory = this.focusHistory.filter(el => el !== element);
    
    // 添加到历史记录开头
    this.focusHistory.unshift(element);
    
    // 限制历史记录长度为2个
    if (this.focusHistory.length > 2) {
      this.focusHistory = this.focusHistory.slice(0, 2);
    }
  }

  // 从焦点历史中获取有效的焦点元素
  getValidFocusFromHistory() {
    for (let element of this.focusHistory) {
      // 检查元素是否仍然存在于DOM中且有效
      if (document.contains(element) && this.isValidInput(element)) {
        return element;
      }
    }
    return null;
  }

  startDebugUpdates() {
    // 每500ms更新一次调试信息
    // setInterval(() => {
    //   this.updateDebugPanel();
    // }, 500);
    
    // // 立即更新一次
    // this.updateDebugPanel();
  }

  // updateDebugPanel() {
  //   if (!this.focusDebugPanel) return;
  //   
  //   const currentActive = document.activeElement;
  //   const currentActiveEl = this.focusDebugPanel.querySelector('#current-active');
  //   const lastFocusedEl = this.focusDebugPanel.querySelector('#last-focused');
  //   const focusHistoryEl = this.focusDebugPanel.querySelector('#focus-history');
  //   const availableInputsEl = this.focusDebugPanel.querySelector('#available-inputs');
  //   const isValidInputEl = this.focusDebugPanel.querySelector('#is-valid-input');
  //   
  //   // 更新当前活动元素
  //   if (currentActive && currentActive !== document.body) {
  //     const elementInfo = this.getElementInfo(currentActive);
  //     currentActiveEl.textContent = elementInfo;
  //     currentActiveEl.className = 'debug-value';
  //   } else {
  //     currentActiveEl.textContent = '无';
  //     currentActiveEl.className = 'debug-value';
  //   }
  //   
  //   // 更新最后记录的焦点
  //   if (this.lastFocusedElement && document.contains(this.lastFocusedElement)) {
  //     const elementInfo = this.getElementInfo(this.lastFocusedElement);
  //     lastFocusedEl.textContent = elementInfo;
  //     lastFocusedEl.className = 'debug-value valid';
  //   } else {
  //     lastFocusedEl.textContent = '无';
  //     lastFocusedEl.className = 'debug-value invalid';
  //   }
  //   
  //   // 更新焦点历史记录
  //   if (this.focusHistory.length > 0) {
  //     const historyInfo = this.focusHistory
  //       .filter(el => document.contains(el))
  //       .map((el, index) => `${index + 1}. ${this.getElementInfo(el)}`)
  //       .join('\n');
  //     focusHistoryEl.textContent = historyInfo || '历史记录中的元素已失效';
  //     focusHistoryEl.className = historyInfo ? 'debug-value valid' : 'debug-value invalid';
  //   } else {
  //     focusHistoryEl.textContent = '无';
  //     focusHistoryEl.className = 'debug-value';
  //   }
  //   
  //   // 更新可用输入框数量 - 显示更详细的调试信息
  //   const allInputs = this.findAllInputs(); // 找到所有输入框
  //   const validInputs = this.findValidInputs(); // 经过过滤的输入框
  //   const inputCount = validInputs.length;
  //   
  //   availableInputsEl.innerHTML = `
  //     <div>有效输入框: ${inputCount} 个${inputCount > 1 ? ' (多个)' : ''}</div>
  //     <div style="font-size: 11px; color: #666;">总输入框: ${allInputs.length} 个</div>
  //   `;
  //   availableInputsEl.className = inputCount > 1 ? 'debug-value' : inputCount === 1 ? 'debug-value valid' : 'debug-value invalid';
  //   
  //   // 添加详细的悬停提示
  //   const allDetails = allInputs.map((input, index) => {
  //     const isValid = validInputs.includes(input);
  //     const isMessage = this.isMessageInput(input);
  //     const isValidElement = this.isValidInputElement(input);
  //     const status = isValid ? '✓' : '✗';
  //     const reason = !isValidElement ? '(无效元素)' : !isMessage ? '(非消息输入框)' : '';
  //     return `${status} ${index + 1}. ${this.getElementInfo(input)} ${reason}`;
  //   }).join('\n');
  //   
  //   availableInputsEl.title = `所有输入框详情:\n${allDetails}\n\n✓ = 有效输入框\n✗ = 被过滤的输入框`;
  //   
  //   // 更新是否为有效输入
  //   const isValid = currentActive && this.isValidInput(currentActive);
  //   isValidInputEl.textContent = isValid ? '是' : '否';
  //   isValidInputEl.className = isValid ? 'debug-value valid' : 'debug-value invalid';
  // }

  getElementInfo(element) {
    return ChatListUtils.getElementInfo(element);
  }

  // 检查当前网页是否在白名单中
  isWhitelistedSite() {
    const currentUrl = window.location.href;
    
    // 检查完整URL匹配
    if (this.whitelist.includes(currentUrl)) {
      return true;
    }
    
    // 检查URL前缀匹配（支持带参数的URL）
    return this.whitelist.some(whitelistUrl => {
      // 如果白名单URL包含查询参数，进行完整匹配
      if (whitelistUrl.includes('?')) {
        return currentUrl.startsWith(whitelistUrl);
      }
      // 否则只匹配基础URL部分
      const currentBaseUrl = currentUrl.split('?')[0];
      return currentBaseUrl === whitelistUrl || currentUrl.startsWith(whitelistUrl);
    });
  }

  async init() {
    // 先加载数据（包括白名单）
    await this.loadData();
    
    // 检查白名单，如果不在白名单中则不初始化UI
    if (!this.isWhitelistedSite()) {
      console.log('当前网站不在白名单中，跳过初始化话术扩展');
      return;
    }
    
    console.log('当前网站在白名单中，初始化话术扩展');
    // 获取版本号
    this.version = await this.getVersion();
    this.createWidget();
    this.initPreviewModule();
    // this.createFocusDebugPanel();
    this.bindEvents();
    this.initialized = true; // 标记为已初始化
  }

  // 获取插件版本号
  async getVersion() {
    try {
      // 检查扩展上下文是否有效
      if (!this.isExtensionContextValid()) {
        console.warn('扩展上下文已失效，使用默认版本号');
        return '1.0.0';
      }
      
      const manifest = chrome.runtime.getManifest();
      return manifest.version;
    } catch (error) {
      console.error('获取版本号失败:', error);
      return '1.0.0'; // 默认版本号
    }
  }

  async loadData() {
    try {
      // 检查扩展上下文是否有效
      if (!this.isExtensionContextValid()) {
        console.warn('扩展上下文已失效，使用默认数据');
        this.scripts = this.getDefaultScripts();
        this.groups = this.getDefaultGroups();
        this.whitelist = this.getDefaultWhitelist();
        return;
      }
      
      const result = await chrome.storage.local.get(['chatScripts', 'chatGroups', 'siteWhitelist']);
      this.scripts = result.chatScripts || this.getDefaultScripts();
      this.groups = result.chatGroups || this.getDefaultGroups();
      this.whitelist = result.siteWhitelist || this.getDefaultWhitelist();
    } catch (error) {
      console.error('加载数据失败:', error);
      this.scripts = this.getDefaultScripts();
      this.groups = this.getDefaultGroups();
      this.whitelist = this.getDefaultWhitelist();
      
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
      { id: '1', title: '欢迎语', note: '标准问候语', content: '您好，很高兴为您服务！有什么可以帮助您的吗？', groupId: 'greeting' },
      { id: '2', title: '产品介绍', note: '突出产品优势', content: '我们的产品具有以下特点：高质量、高性价比、优质服务。', groupId: 'service' },
      { id: '3', title: '感谢语', note: '礼貌结束对话', content: '感谢您的咨询，祝您生活愉快！', groupId: 'closing' }
    ];
  }

  getDefaultWhitelist() {
    return [
      'https://www.larksuite.com/hc/zh-CN/chat',
      'https://oa.zalo.me/chat',
      'https://chat.zalo.me/'
    ];
  }

  async refreshScripts() {
    try {
      // 显示刷新提示
      this.showSuccessMessage('正在刷新话术数据...');
      
      // 重新加载数据
      await this.loadData();
      
      // 重新渲染界面
      this.renderGroups();
      this.renderScripts();
      
      // 显示成功提示
      this.showSuccessMessage('话术数据已刷新');
    } catch (error) {
      console.error('刷新话术失败:', error);
      this.showSuccessMessage('刷新失败，请重试');
    }
  }

  createWidget() {
    // 创建主容器
    this.widget = document.createElement('div');
    this.widget.id = 'chat-list-widget';
    this.widget.innerHTML = `
      <div class="widget-wrapper">
        <div class="widget-header">
          <span class="widget-title">话术助手 <span class="version">v${this.version || '1.0.0'}</span></span>
          <div class="widget-controls">
            <button class="btn-manage" title="管理话术"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.85643 16.1891C5.59976 15.8149 4.48117 15.1203 3.59545 14.1999C3.92587 13.8083 4.125 13.3023 4.125 12.7499C4.125 11.5072 3.11764 10.4999 1.875 10.4999C1.79983 10.4999 1.72552 10.5036 1.65225 10.5108C1.55242 10.0227 1.5 9.51743 1.5 8.99986C1.5 8.21588 1.62029 7.45999 1.84342 6.74963C1.85393 6.74978 1.86446 6.74986 1.875 6.74986C3.11764 6.74986 4.125 5.74249 4.125 4.49986C4.125 4.14312 4.04197 3.80581 3.89422 3.50611C4.76156 2.69963 5.82019 2.09608 6.99454 1.771C7.36665 2.50039 8.12501 2.99987 9 2.99987C9.87499 2.99987 10.6334 2.50039 11.0055 1.771C12.1798 2.09608 13.2384 2.69963 14.1058 3.50611C13.958 3.80581 13.875 4.14312 13.875 4.49986C13.875 5.74249 14.8824 6.74986 16.125 6.74986C16.1355 6.74986 16.1461 6.74978 16.1566 6.74963C16.3797 7.45999 16.5 8.21588 16.5 8.99986C16.5 9.51743 16.4476 10.0227 16.3478 10.5108C16.2745 10.5036 16.2002 10.4999 16.125 10.4999C14.8824 10.4999 13.875 11.5072 13.875 12.7499C13.875 13.3023 14.0741 13.8083 14.4045 14.1999C13.5188 15.1203 12.4002 15.8149 11.1436 16.1891C10.8535 15.2818 10.0035 14.6249 9 14.6249C7.9965 14.6249 7.14645 15.2818 6.85643 16.1891Z" stroke="#FFFFFF" stroke-width="0.75" stroke-linejoin="round"/><path d="M9 11.625C10.4497 11.625 11.625 10.4497 11.625 9C11.625 7.55025 10.4497 6.375 9 6.375C7.55025 6.375 6.375 7.55025 6.375 9C6.375 10.4497 7.55025 11.625 9 11.625Z" stroke="#FFFFFF" stroke-width="0.75" stroke-linejoin="round"/></svg></button>
            <button class="btn-close" title="关闭"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 3L15 15" stroke="#FFFFFF" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 15L15 3" stroke="#FFFFFF" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          </div>
        </div>
        <div class="widget-content">
          <div class="group-tabs"></div>
          <div class="search-container">
            <input type="text" class="search-input" placeholder="搜索话术..." />
            <button class="btn-clear-search" title="清除搜索"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 3L15 15" stroke="#333333" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 15L15 3" stroke="#333333" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          </div>
          <div class="script-list"></div>
          <div class="widget-actions">
            <button class="btn-add-script">+ 添加话术</button>
            <button class="btn-import-script"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 1.5V12.75" stroke="#FFFFFF" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.25 9L9 12.75L12.75 9" stroke="#FFFFFF" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M2.25 15.75H15.75" stroke="#FFFFFF" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"/></svg> 导入</button>
            <button class="btn-export-script"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 12.75V1.5" stroke="#FFFFFF" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M12.75 5.25L9 1.5L5.25 5.25" stroke="#FFFFFF" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M2.25 15.75H15.75" stroke="#FFFFFF" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"/></svg> 导出</button>
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
              <div class="group-actions">
                <button class="btn-add-group">+ 添加分组</button>
                <button class="btn-import-data">📥 导入话术</button>
              </div>
            </div>
            <div class="script-management">
              <h4>话术编辑</h4>
              <div class="script-form">
                <input type="hidden" id="edit-script-id">
                <input type="text" id="script-title" placeholder="话术标题">
                <textarea id="script-note" placeholder="备注（可选）" rows="2"></textarea>
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
    
    // 初始状态：隐藏浮层，显示触发器
    this.hideWidget();
    
    // 加载保存的位置
    setTimeout(() => {
      this.loadPosition();
    }, 100);
  }

  initPreviewModule() {
    // 初始化预览模块
    this.previewModule = new PreviewModule(this);
    this.previewModule.createPreviewLayer();
  }


  createTrigger() {
    // 创建右侧触发器
    this.trigger = document.createElement('div');
    this.trigger.id = 'chat-widget-trigger';
    this.trigger.innerHTML = `
      <div class="trigger-icon">💬</div>
    `;
    this.trigger.title = '打开话术助手';
    this.trigger.style.display = 'block'; // 初始显示触发器
    
    document.body.appendChild(this.trigger);
  }

  renderGroups() {
    try {
      const groupTabs = this.widget.querySelector('.group-tabs');
      const groupSelect = this.widget.querySelector('#script-group');
      const groupList = this.widget.querySelector('.group-list');
      
      // 检查必要元素是否存在
      if (!groupTabs) {
        console.error('找不到分组标签容器 .group-tabs');
        return;
      }
      if (!groupSelect) {
        console.error('找不到分组选择器 #script-group');
        return;
      }
      if (!groupList) {
        console.error('找不到分组列表容器 .group-list');
        return;
      }
      
      // 确保groups数组存在
      if (!this.groups || !Array.isArray(this.groups)) {
        console.warn('分组数据不存在或格式错误，使用空数组');
        this.groups = [];
      }
      
      console.log('开始渲染分组，分组数量:', this.groups.length);
      
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
      
      console.log('分组渲染完成');
    } catch (error) {
      console.error('渲染分组时出错:', error);
      console.error('错误堆栈:', error.stack);
    }
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
        (script.note && script.note.toLowerCase().includes(this.searchKeyword.toLowerCase())) ||
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
      let highlightedNote = script.note || '';
      let highlightedContent = script.content;
      
      if (this.searchKeyword) {
        const regex = new RegExp(`(${this.searchKeyword})`, 'gi');
        highlightedTitle = script.title.replace(regex, '<mark>$1</mark>');
        if (script.note) {
          highlightedNote = script.note.replace(regex, '<mark>$1</mark>');
        }
        highlightedContent = script.content.replace(regex, '<mark>$1</mark>');
      }
      
      return `
        <div class="script-item" data-id="${script.id}" data-title="${script.title.replace(/"/g, '&quot;')}" data-note="${(script.note || '').replace(/"/g, '&quot;')}" data-content="${script.content.replace(/"/g, '&quot;')}" data-group-id="${script.groupId}">
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
    
    // 如果有搜索关键词且有结果，自动选中第一个话术
    if (this.searchKeyword && filteredScripts.length > 0) {
      this.selectedScriptIndex = 0;
      this.updateScriptSelection();
    }
  }

  updateScriptSelection() {
    const scriptItems = this.widget.querySelectorAll('.script-item');
    
    // 移除所有选中状态
    scriptItems.forEach(item => item.classList.remove('keyboard-selected'));
    
    // 添加当前选中项的状态
    if (this.selectedScriptIndex >= 0 && scriptItems[this.selectedScriptIndex]) {
      const selectedItem = scriptItems[this.selectedScriptIndex];
      selectedItem.classList.add('keyboard-selected');
      
      // 滚动到可见区域
      selectedItem.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
      
      // 显示预览
      this.previewModule.showPreview(selectedItem);
    } else {
      // 没有选中项时隐藏预览
      this.previewModule.hidePreview();
    }
  }

  bindEvents() {
    // 监听全局点击事件，记住最后点击的输入元素
    document.addEventListener('click', (e) => {
      if (this.isValidInput(e.target)) {
        // 如果是插件内部的输入框，不记录到历史中
        if (ChatListUtils.closest(e.target, '#chat-list-widget')) {
          return;
        }
        
        // 更新最后聚焦的元素
        this.lastFocusedElement = e.target;
        
        // 添加到焦点历史记录
        this.addToFocusHistory(e.target);
        
        // 立即更新调试面板
        // this.updateDebugPanel();
      }
    });

    // 监听全局focus事件，捕获通过键盘导航等方式获得焦点的输入框
    document.addEventListener('focus', (e) => {
      if (this.isValidInput(e.target)) {
        // 如果是插件内部的输入框，不记录到历史中
        if (ChatListUtils.closest(e.target, '#chat-list-widget')) {
          return;
        }
        
        // 更新最后聚焦的元素
        this.lastFocusedElement = e.target;
        
        // 添加到焦点历史记录
        this.addToFocusHistory(e.target);
        
        // 立即更新调试面板
        // this.updateDebugPanel();
      }
    }, true); // 使用捕获阶段确保能捕获到所有焦点事件

    // 监听focusin事件，确保捕获所有焦点变化（包括点击获得焦点）
    document.addEventListener('focusin', (e) => {
      if (this.isValidInput(e.target)) {
        // 如果是插件内部的输入框，不记录到历史中
        if (ChatListUtils.closest(e.target, '#chat-list-widget')) {
          return;
        }
        
        // 更新最后聚焦的元素
        this.lastFocusedElement = e.target;
        
        // 添加到焦点历史记录
        this.addToFocusHistory(e.target);
        
        // 立即更新调试面板
        // this.updateDebugPanel();
      }
    });

    // 防止浮层点击时失去焦点，但允许输入框获得焦点
    this.widget.addEventListener('mousedown', (e) => {
      // 如果点击的是输入框或搜索相关元素，允许默认行为
      if (ChatListUtils.matches(e.target, '.search-input, .btn-clear-search') || 
          ChatListUtils.closest(e.target, '.search-container')) {
        return;
      }
      e.preventDefault(); // 防止默认的焦点转移
    });

    // 全局快捷键监听 - ⌘+g 启动搜索
    document.addEventListener('keydown', (e) => {
      // 增强的快捷键检测，提高跨浏览器兼容性
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isModifierPressed = isMac ? e.metaKey : e.ctrlKey;
      const isGPressed = e.key && e.key.toLowerCase() === 'g' || e.keyCode === 71;
      
      if (isModifierPressed && isGPressed) {
        // 防止浏览器默认的查找行为
        e.preventDefault();
        e.stopImmediatePropagation(); // 防止其他脚本干扰
        
        // 记录快捷键触发前的焦点状态
        const currentFocus = document.activeElement;
        
        // 如果当前焦点是有效输入框且不是插件内部的，记录它
        if (currentFocus && this.isValidInput(currentFocus) && !ChatListUtils.closest(currentFocus, '#chat-list-widget')) {
          this.lastFocusedElement = currentFocus;
          this.addToFocusHistory(currentFocus);
          
          // 立即更新调试面板
          // this.updateDebugPanel();
        }
        
        // 切换面板显示状态：如果已显示则关闭，如果未显示则打开
        if (this.isVisible) {
          // 面板已显示，关闭它
          this.hideWidget();
        } else {
          // 面板未显示，显示它并聚焦搜索框
          this.showWidget();
          
          // 聚焦到搜索输入框
          const searchInput = this.widget.querySelector('.search-input');
          if (searchInput) {
            searchInput.focus();
            searchInput.select(); // 选中现有文本，方便用户直接输入新的搜索词
          }
        }
      }
    }, true); // 使用事件捕获阶段，确保优先处理



    // 关闭按钮事件
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
      this.selectedScriptIndex = -1; // 重置选中索引
      this.renderScripts();
      
      // 显示/隐藏清除按钮
      if (this.searchKeyword) {
        clearSearchBtn.classList.add('visible');
      } else {
        clearSearchBtn.classList.remove('visible');
      }
    });
    
    // 搜索框键盘导航
    searchInput.addEventListener('keydown', (e) => {
      const scriptItems = this.widget.querySelectorAll('.script-item');
      const maxIndex = scriptItems.length - 1;
      
      switch(e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (scriptItems.length > 0) {
            this.selectedScriptIndex = Math.min(this.selectedScriptIndex + 1, maxIndex);
            this.updateScriptSelection();
          }
          break;
          
        case 'ArrowUp':
          e.preventDefault();
          if (scriptItems.length > 0) {
            this.selectedScriptIndex = Math.max(this.selectedScriptIndex - 1, 0);
            this.updateScriptSelection();
          }
          break;
          
        case 'Enter':
          e.preventDefault();
          if (this.selectedScriptIndex >= 0 && scriptItems[this.selectedScriptIndex]) {
            const scriptId = scriptItems[this.selectedScriptIndex].dataset.id;
            const script = this.scripts.find(s => s.id === scriptId);
            if (script) {
              // 先让搜索框失去焦点，避免内容填充到搜索框
              searchInput.blur();
              // 重置选中索引
              this.selectedScriptIndex = -1;
              // 关闭预览浮层
              this.previewModule.forceHidePreview();
              // 使用setTimeout确保blur操作完成后再填充内容
              setTimeout(() => {
                this.fillContent(script.content);
              }, 10);
            }
          }
          break;
          
        case 'Escape':
          e.preventDefault();
          this.selectedScriptIndex = -1;
          this.updateScriptSelection();
          this.previewModule.forceHidePreview(); // 强制隐藏预览
          searchInput.blur();
          break;
      }
    });
    
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      this.searchKeyword = '';
      this.selectedScriptIndex = -1;
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
      if (ChatListUtils.closest(e.target, '.script-item') && !ChatListUtils.closest(e.target, '.script-actions')) {
        const scriptId = ChatListUtils.closest(e.target, '.script-item').dataset.id;
        const script = this.scripts.find(s => s.id === scriptId);
        if (script) {
          // 关闭预览浮层
          this.previewModule.forceHidePreview();
          this.fillContent(script.content);
        }
      }
    });

    // 编辑和删除按钮
    this.widget.querySelector('.script-list').addEventListener('click', (e) => {
      console.log('Script list clicked:', e.target, e.target.classList);
      
      // 查找最近的按钮元素（处理SVG内部元素点击）
      const editBtn = ChatListUtils.closest(e.target, '.btn-edit');
        const deleteBtn = ChatListUtils.closest(e.target, '.btn-delete');
      
      if (editBtn) {
        console.log('Edit button clicked');
        const scriptId = editBtn.dataset.id;
        console.log('Script ID:', scriptId);
        this.editScript(scriptId);
      } else if (deleteBtn) {
        console.log('Delete button clicked');
        const scriptId = deleteBtn.dataset.id;
        this.deleteScript(scriptId);
      }
    });

    // 话术项悬停预览
    this.widget.querySelector('.script-list').addEventListener('mouseenter', (e) => {
      const scriptItem = ChatListUtils.closest(e.target, '.script-item');
      if (scriptItem) {
        this.previewModule.showPreview(scriptItem);
      }
    }, true);

    // 当鼠标离开整个主面板时延迟隐藏预览（给用户时间移动到预览浮层）
    this.widget.addEventListener('mouseleave', () => {
      console.log('主面板 mouseleave 事件触发');
      // 延迟300ms隐藏，如果鼠标进入预览浮层则取消隐藏
      this.previewModule.hidePreviewTimeout = setTimeout(() => {
          console.log('延迟隐藏预览浮层');
          this.previewModule.forceHidePreview();
      }, 100);
    });

    // 移除话术项的mouseleave事件，避免与主面板的延迟隐藏逻辑冲突

    // 预览浮层事件已在预览模块中处理

    // 添加话术
    this.widget.querySelector('.btn-add-script').addEventListener('click', () => {
      try {
        console.log('点击添加话术按钮');
        this.showAddScriptModal();
      } catch (error) {
        console.error('添加话术按钮点击处理出错:', error);
      }
    });

    // 导入话术
    this.widget.querySelector('.btn-import-script').addEventListener('click', () => {
      try {
        console.log('点击导入话术按钮');
        this.showImportDialog();
      } catch (error) {
        console.error('导入话术按钮点击处理出错:', error);
      }
    });

    // 导出话术
    this.widget.querySelector('.btn-export-script').addEventListener('click', () => {
      try {
        console.log('点击导出话术按钮');
        this.exportData();
      } catch (error) {
        console.error('导出话术按钮点击处理出错:', error);
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

    // 导入话术
    this.widget.querySelector('.btn-import-data').addEventListener('click', () => {
      this.showImportDialog();
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
      
      // 确保插件是可见的
      if (!this.isVisible) {
        console.log('插件不可见，先显示插件');
        this.showWidget();
      }
      
      const managePanel = this.widget.querySelector('.manage-panel');
      const widgetContent = this.widget.querySelector('.widget-content');
      
      if (!managePanel) {
        console.error('找不到管理面板元素 .manage-panel');
        console.log('Widget HTML:', this.widget.innerHTML.substring(0, 500));
        return;
      }
      
      if (!widgetContent) {
        console.error('找不到内容区域元素 .widget-content');
        return;
      }
      
      console.log('管理面板元素:', managePanel);
      console.log('内容区域元素:', widgetContent);
      console.log('管理面板当前样式:', managePanel.style.display);
      console.log('内容区域当前样式:', widgetContent.style.display);
      
      // 更新分组选项
      this.renderGroups();
      
      // 强制设置样式
      managePanel.style.display = 'block';
      managePanel.style.visibility = 'visible';
      managePanel.style.opacity = '1';
      widgetContent.style.display = 'none';
      
      // 确保插件容器也是可见的
      this.widget.style.display = 'block';
      this.widget.style.visibility = 'visible';
      
      console.log('管理面板显示成功');
      console.log('设置后管理面板样式:', managePanel.style.display);
      console.log('设置后内容区域样式:', widgetContent.style.display);
      console.log('设置后插件容器样式:', this.widget.style.display);
      
      // 验证元素是否真的可见
      const rect = managePanel.getBoundingClientRect();
      console.log('管理面板位置和尺寸:', rect);
      
      if (rect.width === 0 || rect.height === 0) {
        console.warn('管理面板尺寸为0，可能存在CSS问题');
      }
      
    } catch (error) {
      console.error('显示管理面板时出错:', error);
      console.error('错误堆栈:', error.stack);
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
                            <label class="form-label" for="modalScriptNote">备注</label>
              <textarea id="modalScriptNote" class="form-control" placeholder="请输入备注信息（可选）" rows="2"></textarea>
                            <div id="noteError" class="error-message" style="display: none;"></div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">所属分组</label>
                            <div class="add-group-tabs" id="modalGroupTabs">
                                <div class="add-group-tab active" data-group="">无分组</div>
                            </div>
                            <input type="hidden" id="modalScriptGroup" value="">
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
    const groupTabs = document.getElementById('modalGroupTabs');
    const hiddenInput = document.getElementById('modalScriptGroup');
    if (!groupTabs || !hiddenInput) return;
    
    // 构建分组按钮HTML
    let tabsHTML = `<div class="add-group-tab active" data-group="">无分组</div>`;
    
    this.groups.forEach(group => {
      tabsHTML += `<div class="add-group-tab" data-group="${group.id}" style="border-left: 3px solid ${group.color}">${group.name}</div>`;
    });
    
    groupTabs.innerHTML = tabsHTML;
    hiddenInput.value = '';
    
    // 绑定点击事件
    groupTabs.addEventListener('click', (e) => {
      if (e.target.classList.contains('add-group-tab')) {
        // 移除所有active类
        groupTabs.querySelectorAll('.add-group-tab').forEach(tab => {
          tab.classList.remove('active');
        });
        
        // 添加active类到当前点击的标签
        e.target.classList.add('active');
        
        // 更新隐藏输入框的值
        hiddenInput.value = e.target.dataset.group;
      }
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
    const note = document.getElementById('modalScriptNote')?.value.trim() || '';
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
    
    // 验证备注
    const noteError = document.getElementById('noteError');
    if (noteError) {
      if (note.length > 100) {
        noteError.textContent = '备注长度不能超过100个字符';
        noteError.style.display = 'block';
        isValid = false;
      } else {
        noteError.style.display = 'none';
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
      const note = document.getElementById('modalScriptNote')?.value.trim() || '';
      const groupId = document.getElementById('modalScriptGroup')?.value || '';
      const content = document.getElementById('modalScriptContent')?.value.trim() || '';
      
      const newScript = {
        id: Date.now().toString(),
        title,
        note,
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
        // 关闭预览浮层
        this.previewModule.forceHidePreview();
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
    // 复制到剪贴板
    this.copyToClipboard(content);
    
    // 查找当前焦点的输入框
    const activeElement = document.activeElement;
    
    // 如果当前焦点是插件内部的搜索框，优先使用焦点历史记录
    if (activeElement && ChatListUtils.closest(activeElement, '#chat-list-widget')) {
      const validFocusElement = this.getValidFocusFromHistory();
      if (validFocusElement) {
        this.insertContent(validFocusElement, content);
        return;
      }
      
      // 如果焦点历史中没有有效元素，使用最后聚焦的元素
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
    }
    
    // 如果当前有焦点的输入框且不是插件内部的输入框，优先使用
    if (activeElement && this.isValidInput(activeElement) && !ChatListUtils.closest(activeElement, '#chat-list-widget')) {
      this.insertContent(activeElement, content);
      return;
    }
    
    // 如果没有当前焦点或焦点无效，使用焦点历史记录
    const validFocusElement = this.getValidFocusFromHistory();
    if (validFocusElement) {
      this.insertContent(validFocusElement, content);
      return;
    }
    
    // 如果焦点历史中没有有效元素，使用最后聚焦的元素
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
    
    // 多个输入框时，使用智能选择策略
    const target = this.selectBestInput(inputs);
    
    // 如果有多个输入框，显示提示信息
    if (inputs.length > 1) {
      this.showMultipleInputsNotification(inputs, target);
    }
    
    this.insertContent(target, content);
  }
  
  isValidInput(element) {
    if (!element) return false;
    
    // 检查元素是否可见 - 放宽条件，允许一些隐藏但实际可用的元素
    const style = window.getComputedStyle(element);
    if (style.display === 'none') {
      return false;
    }
    
    // 检查元素尺寸 - 放宽条件，允许较小的元素
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
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
    
    // 检查是否有特殊的输入框属性
    if (element.getAttribute('data-text') === 'true') {
      return true;
    }
    
    // 检查是否有输入框相关的类名
    const className = String(element.className || '');
    if (className.includes('input') || className.includes('textarea') || className.includes('textbox')) {
      return true;
    }
    
    return false;
  }
  
  findAllInputs() {
    // 查找所有可能的输入框，不进行过滤
    const selectors = [
      'textarea',
      'input[type="text"]',
      'input[type="search"]',
      'input[type="url"]',
      'input[type="email"]',
      'input:not([type])',
      '[contenteditable="true"]',
      'div[role="textbox"]',
      'div[contenteditable="true"]',
      'div[data-text="true"]',
      '.input_area',
      '.chat_textarea',
      // Zalo 页面特殊选择器
      '#chat-input-container-id',
      '#chat-input-container-id input',
      '#chat-input-container-id textarea',
      '#chat-input-container-id [contenteditable="true"]',
      '#chat-input-container-id [role="textbox"]',
      // 更多Zalo可能的选择器
      '[class*="rich-input"]',
      '[class*="input-rich"]',
      '[class*="chat-input"]',
      '[class*="message-input"]',
      '[class*="compose"]',
      '[data-testid*="input"]',
      '[data-testid*="compose"]',
      '[data-testid*="message"]',
      '[role="textbox"]',
      '[aria-label*="消息"]',
      '[aria-label*="message"]',
      '[aria-label*="评论"]',
      '[aria-label*="comment"]',
      '[placeholder*="消息"]',
      '[placeholder*="message"]',
      '[placeholder*="评论"]',
      '[placeholder*="comment"]',
      '[placeholder*="输入"]',
      '[placeholder*="input"]',
      '[placeholder*="text"]',
      '[placeholder*="type"]'
    ];
    
    const inputs = [];
    const seen = new Set();
    
    selectors.forEach(selector => {
      try {
        document.querySelectorAll(selector).forEach(input => {
          // 排除插件自身的输入框，避免重复
          if (!ChatListUtils.closest(input, '#chat-list-widget') && !seen.has(input)) {
            inputs.push(input);
            seen.add(input);
          }
        });
      } catch (e) {
        console.warn('选择器错误:', selector, e);
      }
    });
    
    return inputs;
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
      // Zalo 页面特殊选择器
      '#chat-input-container-id',
      '#chat-input-container-id input',
      '#chat-input-container-id textarea',
      '#chat-input-container-id [contenteditable="true"]',
      '#chat-input-container-id [role="textbox"]',
      // 更多Zalo可能的选择器
      '[class*="rich-input"]',
      '[class*="input-rich"]',
      '[class*="chat-input"]',
      '[class*="message-input"]',
      '[class*="compose"]',
      '[data-testid*="input"]',
      '[data-testid*="compose"]',
      '[data-testid*="message"]',
      // 通用社交媒体输入框
      '[role="textbox"]',
      '[aria-label*="消息"]',
      '[aria-label*="message"]',
      '[aria-label*="评论"]',
      '[aria-label*="comment"]',
      '[placeholder*="消息"]',
      '[placeholder*="message"]',
      '[placeholder*="评论"]',
      '[placeholder*="comment"]',
      '[placeholder*="输入"]',
      '[placeholder*="input"]',
      '[placeholder*="text"]',
      '[placeholder*="type"]'
    ];
    
    const inputs = [];
    selectors.forEach(selector => {
      try {
        document.querySelectorAll(selector).forEach(input => {
          // 排除插件自身的输入框
          if (!ChatListUtils.closest(input, '#chat-list-widget') && this.isValidInput(input) && this.isMessageInput(input)) {
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
    
    // 检查元素是否可见 - 放宽条件，允许一些隐藏但实际可用的元素
    const style = window.getComputedStyle(element);
    if (style.display === 'none') {
      return false;
    }
    
    // 检查元素尺寸 - 放宽条件，允许较小的元素
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
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
    
    // 检查是否有特殊的输入框属性
    if (element.getAttribute('data-text') === 'true') {
      return true;
    }
    
    // 检查是否有输入框相关的类名
    const className = String(element.className || '');
    if (className.includes('input') || className.includes('textarea') || className.includes('textbox')) {
      return true;
    }
    
    return false;
  }
  
  // 判断输入框是否为消息输入框（排除搜索框等）
  isMessageInput(element) {
    if (!element) return false;
    
    // 检查是否为明显的搜索相关输入框 - 只排除明确的搜索框
    const searchKeywords = ['search', '搜索', 'find', '查找'];
    
    // 检查placeholder - 只检查明确的搜索关键词
    const placeholder = element.placeholder || '';
    if (searchKeywords.some(keyword => placeholder.toLowerCase().includes(keyword.toLowerCase()))) {
      return false;
    }
    
    // 检查aria-label - 只检查明确的搜索关键词
    const ariaLabel = element.getAttribute('aria-label') || '';
    if (searchKeywords.some(keyword => ariaLabel.toLowerCase().includes(keyword.toLowerCase()))) {
      return false;
    }
    
    // 检查class名称 - 只检查明确的搜索关键词
    const className = element.className || '';
    if (searchKeywords.some(keyword => className.toLowerCase().includes(keyword.toLowerCase()))) {
      return false;
    }
    
    // 排除明显的导航栏、头部区域的输入框
    const excludeSelectors = [
      'nav', 'header', '.navbar', '.header', '.top-bar', '.search-bar',
      '[role="navigation"]', '[role="banner"]'
    ];
    
    for (let selector of excludeSelectors) {
      if (ChatListUtils.closest(element, selector)) {
        return false;
      }
    }
    
    // 检查是否为Zalo页面的聊天输入框
    if (ChatListUtils.closest(element, '#chat-input-container-id')) {
      return true;
    }
    
    // 如果输入框有明确的消息相关属性，直接通过
    const messageKeywords = ['message', '消息', 'comment', '评论', 'chat', '聊天', 'reply', '回复', 'input', 'text'];
    if (messageKeywords.some(keyword => 
      placeholder.toLowerCase().includes(keyword.toLowerCase()) ||
      ariaLabel.toLowerCase().includes(keyword.toLowerCase()) ||
      className.toLowerCase().includes(keyword.toLowerCase())
    )) {
      return true;
    }
    
    // 检查是否在聊天或消息相关的容器中
    const chatContainers = [
      '[id*="chat"]', '[class*="chat"]',
      '[id*="message"]', '[class*="message"]',
      '[id*="input"]', '[class*="input"]',
      '[id*="compose"]', '[class*="compose"]'
    ];
    
    for (let selector of chatContainers) {
      if (ChatListUtils.closest(element, selector)) {
        return true;
      }
    }
    
    // 默认允许通过，除非明确是搜索框
    return true;
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
  
  selectBestInput(inputs) {
    if (inputs.length === 0) return null;
    if (inputs.length === 1) return inputs[0];
    
    // 优先级策略（增强版）：
    // 1. 当前焦点元素（最高优先级）
    // 2. 最近交互过的输入框
    // 3. 可见且在视窗内的输入框
    // 4. 消息相关的输入框（通过属性判断）
    // 5. 位置在页面下半部分的输入框
    // 6. 面积较大的输入框
    // 7. 距离视窗中心较近的输入框
    
    const visibleInputs = inputs.filter(input => this.isElementVisible(input));
    const candidateInputs = visibleInputs.length > 0 ? visibleInputs : inputs;
    
    // 按优先级排序
    const scoredInputs = candidateInputs.map(input => {
      const rect = input.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      let score = 0;
      
      // 1. 当前焦点元素（最高优先级）
      if (input === document.activeElement) score += 500;
      
      // 2. 最近交互加分（提高权重）
      const historyIndex = this.focusHistory.indexOf(input);
      if (historyIndex !== -1) {
        score += (this.focusHistory.length - historyIndex) * 20;
      }
      
      // 3. 是否为最后聚焦的元素（提高权重）
      if (input === this.lastFocusedElement) score += 300;
      
      // 4. 可见性加分
      if (this.isElementVisible(input)) score += 100;
      
      // 5. 消息相关属性加分
      const placeholder = (input.placeholder || '').toLowerCase();
      const ariaLabel = (input.getAttribute('aria-label') || '').toLowerCase();
      const className = String(input.className || '').toLowerCase();
      const messageKeywords = ['message', '消息', 'comment', '评论', 'chat', '聊天', 'reply', '回复', 'input', '输入'];
      
      if (messageKeywords.some(keyword => 
        placeholder.includes(keyword) || 
        ariaLabel.includes(keyword) || 
        className.includes(keyword)
      )) {
        score += 80;
      }
      
      // 6. 位置加分（页面下半部分，但权重降低）
      if (rect.top > viewportHeight * 0.4) score += 30;
      
      // 7. 面积加分（适中的面积更好）
      const area = rect.width * rect.height;
      if (area > 5000 && area < 50000) {
        score += Math.min(area / 2000, 40);
      } else if (area >= 50000) {
        score += 20; // 过大的面积降低分数
      }
      
      // 8. 距离视窗中心的距离（越近越好）
      const centerX = viewportWidth / 2;
      const centerY = viewportHeight / 2;
      const inputCenterX = rect.left + rect.width / 2;
      const inputCenterY = rect.top + rect.height / 2;
      const distance = Math.sqrt(
        Math.pow(inputCenterX - centerX, 2) + 
        Math.pow(inputCenterY - centerY, 2)
      );
      const maxDistance = Math.sqrt(Math.pow(centerX, 2) + Math.pow(centerY, 2));
      const distanceScore = (1 - distance / maxDistance) * 20;
      score += distanceScore;
      
      // 9. 输入框类型加分
      const tagName = input.tagName.toLowerCase();
      if (tagName === 'textarea') score += 25;
      if (input.contentEditable === 'true') score += 15;
      
      // 10. 排除明显的搜索框（减分）
      const searchKeywords = ['search', '搜索', 'find', '查找', 'filter', '筛选'];
      if (searchKeywords.some(keyword => 
        placeholder.includes(keyword) || 
        ariaLabel.includes(keyword) || 
        className.includes(keyword)
      )) {
        score -= 50;
      }
      
      return { input, score, rect };
    });
    
    // 按分数排序，返回最高分的输入框
    scoredInputs.sort((a, b) => b.score - a.score);
    
    // 调试信息
    if (this.debugMode) {
      console.log('输入框评分结果:', scoredInputs.map(item => ({
        element: this.getElementInfo(item.input),
        score: item.score,
        rect: item.rect
      })));
    }
    
    return scoredInputs[0].input;
  }
  
  // 获取输入框评分信息（用于通知显示）
  getInputScores(inputs) {
    if (inputs.length === 0) return [];
    
    const visibleInputs = inputs.filter(input => this.isElementVisible(input));
    const candidateInputs = visibleInputs.length > 0 ? visibleInputs : inputs;
    
    const scoredInputs = candidateInputs.map(input => {
      const rect = input.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      let score = 0;
      
      // 使用与selectBestInput相同的评分逻辑
      if (input === document.activeElement) score += 500;
      
      const historyIndex = this.focusHistory.indexOf(input);
      if (historyIndex !== -1) {
        score += (this.focusHistory.length - historyIndex) * 20;
      }
      
      if (input === this.lastFocusedElement) score += 300;
      if (this.isElementVisible(input)) score += 100;
      
      const placeholder = (input.placeholder || '').toLowerCase();
      const ariaLabel = (input.getAttribute('aria-label') || '').toLowerCase();
      const className = String(input.className || '').toLowerCase();
      const messageKeywords = ['message', '消息', 'comment', '评论', 'chat', '聊天', 'reply', '回复', 'input', '输入'];
      
      if (messageKeywords.some(keyword => 
        placeholder.includes(keyword) || 
        ariaLabel.includes(keyword) || 
        className.includes(keyword)
      )) {
        score += 80;
      }
      
      if (rect.top > viewportHeight * 0.4) score += 30;
      
      const area = rect.width * rect.height;
      if (area > 5000 && area < 50000) {
        score += Math.min(area / 2000, 40);
      } else if (area >= 50000) {
        score += 20;
      }
      
      const centerX = viewportWidth / 2;
      const centerY = viewportHeight / 2;
      const inputCenterX = rect.left + rect.width / 2;
      const inputCenterY = rect.top + rect.height / 2;
      const distance = Math.sqrt(
        Math.pow(inputCenterX - centerX, 2) + 
        Math.pow(inputCenterY - centerY, 2)
      );
      const maxDistance = Math.sqrt(Math.pow(centerX, 2) + Math.pow(centerY, 2));
      const distanceScore = (1 - distance / maxDistance) * 20;
      score += distanceScore;
      
      const tagName = input.tagName.toLowerCase();
      if (tagName === 'textarea') score += 25;
      if (input.contentEditable === 'true') score += 15;
      
      const searchKeywords = ['search', '搜索', 'find', '查找', 'filter', '筛选'];
      if (searchKeywords.some(keyword => 
        placeholder.includes(keyword) || 
        ariaLabel.includes(keyword) || 
        className.includes(keyword)
      )) {
        score -= 50;
      }
      
      return { input, score, rect };
    });
    
    return scoredInputs.sort((a, b) => b.score - a.score);
  }
  
  showMultipleInputsNotification(inputs, selectedInput) {
    // 获取所有输入框的评分信息
    const scoredInputs = this.getInputScores(inputs);
    const selectedScore = scoredInputs.find(item => item.input === selectedInput)?.score || 0;
    
    // 创建临时提示
    const notification = document.createElement('div');
    notification.id = 'multiple-inputs-notification';
    
    // 生成输入框列表
    const inputsList = scoredInputs.map((item, index) => {
      const isSelected = item.input === selectedInput;
      return `
        <div class="input-option ${isSelected ? 'selected' : ''}" data-index="${index}">
          <div class="input-info">
            <span class="input-label">${isSelected ? '✓ ' : ''}${this.getElementInfo(item.input)}</span>
            <span class="input-score">评分: ${Math.round(item.score)}</span>
          </div>
          ${isSelected ? '<div class="selected-reason">已选择（最高评分）</div>' : ''}
        </div>
      `;
    }).join('');
    
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-header">
          <span class="notification-icon">🎯</span>
          <span class="notification-title">智能输入框选择</span>
          <button class="btn-close-notification">×</button>
        </div>
        <div class="notification-body">
          <p>检测到 <strong>${inputs.length}</strong> 个输入框，已智能选择最佳输入框：</p>
          <div class="inputs-list">
            ${inputsList}
          </div>
          <div class="notification-actions">
            <button class="btn-highlight-selected">高亮选中</button>
            <button class="btn-show-all-inputs">显示全部</button>
            <button class="btn-switch-input">切换选择</button>
          </div>
        </div>
      </div>
    `;
    
    // 存储输入框信息供后续使用
    notification._inputsData = { inputs, scoredInputs, selectedInput };
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
      #multiple-inputs-notification {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        z-index: 10002;
        max-width: 500px;
        border: 1px solid #ddd;
        animation: slideIn 0.3s ease;
      }
      
      @keyframes slideIn {
        from { opacity: 0; transform: translate(-50%, -60%); }
        to { opacity: 1; transform: translate(-50%, -50%); }
      }
      
      @keyframes highlightPulse {
        0%, 100% { opacity: 0.3; transform: scale(1); }
        50% { opacity: 0.6; transform: scale(1.02); }
      }
      
      #multiple-inputs-notification .notification-content {
        padding: 0;
      }
      
      #multiple-inputs-notification .notification-header {
        display: flex;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid #eee;
        background: #f8f9fa;
        border-radius: 12px 12px 0 0;
      }
      
      #multiple-inputs-notification .notification-icon {
        font-size: 20px;
        margin-right: 8px;
      }
      
      #multiple-inputs-notification .notification-title {
        font-weight: bold;
        color: #333;
        flex: 1;
      }
      
      #multiple-inputs-notification .btn-close-notification {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: #666;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      #multiple-inputs-notification .btn-close-notification:hover {
        color: #333;
        background: rgba(0, 0, 0, 0.1);
        border-radius: 50%;
      }
      
      #multiple-inputs-notification .notification-body {
        padding: 20px;
      }
      
      #multiple-inputs-notification .notification-body p {
        margin: 0 0 12px 0;
        color: #555;
        line-height: 1.5;
      }
      
      #multiple-inputs-notification .inputs-list {
        margin: 12px 0;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        max-height: 200px;
        overflow-y: auto;
      }
      
      #multiple-inputs-notification .input-option {
        padding: 12px 16px;
        border-bottom: 1px solid #f0f0f0;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      
      #multiple-inputs-notification .input-option:last-child {
        border-bottom: none;
      }
      
      #multiple-inputs-notification .input-option:hover {
        background-color: #f8f9fa;
      }
      
      #multiple-inputs-notification .input-option.selected {
        background-color: #e3f2fd;
        border-left: 4px solid #2196f3;
      }
      
      #multiple-inputs-notification .input-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      #multiple-inputs-notification .input-label {
        font-family: monospace;
        font-size: 12px;
        color: #333;
        flex: 1;
        margin-right: 8px;
      }
      
      #multiple-inputs-notification .input-score {
        font-size: 11px;
        color: #666;
        background: #f0f0f0;
        padding: 2px 6px;
        border-radius: 4px;
      }
      
      #multiple-inputs-notification .selected-reason {
        font-size: 11px;
        color: #2196f3;
        margin-top: 4px;
        font-weight: 500;
      }
      
      #multiple-inputs-notification .notification-body code {
        background: #f1f3f4;
        padding: 2px 6px;
        border-radius: 4px;
        font-family: monospace;
        font-size: 12px;
      }
      
      #multiple-inputs-notification .notification-actions {
        display: flex;
        gap: 10px;
        margin-top: 16px;
      }
      
      #multiple-inputs-notification .notification-actions button {
        padding: 8px 16px;
        border: 1px solid #ddd;
        border-radius: 6px;
        background: white;
        cursor: pointer;
        font-size: 13px;
        transition: all 0.2s;
      }
      
      #multiple-inputs-notification .notification-actions button:hover {
        background: #f8f9fa;
        border-color: #999;
      }
      
      #multiple-inputs-notification .btn-highlight-selected {
        background: #4CAF50;
        color: white;
        border-color: #4CAF50;
      }
      
      #multiple-inputs-notification .btn-highlight-selected:hover {
        background: #45a049;
      }
      
      #multiple-inputs-notification .btn-switch-input {
        background: #2196f3;
        color: white;
        border-color: #2196f3;
      }
      
      #multiple-inputs-notification .btn-switch-input:hover {
        background: #1976d2;
      }
      
      #multiple-inputs-notification .btn-show-all-inputs {
        background: #ff9800;
        color: white;
        border-color: #ff9800;
      }
      
      #multiple-inputs-notification .btn-show-all-inputs:hover {
        background: #f57c00;
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(notification);
    
    // 绑定事件
    notification.querySelector('.btn-close-notification').addEventListener('click', () => {
      notification.remove();
      style.remove();
    });
    
    notification.querySelector('.btn-highlight-selected').addEventListener('click', () => {
      this.highlightElement(selectedInput);
      notification.remove();
      style.remove();
    });
    
    notification.querySelector('.btn-show-all-inputs').addEventListener('click', () => {
      this.highlightAllInputs(inputs);
      notification.remove();
      style.remove();
    });
    
    // 切换选择按钮事件
    notification.querySelector('.btn-switch-input').addEventListener('click', () => {
      const currentIndex = inputs.indexOf(selectedInput);
      const nextIndex = (currentIndex + 1) % inputs.length;
      const newSelectedInput = inputs[nextIndex];
      
      // 更新选中状态
      notification._inputsData.selectedInput = newSelectedInput;
      
      // 更新UI显示
      const options = notification.querySelectorAll('.input-option');
      options.forEach((option, index) => {
        option.classList.toggle('selected', index === nextIndex);
      });
      
      // 高亮新选中的输入框
      this.highlightElement(newSelectedInput);
      
      // 更新全局选中的输入框
      this.selectedInput = newSelectedInput;
    });
    
    // 输入框选项点击事件
    const inputOptions = notification.querySelectorAll('.input-option');
    inputOptions.forEach((option, index) => {
      option.addEventListener('click', () => {
        const newSelectedInput = inputs[index];
        
        // 更新选中状态
        notification._inputsData.selectedInput = newSelectedInput;
        
        // 更新UI显示
        inputOptions.forEach((opt, idx) => {
          opt.classList.toggle('selected', idx === index);
        });
        
        // 高亮选中的输入框
        this.highlightElement(newSelectedInput);
        
        // 更新全局选中的输入框
        this.selectedInput = newSelectedInput;
      });
    });
    
    // 5秒后自动关闭（延长时间以便用户交互）
    setTimeout(() => {
      if (document.contains(notification)) {
        notification.remove();
        style.remove();
      }
    }, 5000);
  }
  
  highlightElement(element) {
    const highlight = document.createElement('div');
    highlight.style.cssText = `
      position: absolute;
      background: rgba(76, 175, 80, 0.3);
      border: 2px solid #4CAF50;
      border-radius: 4px;
      pointer-events: none;
      z-index: 9999;
      animation: highlightPulse 1s ease-in-out 3;
    `;
    
    const rect = element.getBoundingClientRect();
    highlight.style.left = (rect.left + window.scrollX - 2) + 'px';
    highlight.style.top = (rect.top + window.scrollY - 2) + 'px';
    highlight.style.width = (rect.width + 4) + 'px';
    highlight.style.height = (rect.height + 4) + 'px';
    
    document.body.appendChild(highlight);
    
    setTimeout(() => {
      if (document.contains(highlight)) {
        highlight.remove();
      }
    }, 3000);
  }
  
  highlightAllInputs(inputs) {
    inputs.forEach((input, index) => {
      setTimeout(() => {
        this.highlightElement(input);
      }, index * 200);
    });
  }
  
  getElementInfo(element) {
    if (!element) return 'Unknown';
    
    let info = element.tagName.toLowerCase();
    
    if (element.id) {
      info += `#${element.id}`;
    }
    
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.trim()).slice(0, 2);
      if (classes.length > 0) {
        info += `.${classes.join('.')}`;
      }
    }
    
    if (element.placeholder) {
      info += ` [${element.placeholder.substring(0, 20)}...]`;
    }
    
    return info;
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
      // 检查是否是 Zalo 类型的复杂输入框结构
      if (element.classList.contains('rich-input') || element.id === 'richInput') {
        // 清空现有内容
        element.innerHTML = '';
        
        // 按行分割内容并创建对应的 div 结构
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          const lineDiv = document.createElement('div');
          lineDiv.id = `input_line_${index}`;
          
          if (line.trim() === '') {
            // 空行使用 <br> 标签
            lineDiv.appendChild(document.createElement('br'));
          } else {
            // 非空行创建 span 元素
            const span = document.createElement('span');
            span.className = '';
            span.setAttribute('data-mention', line);
            span.id = 'input_part_0';
            span.style.whiteSpace = 'pre-wrap';
            span.textContent = line;
            lineDiv.appendChild(span);
          }
          
          element.appendChild(lineDiv);
        });
      } else {
        // 其他 contentEditable 元素使用简单的 innerText
        element.innerText = content;
      }
    } else if (tagName === 'input' || tagName === 'textarea') {
      // 处理传统输入框
      element.value = content;
    } else {
      // 兜底处理
      if (element.value !== undefined) {
        element.value = content;
      } else {
        element.innerText = content;
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
    
    // 显示成功提示已移除
    // this.showSuccessMessage('话术已填充');
  }
  
  showSuccessMessage(message) {
    return ChatListUtils.showSuccessMessage(message);
  }



  editScript(scriptId) {
    console.log('editScript called with ID:', scriptId);
    const script = this.scripts.find(s => s.id === scriptId);
    console.log('Found script:', script);
    if (script) {
      console.log('显示编辑话术模态框');
      
      // 显示编辑模态框
      this.showEditScriptModal(script);
    } else {
      console.error('未找到指定的话术:', scriptId);
    }
  }

  showEditScriptModal(script) {
    console.log('显示编辑话术模态框', script);
    
    // 创建编辑模态框HTML
    const modalHTML = `
        <div class="modal-overlay" id="editScriptModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">编辑话术</h3>
                    <button class="btn-close-modal"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 16.5C13.1421 16.5 16.5 13.1421 16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5Z" stroke="#333333" stroke-width="0.75" stroke-linejoin="round"/><path d="M11.1211 6.87891L6.87842 11.1215" stroke="#333333" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.87891 6.87891L11.1215 11.1215" stroke="#333333" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
                </div>
                <div class="modal-body">
                    <form id="editScriptForm">
                        <input type="hidden" id="editScriptId" value="${script.id}">
                        <div class="form-group">
                            <label class="form-label" for="editModalScriptTitle">话术标题 *</label>
                            <input type="text" id="editModalScriptTitle" class="form-control" placeholder="请输入话术标题" value="${script.title || ''}" required>
                            <div id="editTitleError" class="error-message" style="display: none;"></div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label" for="editModalScriptNote">备注</label>
              <textarea id="editModalScriptNote" class="form-control" placeholder="请输入备注信息（可选）" rows="2">${script.note || ''}</textarea>
                            <div id="editNoteError" class="error-message" style="display: none;"></div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">所属分组</label>
                            <div class="edit-group-tabs" id="editModalGroupTabs">
                                <div class="edit-group-tab" data-group="">无分组</div>
                            </div>
                            <input type="hidden" id="editModalScriptGroup" value="">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label" for="editModalScriptContent">话术内容 *</label>
                            <textarea id="editModalScriptContent" class="form-control textarea" placeholder="请输入话术内容" required>${script.content || ''}</textarea>
                            <div id="editContentError" class="error-message" style="display: none;"></div>
                        </div>
                    </form>
                    
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary btn-cancel-edit-modal">取消</button>
                        <button type="button" class="btn btn-primary btn-save-edit-modal">保存话术</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 移除已存在的编辑模态框
    const existingModal = document.getElementById('editScriptModal');
    if (existingModal) {
      existingModal.remove();
    }
    
    // 添加模态框到页面
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // 填充分组选项并设置当前分组
    this.populateEditGroupOptions(script.groupId);
    
    // 绑定编辑模态框事件
    this.bindEditModalEvents();
    
    // 显示模态框
    const modal = document.getElementById('editScriptModal');
    modal.style.display = 'flex';
    
    // 设置焦点
    setTimeout(() => {
      const titleInput = document.getElementById('editModalScriptTitle');
      if (titleInput) {
        titleInput.focus();
      }
    }, 100);
  }

  populateEditGroupOptions(currentGroup) {
    const groupTabs = document.getElementById('editModalGroupTabs');
    const hiddenInput = document.getElementById('editModalScriptGroup');
    if (!groupTabs || !hiddenInput) return;
    
    // 构建分组按钮HTML
    let tabsHTML = `<div class="edit-group-tab ${!currentGroup ? 'active' : ''}" data-group="">无分组</div>`;
    
    this.groups.forEach(group => {
      const isActive = group.id === currentGroup ? 'active' : '';
      tabsHTML += `<div class="edit-group-tab ${isActive}" data-group="${group.id}" style="border-left: 3px solid ${group.color}">${group.name}</div>`;
    });
    
    groupTabs.innerHTML = tabsHTML;
    hiddenInput.value = currentGroup || '';
    
    // 绑定点击事件
    groupTabs.addEventListener('click', (e) => {
      if (e.target.classList.contains('edit-group-tab')) {
        // 移除所有active类
        groupTabs.querySelectorAll('.edit-group-tab').forEach(tab => {
          tab.classList.remove('active');
        });
        
        // 添加active类到当前点击的标签
        e.target.classList.add('active');
        
        // 更新隐藏输入框的值
        hiddenInput.value = e.target.dataset.group;
      }
    });
  }

  bindEditModalEvents() {
    // 关闭按钮
    const closeBtn = document.querySelector('#editScriptModal .btn-close-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hideEditScriptModal());
    }
    
    // 取消按钮
    const cancelBtn = document.querySelector('.btn-cancel-edit-modal');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.hideEditScriptModal());
    }
    
    // 保存按钮
    const saveBtn = document.querySelector('.btn-save-edit-modal');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveEditedScript());
    }
    
    // 点击遮罩层关闭
    const modal = document.getElementById('editScriptModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.hideEditScriptModal();
        }
      });
    }
    
    // ESC键关闭，Ctrl+Enter保存
    const keyHandler = (e) => {
      if (e.key === 'Escape') {
        this.hideEditScriptModal();
        document.removeEventListener('keydown', keyHandler);
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        this.saveEditedScript();
      }
    };
    document.addEventListener('keydown', keyHandler);
  }

  hideEditScriptModal() {
    console.log('隐藏编辑话术模态框');
    const modal = document.getElementById('editScriptModal');
    if (modal) {
      modal.remove();
    }
    // 关闭预览浮层
    this.previewModule.forceHidePreview();
  }

  saveEditedScript() {
    console.log('保存编辑的话术');
    
    const scriptId = document.getElementById('editScriptId')?.value;
    const title = document.getElementById('editModalScriptTitle')?.value?.trim();
    const note = document.getElementById('editModalScriptNote')?.value?.trim();
    const group = document.getElementById('editModalScriptGroup')?.value;
    const content = document.getElementById('editModalScriptContent')?.value?.trim();
    
    console.log('获取表单数据:', { scriptId, title, note, group, content });
    
    // 验证必填字段
    if (!title) {
      this.showError('editTitleError', '请输入话术标题');
      return;
    }
    
    if (!content) {
      this.showError('editContentError', '请输入话术内容');
      return;
    }
    
    // 清除错误信息
    this.clearErrors(['editTitleError', 'editContentError']);
    
    // 更新话术
    const scriptIndex = this.scripts.findIndex(s => s.id === scriptId);
    if (scriptIndex !== -1) {
      this.scripts[scriptIndex] = {
        ...this.scripts[scriptIndex],
        title,
        note,
        groupId: group,
        content,
        updatedAt: new Date().toISOString()
      };
      
      // 保存到存储
      this.saveData();
      
      // 刷新显示
      this.renderScripts();
      
      // 隐藏模态框
      this.hideEditScriptModal();
      
      // 关闭预览浮层
      this.previewModule.forceHidePreview();
      
      console.log('话术更新成功');
    } else {
      console.error('未找到要更新的话术');
    }
  }

  showError(errorId, message) {
    const errorEl = document.getElementById(errorId);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }
  }

  clearErrors(errorIds) {
    errorIds.forEach(id => {
      const errorEl = document.getElementById(id);
      if (errorEl) {
        errorEl.style.display = 'none';
      }
    });
  }

  deleteScript(scriptId) {
    this.showConfirmDialog(
      '确认删除',
      '确定要删除这个话术吗？',
      () => {
        this.scripts = this.scripts.filter(s => s.id !== scriptId);
        this.saveData();
        this.renderScripts();
      }
    );
  }

  saveScript() {
    try {
      console.log('开始保存话术...');
      
      const id = this.widget.querySelector('#edit-script-id').value;
      const title = this.widget.querySelector('#script-title').value.trim();
      const note = this.widget.querySelector('#script-note').value.trim();
      const groupId = this.widget.querySelector('#script-group').value;
      const content = this.widget.querySelector('#script-content').value.trim();

      console.log('获取到的表单数据:', { id, title, note, groupId, content });

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
          script.note = note;
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
          note,
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
        'edit-script-id': this.widget.querySelector('#edit-script-id'),
        'script-title': this.widget.querySelector('#script-title'),
        'script-note': this.widget.querySelector('#script-note'),
        'script-group': this.widget.querySelector('#script-group'),
        'script-content': this.widget.querySelector('#script-content')
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
      elements['script-note'].value = '';
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
    this.showConfirmDialog(
      '确认删除分组',
      '确定要删除这个分组吗？分组下的话术将移到未分组。',
      () => {
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
    );
  }

  initDragFunctionality() {
    const header = this.widget.querySelector('.widget-header');
    let isDragging = false;
    let startX, startY, startLeft, startTop;

    header.addEventListener('mousedown', (e) => {
      // 只有点击头部区域才能拖拽，排除按钮
      if (ChatListUtils.closest(e.target, '.widget-controls')) return;
      
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
    return ChatListUtils.isExtensionContextValid();
  }

  // 显示上下文失效提示
  showContextInvalidatedNotice() {
    return ChatListUtils.showContextInvalidatedNotice();
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

  showImportDialog() {
    // 直接创建文件输入元素并触发选择
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    
    // 文件选择处理
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.importData(e.target.files[0]);
      }
      // 清理临时元素
      document.body.removeChild(fileInput);
    });
    
    // 添加到页面并触发点击
    document.body.appendChild(fileInput);
    fileInput.click();
  }
  
  async importData(file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!data.scripts || !Array.isArray(data.scripts)) {
        throw new Error('无效的数据格式');
      }
      
      // 分析导入数据
      const existingTitles = new Set(this.scripts.map(script => script.title));
      const newScripts = data.scripts.filter(script => !existingTitles.has(script.title));
      const duplicateScripts = data.scripts.filter(script => existingTitles.has(script.title));
      
      // 处理分组数据
      const existingGroupIds = new Set(this.groups.map(group => group.id));
      const newGroups = (data.groups || []).filter(group => !existingGroupIds.has(group.id));
      
      // 显示导入预览
      const importMessage = [
        `共 ${data.scripts.length} 个话术，${(data.groups || []).length} 个分组`,
        `新话术：${newScripts.length} 个`,
        `重复话术：${duplicateScripts.length} 个（将跳过）`,
        `新分组：${newGroups.length} 个`,
        '',
        '是否继续增量导入？'
      ].join('\n');
      
      this.showConfirmDialog(
        '导入确认',
        importMessage,
        async () => {
          // 生成新的ID避免冲突
          const maxId = Math.max(0, ...this.scripts.map(s => parseInt(s.id) || 0));
          newScripts.forEach((script, index) => {
            script.id = String(maxId + index + 1);
          });
          
          // 合并数据
          this.scripts = [...this.scripts, ...newScripts];
          this.groups = [...this.groups, ...newGroups];
          
          await this.saveData();
          
          // 重新渲染界面
          this.renderGroups();
          this.renderScripts();
          
          const resultMessage = [
            '导入完成！',
            `新增话术：${newScripts.length} 个`,
            `跳过重复：${duplicateScripts.length} 个`,
            `新增分组：${newGroups.length} 个`
          ].join('\n');
          
          this.showSuccessMessage(resultMessage);
        }
      );
    } catch (error) {
      console.error('导入失败:', error);
      alert('导入失败，请检查文件格式是否正确');
    }
  }

  exportData() {
    try {
      const exportData = {
        scripts: this.scripts,
        groups: this.groups,
        exportTime: new Date().toISOString(),
        version: '1.0'
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-scripts-${new Date().toISOString().split('T')[0]}.json`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      
      this.showSuccessMessage('导出成功！');
      console.log('话术数据导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请稍后重试');
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

  // 复制内容到剪贴板
  async copyToClipboard(text) {
    return ChatListUtils.copyToClipboard(text);
  }

  // 显示自定义确认对话框
  showConfirmDialog(title, message, onConfirm, onCancel = null) {
    return ChatListUtils.showConfirmDialog(title, message, onConfirm, onCancel);
  }
}

// 添加消息监听器处理数据更新和浮层控制
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'DATA_UPDATED') {
    // 重新加载数据
    if (window.chatListWidget) {
      window.chatListWidget.loadData().then(() => {
        console.log('数据已更新');
      });
    }
  } else if (message.type === 'TOGGLE_WIDGET') {
    // 切换浮层显示/隐藏
    if (window.chatListWidget) {
      if (window.chatListWidget.isVisible) {
        window.chatListWidget.hideWidget();
      } else {
        window.chatListWidget.showWidget();
      }
      sendResponse({ success: true, visible: window.chatListWidget.isVisible });
    }
  } else if (message.type === 'SHOW_WIDGET') {
    // 显示浮层
    if (window.chatListWidget) {
      window.chatListWidget.showWidget();
      sendResponse({ success: true, visible: true });
    }
  } else if (message.type === 'HIDE_WIDGET') {
    // 隐藏浮层
    if (window.chatListWidget) {
      window.chatListWidget.hideWidget();
      sendResponse({ success: true, visible: false });
    }
  } else if (message.type === 'OPEN_MANAGE_PANEL') {
    // 打开管理面板
    if (window.chatListWidget) {
      console.log('收到OPEN_MANAGE_PANEL消息，开始显示管理面板');
      // 确保插件先显示
      window.chatListWidget.showWidget();
      // 使用setTimeout确保showWidget完成后再显示管理面板
      setTimeout(() => {
        window.chatListWidget.showManagePanel();
      }, 50);
      sendResponse({ success: true });
    } else {
      console.error('chatListWidget未找到，无法显示管理面板');
      sendResponse({ success: false, error: 'Widget not found' });
    }
  } else if (message.type === 'WHITELIST_UPDATED') {
    // 白名单更新
    if (window.chatListWidget) {
      window.chatListWidget.whitelist = message.whitelist || [];
      
      // 检查当前页面是否在白名单中
      if (!window.chatListWidget.isWhitelistedSite()) {
        // 如果不在白名单中，隐藏并销毁组件
        window.chatListWidget.hideWidget();
        console.log('当前网站不在白名单中，话术助手已隐藏');
      } else {
        // 如果在白名单中但组件未初始化，重新初始化
        if (!window.chatListWidget.initialized) {
          window.chatListWidget.init();
        }
      }
      
      sendResponse({ success: true });
    }
  }
});

// 初始化插件
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.chatListWidget = new ChatListWidget();
  });
} else {
  window.chatListWidget = new ChatListWidget();
  
  // 初始化自适应高度功能
  initAutoResizeTextareas();
}

// 自适应高度功能
function autoResizeTextarea(textarea) {
  // 重置高度以获取正确的scrollHeight
  textarea.style.height = 'auto';
  
  // 计算新高度
  const newHeight = Math.max(textarea.scrollHeight, parseInt(getComputedStyle(textarea).minHeight));
  
  // 设置新高度
  textarea.style.height = newHeight + 'px';
}

// 初始化所有textarea的自适应高度
function initAutoResizeTextareas() {
  // 为现有的textarea添加自适应功能
  document.querySelectorAll('textarea').forEach(textarea => {
    setupTextareaAutoResize(textarea);
  });
  
  // 监听动态添加的textarea
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // 检查新添加的节点是否是textarea
          if (node.tagName === 'TEXTAREA') {
            setupTextareaAutoResize(node);
          }
          // 检查新添加节点内部的textarea
          node.querySelectorAll && node.querySelectorAll('textarea').forEach(textarea => {
            setupTextareaAutoResize(textarea);
          });
        }
      });
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// 为单个textarea设置自适应功能
function setupTextareaAutoResize(textarea) {
  // 避免重复绑定
  if (textarea.hasAttribute('data-auto-resize')) {
    return;
  }
  
  textarea.setAttribute('data-auto-resize', 'true');
  
  // 输入事件
  textarea.addEventListener('input', () => {
    autoResizeTextarea(textarea);
  });
  
  // 粘贴事件
  textarea.addEventListener('paste', () => {
    setTimeout(() => {
      autoResizeTextarea(textarea);
    }, 0);
  });
  
  // 初始调整
  setTimeout(() => {
    autoResizeTextarea(textarea);
  }, 0);
}