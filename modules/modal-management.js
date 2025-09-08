/**
 * 模态框管理模块
 * 负责各种模态框的显示、隐藏和基本交互功能
 */
class ModalManagement {
  constructor(chatListWidget) {
    this.widget = chatListWidget;
  }

  /**
   * 切换插件显示状态
   */
  toggleWidget() {
    if (this.widget.isVisible) {
      this.hideWidget();
    } else {
      this.showWidget();
    }
  }

  /**
   * 显示插件
   */
  showWidget() {
    if (this.widget.widget) {
      this.widget.widget.style.display = 'block';
      if (this.widget.trigger) {
        this.widget.trigger.style.display = 'none'; // 隐藏触发器
      }
      this.widget.isVisible = true;
      
      // 确保内容区域也是显示的
      const content = this.widget.widget.querySelector('.widget-content');
      if (content) {
        content.style.display = 'block';
      }
    }
  }

  /**
   * 隐藏插件
   */
  hideWidget() {
    // 先强制隐藏预览浮层
    if (this.widget.previewModule) {
      this.widget.previewModule.forceHidePreview();
    }
    
    // 使用setTimeout确保预览图层完全隐藏后再隐藏主面板
    setTimeout(() => {
      if (this.widget.widget) {
        this.widget.widget.style.display = 'none';
        if (this.widget.trigger) {
          this.widget.trigger.style.display = 'block'; // 显示触发器
        }
        this.widget.isVisible = false;
      }
    }, 10);
  }

  /**
   * 显示添加话术模态框
   */
  showAddScriptModal() {
    try {
      // 如果有脚本管理模块，优先使用脚本管理模块
      if (this.widget.scriptManagement && typeof this.widget.scriptManagement.showAddScriptModal === 'function') {
        this.widget.scriptManagement.showAddScriptModal();
        return;
      }
      
      // 创建添加话术模态框HTML
      const modalHTML = `
        <div id="addScriptModal" class="cls-modal-overlay">
          <div class="cls-modal-content">
            <div class="cls-modal-header">
              <h3 class="cls-modal-title">添加话术</h3>
              <button id="closeAddScriptModal" class="cls-btn-close-modal"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 16.5C13.1421 16.5 16.5 13.1421 16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5Z" stroke="#333333" stroke-width="0.75" stroke-linejoin="round"/><path d="M11.1211 6.87891L6.87842 11.1215" stroke="#333333" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.87891 6.87891L11.1215 11.1215" stroke="#333333" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
            </div>
            <div class="cls-modal-body">
              <form id="addScriptForm">
                <div class="cls-form-group">
                  <label class="cls-form-label" for="modalScriptTitle">话术标题 *</label>
                  <input type="text" id="modalScriptTitle" class="cls-form-control" placeholder="请输入话术标题">
                </div>
                <div class="cls-form-group">
                  <label class="cls-form-label" for="modalScriptNote">备注</label>
                  <textarea id="modalScriptNote" class="cls-form-control" placeholder="请输入备注信息（可选）" rows="2" style="color: #333333 !important;"></textarea>
                </div>
                <div class="cls-form-group">
                  <label class="cls-form-label">所属分组</label>
                  <div id="addModalGroupTabs" class="edit-group-tabs"></div>
                  <input type="hidden" id="modalScriptGroup" value="">
                </div>
                <div class="cls-form-group">
                  <label class="cls-form-label" for="modalScriptContent">话术内容 *</label>
                  <textarea id="modalScriptContent" class="cls-form-control textarea" placeholder="请输入话术内容" style="color: #333333 !important;"></textarea>
                </div>
                <div class="cls-form-actions">
                  <button type="button" id="cancelAddScript" class="cls-btn cls-btn-secondary">取消</button>
                  <button type="button" id="saveAddScript" class="cls-btn cls-btn-primary">保存话术</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      `;
      
      // 添加模态框到页面
      document.body.insertAdjacentHTML('beforeend', modalHTML);
      
      // 显示模态框
      const modal = document.getElementById('addScriptModal');
      if (modal) {
        modal.style.display = 'flex';
      }
      
      // 填充分组选项
      this.populateAddGroupOptions();
      
      // 绑定关闭按钮事件
      document.getElementById('closeAddScriptModal')?.addEventListener('click', () => this.hideAddScriptModal());
      
      // 绑定取消按钮事件
      document.getElementById('cancelAddScript')?.addEventListener('click', () => this.hideAddScriptModal());
      
      // 绑定保存按钮事件
      document.getElementById('saveAddScript')?.addEventListener('click', () => this.saveNewScript());
      
      // 设置焦点到标题输入框
      setTimeout(() => {
        const titleInput = document.getElementById('modalScriptTitle');
        if (titleInput) {
          titleInput.focus();
        }
      }, 100);
    } catch (error) {
      console.error('显示添加话术模态框时出错:', error);
      console.error('错误堆栈:', error.stack);
      alert('显示添加话术模态框时出错，请刷新页面重试');
    }
  }

  /**
   * 隐藏添加话术模态框
   */
  hideAddScriptModal() {
    const modal = document.getElementById('addScriptModal');
    if (modal) {
      modal.remove();
    }
  }

  /**
   * 填充新建话术模态框的分组选项（标签页形式）
   */
  populateAddGroupOptions() {
    const groupTabs = document.getElementById('addModalGroupTabs');
    const hiddenInput = document.getElementById('modalScriptGroup');
    if (!groupTabs || !hiddenInput) return;
    
    // 构建分组按钮HTML
    let tabsHTML = `<div class="edit-group-tab active" data-group="">无分组</div>`;
    
    if (this.widget.groups && Array.isArray(this.widget.groups)) {
      this.widget.groups.forEach(group => {
        tabsHTML += `<div class="edit-group-tab" data-group="${group.id}" style="border-left: 3px solid ${group.color}">${group.name}</div>`;
      });
    }
    
    groupTabs.innerHTML = tabsHTML;
    hiddenInput.value = '';
    
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

  /**
   * 填充编辑话术模态框的分组选项（标签页形式）
   */
  populateEditGroupOptions(currentGroupId = '') {
    const groupTabs = document.getElementById('editModalGroupTabs');
    const hiddenInput = document.getElementById('editScriptGroup');
    if (!groupTabs || !hiddenInput) return;
    
    // 构建分组按钮HTML
    let tabsHTML = `<div class="edit-group-tab ${!currentGroupId ? 'active' : ''}" data-group="">无分组</div>`;
    
    if (this.widget.groups && Array.isArray(this.widget.groups)) {
      this.widget.groups.forEach(group => {
        const isActive = group.id === currentGroupId ? 'active' : '';
        tabsHTML += `<div class="edit-group-tab ${isActive}" data-group="${group.id}" style="border-left: 3px solid ${group.color}">${group.name}</div>`;
      });
    }
    
    groupTabs.innerHTML = tabsHTML;
    hiddenInput.value = currentGroupId;
    
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

  /**
   * 填充分组选项（兼容旧版本）
   */
  populateGroupOptions(selectElement = null) {
    const select = selectElement || document.getElementById('modalScriptGroup');
    if (!select) return;
    
    // 清空现有选项
    select.innerHTML = '';
    
    // 添加默认选项
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '-- 选择分组 --';
    select.appendChild(defaultOption);
    
    // 添加分组选项
    if (this.widget.groups && Array.isArray(this.widget.groups)) {
      this.widget.groups.forEach(group => {
        const option = document.createElement('option');
        option.value = group.id;
        option.textContent = group.name;
        select.appendChild(option);
      });
    }
  }

  /**
   * 保存新话术
   */
  saveNewScript() {
    try {
      // 获取表单数据
      const title = document.getElementById('modalScriptTitle')?.value?.trim();
      const note = document.getElementById('modalScriptNote')?.value?.trim();
      const groupId = document.getElementById('modalScriptGroup')?.value;
      const content = document.getElementById('modalScriptContent')?.value?.trim();
      
      // 简单验证
      if (!title) {
        alert('请输入话术标题');
        return;
      }
      
      if (!content) {
        alert('请输入话术内容');
        return;
      }
      
      // 创建新话术对象
      const newScript = {
        id: Date.now().toString(),
        title,
        note,
        content,
        groupId,
        usageCount: 0,
        createTime: new Date().toISOString()
      };
      
      // 添加到话术列表
      if (this.widget.scripts && Array.isArray(this.widget.scripts)) {
        this.widget.scripts.push(newScript);
        
        // 保存数据
        if (typeof this.widget.saveData === 'function') {
          this.widget.saveData();
        }
        
        // 重新渲染话术列表
        if (typeof this.widget.renderScripts === 'function') {
          this.widget.renderScripts();
        }
        
        // 显示成功消息
        if (typeof this.widget.showSuccessMessage === 'function') {
          this.widget.showSuccessMessage('话术添加成功');
        }
        
        // 隐藏模态框
        this.hideAddScriptModal();
      } else {
        alert('无法保存话术，请刷新页面重试');
      }
    } catch (error) {
      console.error('保存新话术时出错:', error);
      alert('保存话术时出错，请刷新页面重试');
    }
  }

  /**
   * 显示编辑话术模态框
   */
  showEditScriptModal(script) {
    try {
      if (!script || !script.id) {
        console.error('无效的话术数据');
        return;
      }
      
      // 如果有脚本管理模块，优先使用脚本管理模块
      if (this.widget.scriptManagement && typeof this.widget.scriptManagement.showEditScriptModal === 'function') {
        this.widget.scriptManagement.showEditScriptModal(script);
        return;
      }
      
      // 创建编辑话术模态框HTML
      const modalHTML = `
        <div id="editScriptModal" class="cls-modal-overlay">
          <div class="cls-modal-content">
            <div class="cls-modal-header">
              <h3 class="cls-modal-title">编辑话术</h3>
              <button id="closeEditScriptModal" class="cls-btn-close-modal">×</button>
            </div>
            <div class="cls-modal-body">
              <form id="editScriptForm">
                <input type="hidden" id="editScriptId" value="${script.id}">
                <div class="cls-form-group">
                  <label class="cls-form-label" for="editScriptTitle">话术标题 *</label>
                  <input type="text" id="editScriptTitle" class="cls-form-control" value="${script.title || ''}">
                </div>
                <div class="cls-form-group">
                  <label class="cls-form-label" for="editScriptNote">备注</label>
                  <textarea id="editScriptNote" class="cls-form-control" placeholder="请输入备注信息（可选）" rows="2" style="color: #333333 !important;">${script.note || ''}</textarea>
                </div>
                <div class="cls-form-group">
                  <label class="cls-form-label">所属分组</label>
                  <div id="editModalGroupTabs" class="edit-group-tabs"></div>
                  <input type="hidden" id="editScriptGroup" value="${script.groupId || ''}">
                </div>
                <div class="cls-form-group">
                  <label class="cls-form-label" for="editScriptContent">话术内容 *</label>
                  <textarea id="editScriptContent" class="cls-form-control textarea" style="color: #333333 !important;">${script.content || ''}</textarea>
                </div>
                <div class="cls-form-actions">
                  <button type="button" id="cancelEditScript" class="cls-btn cls-btn-secondary">取消</button>
                  <button type="button" id="saveEditScript" class="cls-btn cls-btn-primary">保存话术</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      `;
      
      // 添加模态框到页面
      document.body.insertAdjacentHTML('beforeend', modalHTML);
      
      // 显示模态框
      const modal = document.getElementById('editScriptModal');
      if (modal) {
        modal.style.display = 'flex';
      }
      
      // 填充分组选项（标签页形式）
      this.populateEditGroupOptions(script.groupId);
      
      // 填充备注字段
      const noteTextarea = document.getElementById('editScriptNote');
      if (noteTextarea && script.note) {
        noteTextarea.value = script.note;
      }
      
      // 绑定关闭按钮事件
      document.getElementById('closeEditScriptModal')?.addEventListener('click', () => this.hideEditScriptModal());
      
      // 绑定取消按钮事件
      document.getElementById('cancelEditScript')?.addEventListener('click', () => this.hideEditScriptModal());
      
      // 绑定保存按钮事件
      document.getElementById('saveEditScript')?.addEventListener('click', () => this.saveEditScript());
      
      // 设置焦点到标题输入框
      setTimeout(() => {
        const titleInput = document.getElementById('editScriptTitle');
        if (titleInput) {
          titleInput.focus();
        }
      }, 100);
    } catch (error) {
      console.error('显示编辑话术模态框时出错:', error);
      alert('显示编辑话术模态框时出错，请刷新页面重试');
    }
  }

  /**
   * 隐藏编辑话术模态框
   */
  hideEditScriptModal() {
    const modal = document.getElementById('editScriptModal');
    if (modal) {
      modal.remove();
    }
  }

  /**
   * 保存编辑后的话术
   */
  saveEditScript() {
    try {
      // 获取表单数据
      const id = document.getElementById('editScriptId')?.value;
      const title = document.getElementById('editScriptTitle')?.value?.trim();
      const note = document.getElementById('editScriptNote')?.value?.trim();
      const groupId = document.getElementById('editScriptGroup')?.value;
      const content = document.getElementById('editScriptContent')?.value?.trim();
      
      // 简单验证
      if (!id) {
        alert('无效的话术ID');
        return;
      }
      
      if (!title) {
        alert('请输入话术标题');
        return;
      }
      
      if (!content) {
        alert('请输入话术内容');
        return;
      }
      
      // 查找并更新话术
      if (this.widget.scripts && Array.isArray(this.widget.scripts)) {
        const scriptIndex = this.widget.scripts.findIndex(s => s.id === id);
        if (scriptIndex !== -1) {
          // 更新话术
          this.widget.scripts[scriptIndex] = {
            ...this.widget.scripts[scriptIndex],
            title,
            note,
            content,
            groupId,
            updateTime: new Date().toISOString()
          };
          
          // 保存数据
          if (typeof this.widget.saveData === 'function') {
            this.widget.saveData();
          }
          
          // 重新渲染话术列表
          if (typeof this.widget.renderScripts === 'function') {
            this.widget.renderScripts();
          }
          
          // 显示成功消息
          if (typeof this.widget.showSuccessMessage === 'function') {
            this.widget.showSuccessMessage('话术更新成功');
          }
          
          // 隐藏模态框
          this.hideEditScriptModal();
        } else {
          alert('找不到要编辑的话术');
        }
      } else {
        alert('无法保存话术，请刷新页面重试');
      }
    } catch (error) {
      console.error('保存编辑话术时出错:', error);
      alert('保存话术时出错，请刷新页面重试');
    }
  }


}

// 全局暴露
if (typeof window !== 'undefined') {
  window.ModalManagement = ModalManagement;
}