/**
 * 模态框管理模块
 * 负责管理面板、添加话术模态框等UI组件的显示和隐藏
 */
class ModalManagement {
  constructor(chatListWidget) {
    this.widget = chatListWidget;
  }

  /**
   * 显示管理面板
   */
  showManagePanel() {
    try {
      console.log('开始显示管理面板');
      
      // 创建管理面板HTML
      const managePanelHTML = this._createManagePanelHTML();
      
      // 移除已存在的管理面板
      const existingPanel = document.getElementById('managePanelModal');
      if (existingPanel) {
        existingPanel.remove();
      }
      
      // 添加管理面板到页面
      document.body.insertAdjacentHTML('beforeend', managePanelHTML);
      
      // 渲染分组列表
      this.renderGroupList();
      
      // 绑定事件
      this._bindManagePanelEvents();
      
      // 显示管理面板
      const modal = document.getElementById('managePanelModal');
      modal.style.display = 'flex';
      
      console.log('管理面板显示成功');
      
    } catch (error) {
      console.error('显示管理面板时出错:', error);
      console.error('错误堆栈:', error.stack);
    }
  }

  /**
   * 渲染分组列表
   */
  renderGroupList() {
    try {
      const groupListElement = document.querySelector('.group-list');
      if (!groupListElement) {
        console.error('找不到分组列表元素 .group-list');
        return;
      }
      
      // 构建分组列表HTML
      let groupListHTML = '';
      
      // 添加未分组项
      const ungroupedCount = this.widget.groupManagement ? 
        this.widget.groupManagement.getUngroupedScriptCount() : 
        this.widget.scripts.filter(script => !script.groupId).length;
        
      groupListHTML += `
        <div class="group-item">
          <div class="group-color" style="background-color: #CCCCCC;"></div>
          <div class="group-name">无分组</div>
          <div class="group-count">(${ungroupedCount})</div>
        </div>
      `;
      
      // 添加其他分组
      this.widget.groups.forEach(group => {
        const scriptCount = this.widget.groupManagement ? 
          this.widget.groupManagement.getScriptCountByGroup(group.id) : 
          this.widget.scripts.filter(script => script.groupId === group.id).length;
          
        groupListHTML += `
          <div class="group-item">
            <div class="group-color" style="background-color: ${group.color};"></div>
            <div class="group-name">${group.name}</div>
            <div class="group-count">(${scriptCount})</div>
            <div class="group-actions">
              <button class="cls-btn-edit-group" data-id="${group.id}">编辑</button>
              <button class="cls-btn-delete-group" data-id="${group.id}">删除</button>
            </div>
          </div>
        `;
      });
      
      // 更新DOM
      groupListElement.innerHTML = groupListHTML;
      
      // 更新话术编辑表单中的分组选择器
      this.updateScriptForm();
      
      console.log('分组列表渲染成功');
    } catch (error) {
      console.error('渲染分组列表时出错:', error);
      console.error('错误堆栈:', error.stack);
    }
  }

  /**
   * 隐藏管理面板
   */
  hideManagePanel() {
    try {
      const modal = document.getElementById('managePanelModal');
      if (modal) {
        modal.remove();
      }
      
      // 清除表单
      this.widget.clearScriptForm();
      
      console.log('管理面板已隐藏');
    } catch (error) {
      console.error('隐藏管理面板时出错:', error);
      console.error('错误堆栈:', error.stack);
    }
  }

  /**
   * 切换插件显示状态
   */
  toggleWidget() {
    try {
      const widgetElement = document.getElementById('chat-list-widget');
      if (!widgetElement) {
        console.error('找不到插件主元素 #chat-list-widget');
        return;
      }
      
      const content = widgetElement.querySelector('.widget-content');
      if (!content) {
        console.error('找不到内容区域元素 .widget-content');
        return;
      }
      
      this.widget.isVisible = !this.widget.isVisible;
      content.style.display = this.widget.isVisible ? 'block' : 'none';
      
      console.log('切换插件显示状态:', this.widget.isVisible ? '显示' : '隐藏');
    } catch (error) {
      console.error('切换插件显示状态时出错:', error);
      console.error('错误堆栈:', error.stack);
    }
  }

  /**
   * 隐藏插件
   */
  hideWidget() {
    try {
      const widgetElement = document.getElementById('chat-list-widget');
      const trigger = document.getElementById('chat-widget-trigger');
      
      if (!widgetElement) {
        console.error('找不到插件主元素 #chat-list-widget');
        return;
      }
      
      if (!trigger) {
        console.error('找不到触发器元素 #chat-widget-trigger');
        return;
      }
      
      widgetElement.style.display = 'none';
      trigger.style.display = 'block'; // 显示触发器
      this.widget.isVisible = false;
      
      console.log('插件已隐藏');
    } catch (error) {
      console.error('隐藏插件时出错:', error);
      console.error('错误堆栈:', error.stack);
    }
  }

  /**
   * 显示插件
   */
  showWidget() {
    try {
      const widgetElement = document.getElementById('chat-list-widget');
      const trigger = document.getElementById('chat-widget-trigger');
      
      if (!widgetElement) {
        console.error('找不到插件主元素 #chat-list-widget');
        return;
      }
      
      if (!trigger) {
        console.error('找不到触发器元素 #chat-widget-trigger');
        return;
      }
      
      widgetElement.style.display = 'block';
      trigger.style.display = 'none'; // 隐藏触发器
      this.widget.isVisible = true;
      
      // 确保内容区域也是显示的
      const content = widgetElement.querySelector('.widget-content');
      if (content) {
        content.style.display = 'block';
      }
      
      console.log('插件已显示');
    } catch (error) {
      console.error('显示插件时出错:', error);
      console.error('错误堆栈:', error.stack);
    }
  }

  /**
   * 显示添加话术模态框
   */
  showAddScriptModal() {
    console.log('显示添加话术模态框');
    
    // 创建模态框HTML
    const modalHTML = this._createAddScriptModalHTML();
    
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

  /**
   * 隐藏添加话术模态框
   */
  hideAddScriptModal() {
    console.log('隐藏添加话术模态框');
    const modal = document.getElementById('addScriptModal');
    if (modal) {
      modal.remove();
    }
  }

  /**
   * 创建添加话术模态框的HTML
   * @private
   * @returns {string} 模态框HTML
   */
  _createAddScriptModalHTML() {
    return `
        <div class="cls-modal-overlay" id="addScriptModal">
            <div class="cls-modal-content">
                <div class="cls-modal-header">
                    <h3 class="cls-modal-title">添加新话术</h3>
                    <button class="cls-btn-close-modal"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 16.5C13.1421 16.5 16.5 13.1421 16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5Z" stroke="white" stroke-width="1.5" stroke-linejoin="round"/><path d="M11.1211 6.87891L6.87842 11.1215" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.87891 6.87891L11.1215 11.1215" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
                </div>
                <div class="cls-modal-body">
                    <form id="addScriptForm">
                        <div class="cls-form-group">
                            <label class="cls-form-label" for="modalScriptTitle">话术标题 *</label>
                            <input type="text" id="modalScriptTitle" class="cls-form-control" placeholder="请输入话术标题" required>
                            <div id="titleError" class="cls-error-message" style="display: none;"></div>
                        </div>
                        
                        <div class="cls-form-group">
                            <label class="cls-form-label">所属分组</label>
                            <div class="group-tabs" id="modalGroupTabs">
                                <div class="group-tab active" data-group="">无分组</div>
                            </div>
                            <input type="hidden" id="modalScriptGroup" value="">
                        </div>
                        
                        <div class="cls-form-group">
                            <label class="cls-form-label" for="modalScriptContent">话术内容 *</label>
                            <textarea id="modalScriptContent" class="cls-form-control textarea" placeholder="请输入话术内容" required></textarea>
                            <div id="contentError" class="cls-error-message" style="display: none;"></div>
                        </div>
                    </form>
                    
                    <div class="cls-form-actions">
                        <button type="button" class="cls-btn cls-btn-secondary cls-btn-cancel-modal">取消</button>
                        <button type="button" class="cls-btn cls-btn-primary cls-btn-save-modal">保存话术</button>
                    </div>
                </div>
            </div>
        </div>
    `;
  }

  /**
   * 填充分组选项
   */
  populateGroupOptions() {
    const groupTabs = document.getElementById('modalGroupTabs');
    const hiddenInput = document.getElementById('modalScriptGroup');
    if (!groupTabs || !hiddenInput) return;
    
    // 清除现有选项，保留"无分组"选项
    while (groupTabs.children.length > 1) {
      groupTabs.removeChild(groupTabs.lastChild);
    }
    
    // 重置"无分组"选项的激活状态
    groupTabs.firstElementChild.classList.remove('active');
    groupTabs.firstElementChild.classList.add('active');
    
    // 添加分组选项
    this.widget.groups.forEach(group => {
      const tab = document.createElement('div');
      tab.className = 'group-tab'; // 使用与主界面相同的class
      tab.dataset.group = group.id;
      tab.textContent = group.name;
      
      // 使用与主界面相同的样式：添加左侧颜色条
      if (group.color) {
        tab.style.borderLeft = `3px solid ${group.color}`;
      }
      
      groupTabs.appendChild(tab);
    });
    
    // 重置隐藏输入框的值为空（无分组）
    hiddenInput.value = '';
  }

  /**
   * 绑定模态框事件
   */
  bindModalEvents() {
    // 关闭按钮事件
    const closeBtn = document.querySelector('.cls-btn-close-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hideAddScriptModal());
    }
    
    // 取消按钮事件
    const cancelBtn = document.querySelector('.cls-btn-cancel-modal');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.hideAddScriptModal());
    }
    
    // 保存按钮事件
    const saveBtn = document.querySelector('.cls-btn-save-modal');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveNewScript());
    }
    
    // 点击遮罩层关闭
    const modal = document.getElementById('addScriptModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target.classList.contains('cls-modal-overlay')) {
          this.hideAddScriptModal();
        }
      });
    }
    
    // 绑定分组标签点击事件
    const groupTabs = document.getElementById('modalGroupTabs');
    if (groupTabs) {
      groupTabs.addEventListener('click', (e) => {
        if (e.target.classList.contains('group-tab')) {
          const hiddenInput = document.getElementById('modalScriptGroup');
          if (!hiddenInput) return;
          
          // 移除所有active类
          groupTabs.querySelectorAll('.group-tab').forEach(tab => {
            tab.classList.remove('active');
          });
          
          // 添加active类到当前点击的标签
          e.target.classList.add('active');
          
          // 更新隐藏输入框的值
          hiddenInput.value = e.target.dataset.group;
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
    
    this._bindValidationEvents();
  }

  /**
   * 绑定表单验证事件
   * @private
   */
  _bindValidationEvents() {
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

  /**
   * 验证模态框表单
   * @returns {boolean} 是否验证通过
   */
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

  /**
   * 保存新话术
   */
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
      this.widget.scripts.push(newScript);
      
      // 保存数据
      this.widget.saveData().then(() => {
        console.log('话术保存成功');
        this.widget.showSuccessMessage('话术添加成功！');
        this.widget.renderScripts();
        this.hideAddScriptModal();
        // 关闭预览浮层
        this.widget.previewModule.forceHidePreview();
      }).catch(error => {
        console.error('保存话术失败:', error);
        alert('保存失败，请重试');
      });
      
    } catch (error) {
      console.error('保存新话术时出错:', error);
      alert('保存失败，请重试');
    }
  }

  /**
   * 显示编辑话术模态框
   * @param {Object} script 要编辑的话术对象
   */
  showEditScriptModal(script) {
    console.log('显示编辑话术模态框', script);
    
    // 创建模态框HTML
    const modalHTML = this._createEditScriptModalHTML(script);
    
    // 移除已存在的模态框
    const existingModal = document.getElementById('editScriptModal');
    if (existingModal) {
      existingModal.remove();
    }
    
    // 添加模态框到页面
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // 填充分组选项
    this.populateEditGroupOptions(script.groupId);
    
    // 绑定事件
    this.bindEditModalEvents(script);
    
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
  
  /**
   * 创建编辑话术模态框HTML
   * @param {Object} script 话术对象
   * @private
   * @returns {string} 模态框HTML
   */
  _createEditScriptModalHTML(script) {
    return `
        <div class="cls-modal-overlay" id="editScriptModal">
            <div class="cls-modal-content">
                <div class="cls-modal-header">
                    <h3 class="cls-modal-title">编辑话术</h3>
                    <button class="cls-btn-close-modal"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 16.5C13.1421 16.5 16.5 13.1421 16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5Z" stroke="white" stroke-width="1.5" stroke-linejoin="round"/><path d="M11.1211 6.87891L6.87842 11.1215" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.87891 6.87891L11.1215 11.1215" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
                </div>
                <div class="cls-modal-body">
                    <form id="editScriptForm">
                        <input type="hidden" id="editModalScriptId" value="${script.id || ''}">
                        
                        <div class="cls-form-group">
                            <label class="cls-form-label" for="editModalScriptTitle">话术标题 *</label>
                            <input type="text" id="editModalScriptTitle" class="cls-form-control" value="${script.title || ''}" placeholder="请输入话术标题" required>
                            <div id="editTitleError" class="cls-error-message" style="display: none;"></div>
                        </div>
                        
                        <div class="cls-form-group">
                            <label class="cls-form-label">所属分组</label>
                            <div class="group-tabs" id="editModalGroupTabs">
                                <div class="group-tab" data-group="">无分组</div>
                            </div>
                            <input type="hidden" id="editModalScriptGroup" value="${script.groupId || ''}">
                        </div>
                        
                        <div class="cls-form-group">
                            <label class="cls-form-label" for="editModalScriptContent">话术内容 *</label>
                            <textarea id="editModalScriptContent" class="cls-form-control textarea" placeholder="请输入话术内容" required>${script.content || ''}</textarea>
                            <div id="editContentError" class="cls-error-message" style="display: none;"></div>
                        </div>
                    </form>
                    
                    <div class="cls-form-actions">
                        <button type="button" class="cls-btn cls-btn-secondary cls-btn-cancel-edit-modal">取消</button>
                        <button type="button" class="cls-btn cls-btn-primary cls-btn-save-edit-modal">保存修改</button>
                    </div>
                </div>
            </div>
        </div>
    `;
  }
  
  /**
   * 填充编辑模态框分组选项
   * @param {string} selectedGroupId 当前选中的分组ID
   */
  populateEditGroupOptions(selectedGroupId) {
    const groupTabs = document.getElementById('editModalGroupTabs');
    const hiddenInput = document.getElementById('editModalScriptGroup');
    if (!groupTabs || !hiddenInput) return;
    
    // 清除现有选项，保留"无分组"选项
    while (groupTabs.children.length > 1) {
      groupTabs.removeChild(groupTabs.lastChild);
    }
    
    // 设置"无分组"选项的激活状态
    const noGroupTab = groupTabs.firstElementChild;
    if (selectedGroupId === '' || !selectedGroupId) {
      noGroupTab.classList.add('active');
    } else {
      noGroupTab.classList.remove('active');
    }
    
    // 添加分组选项
    this.widget.groups.forEach(group => {
      const tab = document.createElement('div');
      tab.className = 'group-tab'; // 使用与主界面相同的class
      tab.dataset.group = group.id;
      tab.textContent = group.name;
      
      // 设置选中状态
      if (selectedGroupId === group.id) {
        tab.classList.add('active');
      }
      
      // 使用与主界面相同的样式：添加左侧颜色条
      if (group.color) {
        tab.style.borderLeft = `3px solid ${group.color}`;
      }
      
      groupTabs.appendChild(tab);
    });
    
    // 设置隐藏输入框的值
    hiddenInput.value = selectedGroupId || '';
  }
  
  /**
   * 绑定编辑模态框事件
   * @param {Object} script 要编辑的话术对象
   */
  bindEditModalEvents(script) {
    // 关闭按钮事件
    const closeBtn = document.querySelector('#editScriptModal .cls-btn-close-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hideEditScriptModal());
    }
    
    // 点击遮罩层关闭
    const modal = document.getElementById('editScriptModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target.id === 'editScriptModal') {
          this.hideEditScriptModal();
        }
      });
    }
    
    // 取消按钮事件
    const cancelBtn = document.querySelector('#editScriptModal .cls-btn-cancel-edit-modal');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.hideEditScriptModal());
    }
    
    // 保存按钮事件
    const saveBtn = document.querySelector('#editScriptModal .cls-btn-save-edit-modal');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.updateScript(script));
    }
    
    // 分组选项点击事件
    const groupTabs = document.getElementById('editModalGroupTabs');
    if (groupTabs) {
      groupTabs.addEventListener('click', (e) => {
        if (e.target.classList.contains('group-tab')) {
          // 移除所有active类
          groupTabs.querySelectorAll('.group-tab').forEach(tab => {
            tab.classList.remove('active');
          });
          
          // 添加active类到当前点击的标签
          e.target.classList.add('active');
          
          // 更新隐藏输入框的值
          const hiddenInput = document.getElementById('editModalScriptGroup');
          if (hiddenInput) {
            hiddenInput.value = e.target.dataset.group || '';
          }
        }
      });
    }
    
    // 键盘事件
    document.addEventListener('keydown', (e) => {
      const modal = document.getElementById('editScriptModal');
      if (modal && modal.style.display === 'flex') {
        if (e.key === 'Escape') {
          this.hideEditScriptModal();
        } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          this.updateScript(script);
        }
      }
    });
    
    this._bindEditValidationEvents();
  }
  
  /**
   * 绑定编辑表单验证事件
   * @private
   */
  _bindEditValidationEvents() {
    // 实时验证
    const titleInput = document.getElementById('editModalScriptTitle');
    const contentInput = document.getElementById('editModalScriptContent');
    
    if (titleInput) {
      titleInput.addEventListener('input', () => {
        const titleError = document.getElementById('editTitleError');
        if (titleError && titleError.style.display === 'block') {
          this.validateEditModalForm();
        }
      });
    }
    
    if (contentInput) {
      contentInput.addEventListener('input', () => {
        const contentError = document.getElementById('editContentError');
        if (contentError && contentError.style.display === 'block') {
          this.validateEditModalForm();
        }
      });
    }
  }
  
  /**
   * 验证编辑模态框表单
   * @returns {boolean} 是否验证通过
   */
  validateEditModalForm() {
    const title = document.getElementById('editModalScriptTitle')?.value.trim() || '';
    const note = document.getElementById('editModalScriptNote')?.value.trim() || '';
    const content = document.getElementById('editModalScriptContent')?.value.trim() || '';
    
    let isValid = true;
    
    // 验证标题
    const titleError = document.getElementById('editTitleError');
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
    const noteError = document.getElementById('editNoteError');
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
    const contentError = document.getElementById('editContentError');
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
  
  /**
   * 隐藏编辑话术模态框
   */
  hideEditScriptModal() {
    console.log('隐藏编辑话术模态框');
    const modal = document.getElementById('editScriptModal');
    if (modal) {
      modal.remove();
    }
  }
  
  /**
   * 更新话术
   * @param {Object} originalScript 原始话术对象
   */
  updateScript(originalScript) {
    console.log('开始更新话术');
    
    try {
      if (!this.validateEditModalForm()) {
        console.log('表单验证失败');
        return;
      }
      
      const id = document.getElementById('editModalScriptId')?.value || '';
      const title = document.getElementById('editModalScriptTitle')?.value.trim() || '';
      const note = document.getElementById('editModalScriptNote')?.value.trim() || '';
      const groupId = document.getElementById('editModalScriptGroup')?.value || '';
      const content = document.getElementById('editModalScriptContent')?.value.trim() || '';
      
      // 查找原始话术的索引
      const index = this.widget.scripts.findIndex(s => s.id === id);
      if (index === -1) {
        console.error('找不到要更新的话术:', id);
        alert('更新失败，找不到话术');
        return;
      }
      
      // 更新话术数据
      const updatedScript = {
        ...this.widget.scripts[index],
        title,
        note,
        content,
        groupId,
        updateTime: new Date().toISOString()
      };
      
      console.log('更新后的话术数据:', updatedScript);
      
      // 替换原有话术
      this.widget.scripts[index] = updatedScript;
      
      // 保存数据
      this.widget.saveData().then(() => {
        console.log('话术更新成功');
        this.widget.showSuccessMessage('话术更新成功！');
        this.widget.renderScripts();
        this.hideEditScriptModal();
        // 关闭预览浮层
        this.widget.previewModule.forceHidePreview();
      }).catch(error => {
        console.error('更新话术失败:', error);
        alert('更新失败，请重试');
      });
      
    } catch (error) {
      console.error('更新话术时出错:', error);
      alert('更新失败，请重试');
    }
  }

  /**
   * 创建管理面板HTML
   * @private
   */
  _createManagePanelHTML() {
    return `
    <div class="cls-modal-overlay" id="managePanelModal">
      <div class="cls-modal-content manage-modal-content">
        <div class="cls-modal-header">
          <h3 class="cls-modal-title">话术管理</h3>
          <button class="cls-btn-close-modal" id="closeManagePanel"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 16.5C13.1421 16.5 16.5 13.1421 16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5Z" stroke="#333333" stroke-width="0.75" stroke-linejoin="round"/><path d="M11.1211 6.87891L6.87842 11.1215" stroke="#333333" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.87891 6.87891L11.1215 11.1215" stroke="#333333" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        </div>
        <div class="cls-modal-body">
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
                <input type="text" id="script-title" placeholder="话术标题">
                <textarea id="script-note" placeholder="备注（可选）" rows="2"></textarea>
                <select id="script-group">
                  <option value="">选择分组</option>
                </select>
                <textarea id="script-content" placeholder="话术内容"></textarea>
                <div class="form-actions">
                  <button class="cls-btn-save-script">保存</button>
                  <button class="cls-btn-cancel-edit">取消</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  }

  /**
   * 绑定管理面板事件
   * @private
   */
  _bindManagePanelEvents() {
    // 关闭按钮事件
    const closeBtn = document.querySelector('#closeManagePanel');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hideManagePanel());
    }
    
    // 点击遮罩层关闭
    const modal = document.getElementById('managePanelModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target.id === 'managePanelModal') {
          this.hideManagePanel();
        }
      });
    }
    
    // 添加分组按钮
    const addGroupBtn = document.querySelector('.cls-btn-add-group');
    if (addGroupBtn) {
      addGroupBtn.addEventListener('click', () => {
        if (this.widget.addGroup) {
          this.widget.addGroup();
          // 添加分组后重新渲染分组列表
          setTimeout(() => this.renderGroupList(), 100);
        }
      });
    }
    
    // 导入数据按钮
    const importDataBtn = document.querySelector('.cls-btn-import-data');
    if (importDataBtn) {
      importDataBtn.addEventListener('click', () => {
        if (this.widget.showImportDialog) {
          this.widget.showImportDialog();
        }
      });
    }
    
    // 保存话术按钮
    const saveScriptBtn = document.querySelector('.cls-btn-save-script');
    if (saveScriptBtn) {
      saveScriptBtn.addEventListener('click', () => {
        if (this.widget.saveScript) {
          this.widget.saveScript();
        }
      });
    }
    
    // 取消编辑按钮
    const cancelEditBtn = document.querySelector('.cls-btn-cancel-edit');
    if (cancelEditBtn) {
      cancelEditBtn.addEventListener('click', () => {
        if (this.widget.clearScriptForm) {
          this.widget.clearScriptForm();
        }
      });
    }
    
    // 编辑分组按钮 - 使用事件委托
    const groupList = document.querySelector('.group-list');
    if (groupList) {
      groupList.addEventListener('click', (e) => {
        // 处理编辑分组按钮点击
        if (e.target.classList.contains('cls-btn-edit-group')) {
          const groupId = e.target.dataset.id;
          if (this.widget.editGroup && groupId) {
            this.widget.editGroup(groupId);
            // 编辑分组后重新渲染分组列表
            setTimeout(() => this.renderGroupList(), 100);
          }
        }
        
        // 处理删除分组按钮点击
        if (e.target.classList.contains('cls-btn-delete-group')) {
          const groupId = e.target.dataset.id;
          if (this.widget.deleteGroup && groupId) {
            this.widget.deleteGroup(groupId);
            // 删除分组后重新渲染分组列表
            setTimeout(() => this.renderGroupList(), 100);
          }
        }
      });
    }
  }

  /**
   * 更新话术编辑表单
   */
  updateScriptForm() {
    try {
      const scriptGroupSelect = document.getElementById('script-group');
      if (!scriptGroupSelect) {
        return;
      }
      
      // 保存当前选中的值
      const selectedValue = scriptGroupSelect.value;
      
      // 构建分组选项
      let optionsHTML = '<option value="">无分组</option>';
      
      this.widget.groups.forEach(group => {
        optionsHTML += `<option value="${group.id}">${group.name}</option>`;
      });
      
      // 更新选择器
      scriptGroupSelect.innerHTML = optionsHTML;
      
      // 恢复选中状态
      if (selectedValue) {
        scriptGroupSelect.value = selectedValue;
      }
    } catch (error) {
      console.error('更新话术编辑表单时出错:', error);
      console.error('错误堆栈:', error.stack);
    }
  }
}

// 全局暴露
if (typeof window !== 'undefined') {
  window.ModalManagement = ModalManagement;
} 