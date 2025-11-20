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
    // 白名单逻辑已移除，扩展在所有站点显示
    this.settings = {}; // 预留设置对象（不再包含白名单开关）
    this.initialized = false; // 初始化状态标记
    this.currentSortBy = 'usage'; // 当前排序方式：'default', 'usage'
    this.openedByShortcut = false; // 标记面板是否通过快捷键打开
    this.storageService = new StorageService();
    this.remoteEnabled = !!this.storageService.enableRemote;
    this.currentSourceFilter = 'all';
    this.addScriptButton = null;
    this.scriptContentTextarea = null;
    this.syncScriptGroupSelector = null;

    // 初始化新的输入框管理器
    this.inputManager = new InputManager();

    this.init();

    window.addEventListener('message', async (e) => {
      const d = e && e.data;
      if (d && d.type === 'SUPABASE_CONFIG') {
        const url = (d.SUPABASE_URL || '').trim();
        const key = (d.SUPABASE_ANON_KEY || '').trim();
        if (url && key) {
          try {
            await chrome.storage.local.set({ SUPABASE_URL: url, SUPABASE_ANON_KEY: key });
            if (window.ensureSupabase) await window.ensureSupabase();
            const r = await this.storageService.testConnection();
            if (r && r.ok) this.showSuccessMessage('Supabase配置已接收并连接成功');
          } catch (_) { }
        }
      }
    });
  }

  async submitScriptToPublic(scriptId) {
    if (!this.remoteEnabled) {
      this.showSuccessMessage('未启用远端功能');
      return;
    }
    const s = this.scripts.find(x => x.id === scriptId);
    if (!s) return;
    const token = prompt('请输入发布令牌', '123456');
    if (!token) return;
    const group = this.groups.find(g => g.id === s.groupId) || null;
    const scripts = [{ id: s.id, groupId: s.groupId || null, title: s.title || '', note: s.note || '', content: s.content || '', order_index: 0 }];
    const groups = group ? [{ id: group.id, name: group.name, color: group.color, order_index: group.order_index || 0 }] : [];
    const r = await this.storageService.publishAllToPublic(scripts, groups, token);
    if (r && r.success) {
      this.showSuccessMessage('已保存到公共库');
    } else {
      this.showSuccessMessage('保存失败');
    }
  }

  async publishSelectedToPublic() {
    if (!this.remoteEnabled) {
      this.showSuccessMessage('未启用远端功能');
      return;
    }
    const sel = this.uiRenderer?.getSelectedScript();
    if (!sel) {
      this.showSuccessMessage('请先选择话术');
      return;
    }
    const token = await this.getPublishToken();
    if (!token) return;
    const group = this.groups.find(g => g.id === sel.groupId) || null;
    const scripts = [{ id: sel.id, groupId: sel.groupId || null, title: sel.title || '', note: sel.note || '', content: sel.content || '', order_index: 0 }];
    const groups = group ? [{ id: group.id, name: group.name, color: group.color, order_index: group.order_index || 0 }] : [];
    const r = await this.publishViaFunction(token, scripts, groups);
    if (r && r.success) {
      this.showSuccessMessage('已保存到公共库');
    } else {
      this.showSuccessMessage('保存失败');
    }
  }

  async loginSharedAccount() {
    const email = prompt('请输入共享账户邮箱');
    const password = prompt('请输入共享账户密码');
    if (!email || !password) return;
    const ok = await (window.ensureSupabase ? window.ensureSupabase() : Promise.resolve(false));
    if (!ok || !window.supabaseClient?.auth) {
      this.showSuccessMessage('客户端未初始化');
      return;
    }
    try {
      const { error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
      if (error) {
        this.showSuccessMessage('登录失败');
      } else {
        this.showSuccessMessage('登录成功');
      }
    } catch (_) {
      this.showSuccessMessage('登录异常');
    }
  }

  async publishAllToPublicFromLocal() {
    if (!this.remoteEnabled) {
      this.showSuccessMessage('未启用远端功能');
      return;
    }

    const privateScripts = (this.scripts || []).filter(s => s.__source !== 'public').map(s => ({
      id: s.id,
      group_id: s.groupId || null,
      title: s.title || '',
      note: s.note || '',
      content: s.content || '',
      order_index: s.order_index || 0,
      is_active: true
    }));

    const privateGroups = (this.groups || []).filter(g => g.__source !== 'public').map(g => ({
      id: g.id,
      name: g.name,
      color: g.color,
      order_index: g.order_index || 0
    }));

    try {
      const response = await fetch('http://localhost:3001/api/upload-public', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scripts: privateScripts,
          groups: privateGroups
        })
      });

      if (!response.ok) {
        throw new Error(`上传失败: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        this.showSuccessMessage(`批量上传成功！话术: ${privateScripts.length} 条，分组: ${privateGroups.length} 个`);
      } else {
        this.showSuccessMessage('批量上传失败');
      }
    } catch (error) {
      console.error('上传失败:', error);
      this.showSuccessMessage('上传失败: ' + error.message);
    }
  }

  async getPublishToken() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const r = await chrome.storage.local.get(['publishToken']);
        const t = (r.publishToken || '').trim();
        if (t) return t;
      } else {
        const t = (localStorage.getItem('publishToken') || '').trim();
        if (t) return t;
      }
    } catch (_) { }
    const t = prompt('请输入发布令牌', '123456');
    if ((t || '').trim()) {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          await chrome.storage.local.set({ publishToken: t.trim() });
        } else {
          localStorage.setItem('publishToken', t.trim());
        }
      } catch (_) { }
      return t.trim();
    }
    return null;
  }

  async publishViaFunction(token, scripts, groups) {
    const ok = await (window.ensureSupabase ? window.ensureSupabase() : Promise.resolve(false));
    if (!ok || !window.supabaseClient) return { success: false };
    try {
      if (window.supabaseClient.functions && window.supabaseClient.functions.invoke) {
        const { data, error } = await window.supabaseClient.functions.invoke('publish_public', { body: { token, scripts, groups } });
        if (!error) return { success: true, data };
        console.error('Edge Function publish_public error:', error);
      }
    } catch (_) { }
    try {
      return await this.storageService.publishAllToPublic(scripts, groups, token);
    } catch (_) {
      return { success: false };
    }
  }

  showSuccessMessage(message) {
    return ChatListUtils.showSuccessMessage(message);
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
      if (document.contains(element) && this.inputManager.isValidInput(element)) {
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



  getElementInfo(element) {
    return ChatListUtils.getElementInfo(element);
  }

  // 白名单逻辑已移除：始终允许显示
  isWhitelistedSite() { return true; }

  async init() {
    console.log('开始初始化话术扩展...');

    // 先加载数据
    try {
      await this.loadData();
      console.log('数据加载完成:', {
        scriptsCount: this.scripts?.length || 0,
        groupsCount: this.groups?.length || 0,
        settings: this.settings
      });
    } catch (error) {
      console.error('数据加载失败:', error);
      return;
    }

    // 白名单检查已移除，直接初始化UI

    try {
      // 获取版本号
      this.version = await this.getVersion();
      console.log('版本号获取完成:', this.version);

      // 使用统一的模块加载器初始化所有模块
      this.initAllModules();
      console.log('模块加载完成');

      this.initDragPositionManager(); // 初始化拖拽位置管理模块
      console.log('拖拽位置管理器初始化完成');

      this.createWidget();
      console.log('组件创建完成');

      this.initPreviewModule();
      console.log('预览模块初始化完成');

      // this.createFocusDebugPanel();
      this.bindEvents();
      console.log('事件绑定完成');

      // 处理启动时的同步任务
      this.storageService.processSyncQueue();
      // 设置周期性同步 (10分钟)
      setInterval(() => this.handleSync(), 10 * 60 * 1000);

      this.initialized = true; // 标记为已初始化
      console.log('话术扩展初始化成功');
    } catch (error) {
      console.error('初始化过程中出错:', error);
      // 尝试清理部分初始化的资源
      this.cleanup();

      // 显示错误提示
      this.showInitErrorNotice(error);
    }
  }

  async handleSync(manual = false) {
    try {
      // Check if remote is ready (has password/token)
      const isReady = await this.storageService.remote.isReady();

      if (!isReady) {
        if (manual) {
          const password = prompt('请输入同步密码 (任意字符，用于多设备同步):');
          if (password) {
            await this.storageService.local.setSyncPassword(password);
            this.showSuccessMessage('同步密码已设置');
          } else {
            return; // User cancelled
          }
        } else {
          // Auto-sync silently fails if not ready
          return;
        }
      }

      const data = await this.storageService.syncPull();
      this.scripts = this.validateScripts(data.scripts) || this.getDefaultScripts();
      this.groups = this.validateGroups(data.groups) || this.getDefaultGroups();

      if (this.uiRenderer) {
        this.uiRenderer.refreshUI();
      } else {
        this.renderGroups();
        this.renderScripts();
      }

      this.storageService.processSyncQueue();

      if (manual) {
        this.showSuccessMessage('同步完成');
      }
    } catch (error) {
      console.error('Sync failed', error);
      if (manual) {
        this.showSuccessMessage('同步失败: ' + error.message);
      }
    }
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
      const d = await this.storageService.load();
      this.scripts = this.validateScripts(d.scripts) || this.getDefaultScripts();
      this.groups = this.validateGroups(d.groups) || this.getDefaultGroups();
      this.migrateScriptData();
    } catch (error) {
      this.resetToDefaultData();
    }
  }

  // 重置为默认数据
  resetToDefaultData() {
    console.log('重置为默认数据');
    this.scripts = this.getDefaultScripts();
    this.groups = this.getDefaultGroups();
  }

  // 验证脚本数据
  validateScripts(scripts) {
    if (!Array.isArray(scripts)) {
      console.warn('scripts数据不是数组，将使用默认值');
      return null;
    }
    return scripts;
  }

  // 验证分组数据
  validateGroups(groups) {
    if (!Array.isArray(groups)) {
      console.warn('groups数据不是数组，将使用默认值');
      return null;
    }
    return groups;
  }

  // 白名单与相关设置校验已移除

  // 清理部分初始化的资源
  cleanup() {
    try {
      if (this.widget && this.widget.parentNode) {
        this.widget.parentNode.removeChild(this.widget);
        console.log('清理了widget组件');
      }

      // 清理其他可能创建的DOM元素
      const existingElements = document.querySelectorAll('[id^="chat-list-"]');
      existingElements.forEach(el => {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      });

      this.initialized = false;
      console.log('清理完成');
    } catch (error) {
      console.error('清理过程中出错:', error);
    }
  }

  // 显示初始化错误提示
  showInitErrorNotice(error) {
    console.log('显示初始化错误提示:', error.message);

    // 创建错误提示元素
    const notice = document.createElement('div');
    notice.id = 'chat-list-init-error-notice';
    notice.className = 'chatlist-error-notice';
    notice.innerHTML = `
      <div class="title">话术助手初始化失败</div>
      <div class="desc">点击此处尝试重新加载</div>
    `;

    // 点击重新加载
    notice.addEventListener('click', () => {
      location.reload();
    });

    document.body.appendChild(notice);

    // 5秒后自动消失
    setTimeout(() => {
      if (notice.parentNode) {
        notice.parentNode.removeChild(notice);
      }
    }, 5000);
  }

  // 数据迁移：为现有话术添加使用次数字段
  migrateScriptData() {
    let needsSave = false;

    this.scripts = this.scripts.map(script => {
      if (script.usageCount === undefined) {
        needsSave = true;
        return { ...script, usageCount: 0 };
      }
      return script;
    });

    // 如果有数据需要迁移，保存到存储
    if (needsSave) {
      console.log('正在迁移话术数据，添加使用次数字段...');
      this.saveData().then(() => {
        console.log('话术数据迁移完成');
      }).catch(error => {
        console.error('话术数据迁移失败:', error);
      });
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
      { id: '1', title: '欢迎语', note: '标准问候语', content: '您好，很高兴为您服务！有什么可以帮助您的吗？', groupId: 'greeting', usageCount: 0 },
      { id: '2', title: '产品介绍', note: '突出产品优势', content: '我们的产品具有以下特点：高质量、高性价比、优质服务。', groupId: 'service', usageCount: 0 },
      { id: '3', title: '感谢语', note: '礼貌结束对话', content: '感谢您的咨询，祝您生活愉快！', groupId: 'closing', usageCount: 0 }
    ];
  }

  // 默认白名单已移除

  // 初始化所有模块 - 使用通用模块加载器简化代码
  initAllModules() {
    // 创建模块加载器
    this.moduleLoader = new ModuleLoader(this);

    // 定义所有需要加载的模块
    const moduleConfigs = [
      { name: '数据导入导出', className: 'DataImportExport', property: 'dataImportExport' },
      { name: '话术管理', className: 'ScriptManagement', property: 'scriptManagement' },
      { name: '分组管理', className: 'GroupManagement', property: 'groupManagement' },
      { name: '模态框管理', className: 'ModalManagement', property: 'modalManagement' },
      { name: '分组面板管理', className: 'GroupPanelManagement', property: 'groupPanelManagement' },
      { name: 'UI渲染器', className: 'UIRenderer', property: 'uiRenderer' }
    ];

    // 批量加载模块
    this.moduleLoader.loadModules(moduleConfigs);
  }

  // 临时的拖拽位置管理初始化方法（避免未定义方法调用错误）
  initDragPositionManager() {
    // 继续使用内置拖拽功能
  }

  async refreshScripts() {
    try {
      // 显示刷新提示
      this.showSuccessMessage('正在刷新话术数据...');

      // 重置选中状态
      this.selectedScriptIndex = -1;

      // 执行同步
      await this.handleSync();

      // 确保清除选中状态和预览
      this.updateScriptSelection();

      // 显示成功提示
      this.showSuccessMessage('话术数据已刷新');
    } catch (error) {
      console.error('刷新话术失败:', error);
      this.showSuccessMessage('刷新失败，请重试');
    }
  }

  createWidget() {
    // 使用UI渲染器创建界面
    if (this.uiRenderer) {
      this.widget = this.uiRenderer.createWidget();
      this.uiRenderer.createTrigger();
      this.uiRenderer.renderGroups();
      this.uiRenderer.renderScripts();
      this.addScriptButton = this.widget.querySelector('.cls-btn-add-script');

      // 初始状态：隐藏浮层，显示触发器
      this.hideWidget();

      // 加载保存的位置
      setTimeout(() => {
        this.loadPosition();
      }, 100);
    } else {
      console.error('UI渲染器未初始化');
    }
  }

  initPreviewModule() {
    // 使用UI渲染器初始化预览模块
    if (this.uiRenderer) {
      this.uiRenderer.initPreviewModule();
    } else {
      console.error('UI渲染器未初始化');
    }
  }

  // UI渲染辅助方法
  renderGroups() {
    if (this.uiRenderer) {
      this.uiRenderer.renderGroups();
    } else {
      console.error('UI渲染器未初始化');
    }
  }

  renderScripts() {
    if (this.uiRenderer) {
      this.uiRenderer.renderScripts();
    } else {
      console.error('UI渲染器未初始化');
    }
  }

  updateScriptSelection() {
    if (this.uiRenderer) {
      this.uiRenderer.updateScriptSelection();
    } else {
      console.error('UI渲染器未初始化');
    }
  }

  bindEvents() {
    // 监听全局点击事件，记住最后点击的输入元素
    document.addEventListener('click', (e) => {
      if (this.inputManager.isValidInput(e.target)) {
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
      if (this.inputManager.isValidInput(e.target)) {
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
      if (this.inputManager.isValidInput(e.target)) {
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

    // 防止浮层点击时失去页面输入框焦点，但保留列表/可滚区域的原生滚动
    this.widget.addEventListener('mousedown', (e) => {
      // 允许搜索区域的默认交互
      if (
        ChatListUtils.matches(e.target, '.search-input, .cls-btn-clear-search') ||
        ChatListUtils.closest(e.target, '.search-container')
      ) {
        return;
      }

      // 允许在以下可滚动/互动区域的默认行为：
      // - 话术列表（包括滚动条拖动）
      // - 管理面板内容区
      // - 模态框内容区
      // - 分组标签区域
      // - 更多菜单和各类按钮
      if (
        ChatListUtils.closest(e.target, '.script-list') ||
        ChatListUtils.closest(e.target, '.manage-content') ||
        ChatListUtils.closest(e.target, '.cls-modal-content') ||
        ChatListUtils.closest(e.target, '.group-tabs') ||
        ChatListUtils.closest(e.target, '.cls-more-menu') ||
        ChatListUtils.closest(e.target, '.cls-btn')
      ) {
        return; // 保留原生交互，避免阻断滚动条拖动
      }

      // 其他区域不改变页面输入框焦点
      e.preventDefault();
    });

    // 让话术列表在保持页面输入框焦点时也能滚动
    const scriptListEl = this.widget.querySelector('.script-list');
    if (scriptListEl) {
      // 鼠标滚轮/触控板
      const DOM_DELTA_LINE = 1;
      const DOM_DELTA_PAGE = 2;
      const APPROX_LINE_HEIGHT = 16;

      scriptListEl.addEventListener('wheel', (e) => {
        let deltaY = e.deltaY;

        if (e.deltaMode === DOM_DELTA_LINE) {
          deltaY *= APPROX_LINE_HEIGHT;
        } else if (e.deltaMode === DOM_DELTA_PAGE) {
          deltaY *= scriptListEl.clientHeight;
        }

        const scrollBefore = scriptListEl.scrollTop;
        scriptListEl.scrollTop += deltaY;

        if (scriptListEl.scrollTop !== scrollBefore) {
          e.preventDefault();
        }
      }, { passive: false });

      // 触摸滚动（移动端）
      let touchStartY = 0;
      scriptListEl.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches.length > 0) {
          touchStartY = e.touches[0].clientY;
        }
      }, { passive: true });
      scriptListEl.addEventListener('touchmove', (e) => {
        if (e.touches && e.touches.length > 0) {
          const currentY = e.touches[0].clientY;
          const deltaY = touchStartY - currentY;
          scriptListEl.scrollTop += deltaY;
          touchStartY = currentY;
          e.preventDefault();
        }
      }, { passive: false });
    }

    // 全局快捷键监听 - ⌘+g 启动搜索, ESC 分层关闭
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
        if (currentFocus && this.inputManager.isValidInput(currentFocus) && !ChatListUtils.closest(currentFocus, '#chat-list-widget')) {
          this.lastFocusedElement = currentFocus;
          this.addToFocusHistory(currentFocus);

          // 立即更新调试面板
          // this.updateDebugPanel();
        }

        // 只打开面板并聚焦搜索框，不再用于关闭面板
        if (!this.isVisible) {
          // 面板未显示，显示它并聚焦搜索框
          this.openedByShortcut = true; // 标记为通过快捷键打开
          this.showWidget();
        }

        // 无论面板是否已显示，都聚焦到搜索输入框
        const searchInput = this.widget.querySelector('.search-input');
        if (searchInput) {
          searchInput.focus();
          searchInput.select(); // 选中现有文本，方便用户直接输入新的搜索词
        }
      }

      // ESC 键分层关闭：第一次关闭预览，第二次关闭面板
      if (e.key === 'Escape' && this.isVisible) {
        // 如果不是在插件内部的输入框，处理 ESC
        const currentFocus = document.activeElement;
        const isInWidget = currentFocus && ChatListUtils.closest(currentFocus, '#chat-list-widget');

        if (!isInWidget) {
          e.preventDefault();

          // 检查是否有预览在显示
          const hasActivePreview = this.previewModule && this.previewModule.previewElement &&
            this.previewModule.previewElement.style.display !== 'none';

          if (hasActivePreview) {
            // 第一次 ESC：关闭预览
            this.previewModule.forceHidePreview();
            this.selectedScriptIndex = -1;
            this.updateScriptSelection();
          } else {
            // 第二次 ESC：关闭面板
            this.hideWidget();
          }
        }
      }
    }, true); // 使用事件捕获阶段，确保优先处理



    // 关闭按钮事件
    this.widget.querySelector('.cls-btn-close').addEventListener('click', () => {
      this.hideWidget();
    });



    // 触发器点击事件
    this.trigger.addEventListener('click', () => {
      this.openedByShortcut = false; // 标记为通过点击打开
      this.showWidget();
    });

    // 管理面板
    this.widget.querySelector('.cls-btn-manage').addEventListener('click', () => {
      try {
        this.showManagePanel();
      } catch (error) {
        console.error('点击管理按钮时出错:', error);
      }
    });

    this.widget.querySelector('.cls-btn-close-manage').addEventListener('click', () => {
      this.hideManagePanel();
    });

    // 搜索功能
    const searchInput = this.widget.querySelector('.search-input');
    const clearSearchBtn = this.widget.querySelector('.cls-btn-clear-search');

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

      switch (e.key) {
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
              // 使用setTimeout确保blur操作完成后再填充内容并隐藏面板
              setTimeout(() => {
                this.fillContent(script.content, scriptId);
                // 填充内容后自动隐藏面板
                this.hideWidget();
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
      this.updateScriptSelection(); // 确保清除选中状态和预览
      clearSearchBtn.classList.remove('visible');
      searchInput.focus();
    });

    // 分组切换
    this.widget.querySelector('.group-tabs').addEventListener('click', (e) => {
      if (e.target.classList.contains('group-tab')) {
        const groupId = e.target.dataset.group;
        this.currentGroup = groupId === 'all' ? null : groupId;
        this.selectedScriptIndex = -1; // 重置选中索引
        this.renderGroups();
        this.renderScripts();
        this.updateScriptSelection(); // 确保清除选中状态和预览
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
          this.fillContent(script.content, scriptId);
          // 只有通过快捷键打开的面板才在填充内容后自动隐藏
          if (this.openedByShortcut) {
            this.hideWidget();
          }
        }
      }
    });

    // 编辑和删除按钮
    this.widget.querySelector('.script-list').addEventListener('click', (e) => {
      const editBtn = ChatListUtils.closest(e.target, '.cls-btn-edit');
      const deleteBtn = ChatListUtils.closest(e.target, '.cls-btn-delete');
      const submitBtn = ChatListUtils.closest(e.target, '.cls-btn-submit');
      if (editBtn) {
        const scriptId = editBtn.dataset.id;
        this.editScript(scriptId);
      } else if (deleteBtn) {
        const scriptId = deleteBtn.dataset.id;
        this.deleteScript(scriptId);
      } else if (submitBtn) {
        const scriptId = submitBtn.dataset.id;
        this.submitScriptToPublic(scriptId);
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
      // 延迟300ms隐藏，如果鼠标进入预览浮层则取消隐藏
      this.previewModule.hidePreviewTimeout = setTimeout(() => {
        this.previewModule.forceHidePreview();
      }, 100);
    });

    // 移除话术项的mouseleave事件，避免与主面板的延迟隐藏逻辑冲突

    // 预览浮层事件已在预览模块中处理

    // 添加话术
    const addScriptBtn = this.addScriptButton || this.widget.querySelector('.cls-btn-add-script');

    if (addScriptBtn) {
      addScriptBtn.addEventListener('click', () => {
        try {
          this.showAddScriptModal();
        } catch (error) {
          console.error('添加话术按钮点击处理出错:', error);
        }
      });
    } else {
      console.error('找不到添加话术按钮 .cls-btn-add-script');
    }

    // 头部“更多”菜单交互
    const moreBtn = this.widget.querySelector('.cls-btn-more');
    const moreMenu = this.widget.querySelector('.cls-more-menu');
    if (moreBtn && moreMenu) {
      const closeMenu = (e) => {
        if (!moreMenu) return;
        if (!e || !moreMenu.contains(e.target) && e.target !== moreBtn) {
          moreMenu.style.display = 'none';
          document.removeEventListener('click', closeMenu, true);
          document.removeEventListener('keydown', onEsc, true);
        }
      };
      const onEsc = (e) => { if (e.key === 'Escape') closeMenu(); };
      moreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        moreMenu.style.display = moreMenu.style.display === 'none' ? 'block' : 'none';
        if (moreMenu.style.display === 'block') {
          document.addEventListener('click', closeMenu, true);
          document.addEventListener('keydown', onEsc, true);
        }
      });
      // 菜单项
      moreMenu.querySelector('.cls-menu-manage')?.addEventListener('click', () => {
        moreMenu.style.display = 'none';
        this.showManagePanel();
      });
      moreMenu.querySelector('.cls-menu-import')?.addEventListener('click', () => {
        moreMenu.style.display = 'none';
        this.showImportDialog();
      });
      moreMenu.querySelector('.cls-menu-export')?.addEventListener('click', () => {
        moreMenu.style.display = 'none';
        this.exportData();
      });
      if (this.remoteEnabled) {
        moreMenu.querySelector('.cls-menu-refresh-public')?.addEventListener('click', async () => {
          moreMenu.style.display = 'none';
          this.showSuccessMessage('正在刷新公共库...');
          try {
            await this.loadData(); // 重新加载并渲染
            this.showSuccessMessage('刷新成功');
          } catch (error) {
            console.error(error);
            this.showSuccessMessage('刷新失败');
          }
        });
        moreMenu.querySelector('.cls-menu-admin')?.addEventListener('click', () => {
          moreMenu.style.display = 'none';
          if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage();
          } else {
            const url = chrome.runtime.getURL('admin.html');
            window.open(url, '_blank');
          }
        });
        moreMenu.querySelector('.cls-menu-sync')?.addEventListener('click', () => {
          moreMenu.style.display = 'none';
          this.handleSync(true);
        });

        moreMenu.querySelector('.cls-menu-test')?.addEventListener('click', async () => {
          moreMenu.style.display = 'none';
          const r = await this.storageService.testConnection();
          if (r.ok) {
            this.showSuccessMessage('连接成功');
          } else if (r.error === 'not_configured') {
            this.showSuccessMessage('未配置 Supabase');
          } else if (r.error === 'client_not_initialized') {
            this.showSuccessMessage('客户端未初始化');
          } else {
            this.showSuccessMessage('连接失败: ' + r.error);
          }
        });
        moreMenu.querySelector('.cls-menu-publish-public')?.addEventListener('click', async () => {
          moreMenu.style.display = 'none';
          await this.publishSelectedToPublic();
        });
        moreMenu.querySelector('.cls-menu-publish-all')?.addEventListener('click', async () => {
          moreMenu.style.display = 'none';
          await this.publishAllToPublicFromLocal();
        });
        moreMenu.querySelector('.cls-menu-login')?.addEventListener('click', async () => {
          moreMenu.style.display = 'none';
          await this.loginSharedAccount();
        });
      }
      moreMenu.querySelector('.cls-menu-filter-all')?.addEventListener('click', () => {
        moreMenu.style.display = 'none';
        this.currentSourceFilter = 'all';
        this.renderScripts();
      });
      if (this.remoteEnabled) {
        moreMenu.querySelector('.cls-menu-filter-public')?.addEventListener('click', () => {
          moreMenu.style.display = 'none';
          this.currentSourceFilter = 'public';
          this.renderScripts();
        });
      }
      moreMenu.querySelector('.cls-menu-filter-private')?.addEventListener('click', () => {
        moreMenu.style.display = 'none';
        this.currentSourceFilter = 'private';
        this.renderScripts();
      });
    }

    // 保存话术
    this.widget.querySelector('.cls-btn-save-script').addEventListener('click', () => {
      this.saveScript();
    });

    // 取消编辑
    this.widget.querySelector('.cls-btn-cancel-edit').addEventListener('click', () => {
      this.clearScriptForm();
    });

    // 导入话术
    this.widget.querySelector('.cls-btn-import-data').addEventListener('click', () => {
      this.showImportDialog();
    });

    // 分组管理事件由GroupManagement模块处理
    if (this.groupManagement) {
      this.groupManagement.bindEvents();
    }

    // 添加拖拽功能
    this.initDragFunctionality();
  }

  toggleWidget() {
    if (this.modalManagement) {
      this.modalManagement.toggleWidget();
    } else {
      const content = this.widget.querySelector('.widget-content');
      this.isVisible = !this.isVisible;
      content.style.display = this.isVisible ? 'block' : 'none';
    }
  }

  hideWidget() {
    // 先强制隐藏预览浮层
    if (this.previewModule) {
      this.previewModule.forceHidePreview();
    }

    // 使用setTimeout确保预览图层完全隐藏后再隐藏主面板
    setTimeout(() => {
      // 重置打开方式标记
      this.openedByShortcut = false;

      if (this.modalManagement) {
        this.modalManagement.hideWidget();
      } else {
        this.widget.style.display = 'none';
        this.trigger.style.display = 'block'; // 显示触发器
        this.isVisible = false;
      }
    }, 10);
  }

  showWidget() {
    this.handleSync(); // 同步数据
    if (this.modalManagement) {
      this.modalManagement.showWidget();
    } else {
      this.widget.style.display = 'block';
      this.trigger.style.display = 'none'; // 隐藏触发器
      this.isVisible = true;
      // 确保内容区域也是显示的
      const content = this.widget.querySelector('.widget-content');
      content.style.display = 'block';
    }
  }

  showManagePanel() {
    if (this.groupPanelManagement && typeof this.groupPanelManagement.showManagePanel === 'function') {
      this.groupPanelManagement.showManagePanel();
    } else {
      try {
        // 确保插件是可见的
        if (!this.isVisible) {
          this.showWidget();
        }

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

      } catch (error) {
        console.error('显示管理面板时出错:', error);
      }
    }
  }

  // 新增话术模态框相关方法
  showAddScriptModal() {
    if (this.modalManagement) {
      this.modalManagement.showAddScriptModal();
    } else {
      console.error('模态框管理模块未初始化，无法显示添加话术模态框');
      // 提供备用方案
      alert('模态框管理模块未初始化，请刷新页面重试');
    }
  }

  hideAddScriptModal() {
    if (this.modalManagement) {
      this.modalManagement.hideAddScriptModal();
    } else {
      console.error('模态框管理模块未初始化，无法隐藏添加话术模态框');
    }
  }

  populateGroupOptions() {
    if (this.modalManagement) {
      this.modalManagement.populateGroupOptions();
    } else {
      console.error('模态框管理模块未初始化，无法填充分组选项');
    }
  }

  bindModalEvents() {
    if (this.modalManagement) {
      this.modalManagement.bindModalEvents();
    } else {
      console.error('模态框管理模块未初始化，无法绑定模态框事件');
    }
  }

  validateModalForm() {
    if (this.modalManagement) {
      return this.modalManagement.validateModalForm();
    } else {
      console.error('模态框管理模块未初始化，无法验证表单');
      return false;
    }
  }

  saveNewScript() {
    if (this.modalManagement) {
      this.modalManagement.saveNewScript();
    } else {
      console.error('模态框管理模块未初始化，无法保存新话术');
    }
  }

  hideManagePanel() {
    if (this.groupPanelManagement && typeof this.groupPanelManagement.hideManagePanel === 'function') {
      this.groupPanelManagement.hideManagePanel();
    } else {
      this.widget.querySelector('.manage-panel').style.display = 'none';
      this.widget.querySelector('.widget-content').style.display = 'block';
      this.clearScriptForm();
    }
  }

  fillContent(content, scriptId = null) {
    // 复制到剪贴板
    this.copyToClipboard(content);

    // 使用新的InputManager进行智能填充
    const success = this.inputManager.fillContent(content, {
      lastFocusedElement: this.lastFocusedElement,
      getValidFocusFromHistory: () => this.getValidFocusFromHistory()
    });

    // 如果填充成功且提供了scriptId，增加使用次数
    if (success && scriptId) {
      this.incrementScriptUsage(scriptId);
    }

    if (!success) {
      alert('未找到可填充的输入框，请先点击输入框');
    }
  }

  // 增加话术使用次数
  incrementScriptUsage(scriptId) {
    const script = this.scripts.find(s => s.id === scriptId);
    if (script) {
      script.usageCount = (script.usageCount || 0) + 1;

      // 保存数据
      this.saveData().then(() => {
        console.log(`话术 "${script.title}" 使用次数已更新为 ${script.usageCount}`);

        // 如果当前按使用次数排序，重新渲染列表
        if (this.currentSortBy === 'usage') {
          this.renderScripts();
        }
      }).catch(() => { });
    }
  }

  // 获取排序后的话术列表
  getSortedScripts() {
    let filteredScripts = this.scripts;

    // 按分组筛选
    if (this.currentGroup) {
      filteredScripts = this.scripts.filter(script => script.groupId === this.currentGroup);
    }

    if (this.currentSourceFilter === 'public') {
      filteredScripts = filteredScripts.filter(s => s.__source === 'public');
    } else if (this.currentSourceFilter === 'private') {
      filteredScripts = filteredScripts.filter(s => s.__source === 'private');
    }
    // 按搜索关键词筛选（支持空格分隔的多关键词 AND 匹配）
    if (this.searchKeyword) {
      // 支持普通空格和全角空格分词
      const keywords = this.searchKeyword
        .split(/[\s\u3000]+/)
        .map(k => k.trim().toLowerCase())
        .filter(Boolean);

      if (keywords.length > 0) {
        filteredScripts = filteredScripts.filter(script => {
          const title = (script.title || '').toLowerCase();
          const content = (script.content || '').toLowerCase();
          const note = (script.note || '').toLowerCase();

          // 每个关键词都需要在任一字段中命中（AND 语义）
          return keywords.every(kw =>
            title.includes(kw) ||
            content.includes(kw) ||
            note.includes(kw)
          );
        });
      }
    }

    // 排序
    if (this.currentSortBy === 'usage') {
      // 按使用次数降序排列
      filteredScripts = [...filteredScripts].sort((a, b) => {
        const aUsage = a.usageCount || 0;
        const bUsage = b.usageCount || 0;
        return bUsage - aUsage;
      });
    }
    // 默认排序保持原有顺序

    return filteredScripts;
  }



  editScript(scriptId) {
    if (this.scriptManagement) {
      this.scriptManagement.editScript(scriptId);
    } else {
      console.error('ScriptManagement 模块未初始化');
    }
  }

  deleteScript(scriptId) {
    if (this.scriptManagement) {
      this.scriptManagement.deleteScript(scriptId);
    } else {
      console.error('ScriptManagement 模块未初始化');
    }
  }

  saveScript() {
    if (this.scriptManagement) {
      this.scriptManagement.saveScript();
    } else {
      console.error('ScriptManagement 模块未初始化');
    }
  }

  clearScriptForm() {
    if (this.scriptManagement) {
      this.scriptManagement.clearScriptForm();
    } else {
      console.error('ScriptManagement 模块未初始化');
    }
  }

  addGroup() {
    if (this.groupManagement) {
      this.groupManagement.addGroup();
    } else {
      console.error('GroupManagement 模块未初始化');
    }
  }

  editGroup(groupId) {
    if (this.groupManagement) {
      this.groupManagement.editGroup(groupId);
    } else {
      console.error('GroupManagement 模块未初始化');
    }
  }

  deleteGroup(groupId) {
    if (this.groupManagement) {
      this.groupManagement.deleteGroup(groupId);
    } else {
      console.error('GroupManagement 模块未初始化');
    }
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
    if (this.dataImportExport) {
      this.dataImportExport.showImportDialog();
    } else {
      console.error('数据导入导出模块未初始化');
    }
  }

  async importData(file) {
    if (this.dataImportExport) {
      await this.dataImportExport.importData(file);
    } else {
      console.error('数据导入导出模块未初始化');
    }
  }

  exportData() {
    if (this.dataImportExport) {
      this.dataImportExport.exportData();
    } else {
      console.error('数据导入导出模块未初始化');
    }
  }

  async saveData() {
    await this.storageService.save(this.scripts, this.groups);
  }

  // 复制内容到剪贴板
  async copyToClipboard(text) {
    return ChatListUtils.copyToClipboard(text);
  }

  // 显示自定义确认对话框
  showConfirmDialog(title, message, onConfirm, onCancel = null) {
    return ChatListUtils.showConfirmDialog(title, message, onConfirm, onCancel);
  }

  /**
   * 显示编辑话术模态框
   * @param {Object} script 要编辑的话术对象
   */
  showEditScriptModal(script) {
    // 统一使用scriptManagement模块的editScript方法
    if (this.scriptManagement && script && script.id) {
      this.scriptManagement.editScript(script.id);
    } else if (this.modalManagement) {
      // 备用方案：直接使用modalManagement模块
      this.modalManagement.showEditScriptModal(script);
    } else {
      console.error('模态框管理模块未加载，无法显示编辑话术模态框');
      alert('无法显示编辑话术模态框，请刷新页面重试');
    }
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
  } else if (message.type === 'SETTINGS_UPDATED') {
    // 设置更新（白名单逻辑已移除，这里仅保留占位以兼容消息）
    if (window.chatListWidget) {
      window.chatListWidget.settings = { ...message.settings };
      sendResponse({ success: true });
    }
  }
});

// 防止重复初始化
if (window.chatListWidget) {
  console.log('话术助手已经初始化，跳过重复初始化');
} else {
  console.log('开始初始化话术助手...');

  // 初始化插件
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (!window.chatListWidget) {
        window.chatListWidget = new ChatListWidget();
      }
    });
  } else {
    window.chatListWidget = new ChatListWidget();

    // 初始化自适应高度功能
    if (window.TextareaUtils) {
      window.TextareaUtils.initAutoResizeTextareas();
    } else {
      // 兼容性处理：如果模块未加载，使用全局函数
      if (typeof initAutoResizeTextareas === 'function') {
        initAutoResizeTextareas();
      }
    }
  }
}
