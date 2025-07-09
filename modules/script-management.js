// 话术管理模块
class ScriptManagement {
  constructor(chatListWidget) {
    this.widget = chatListWidget;
  }

  // 编辑话术
  editScript(scriptId) {
    console.log('editScript called with ID:', scriptId);
    const script = this.widget.scripts.find(s => s.id === scriptId);
    console.log('Found script:', script);
    if (script) {
      console.log('显示编辑话术模态框');
      this.showEditScriptModal(script);
    } else {
      console.error('未找到指定的话术:', scriptId);
    }
  }

  // 显示编辑话术模态框
  showEditScriptModal(script) {
    console.log('显示编辑话术模态框', script);
    
    // 创建编辑模态框HTML
    const modalHTML = `
        <div class="cls-modal-overlay" id="editScriptModal">
        <div class="cls-modal-content">
          <div class="cls-modal-header">
            <h3 class="cls-modal-title">编辑话术</h3>
            <button class="cls-btn-close-modal"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 16.5C13.1421 16.5 16.5 13.1421 16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5Z" stroke="#333333" stroke-width="0.75" stroke-linejoin="round"/><path d="M11.1211 6.87891L6.87842 11.1215" stroke="#333333" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.87891 6.87891L11.1215 11.1215" stroke="#333333" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          </div>
          <div class="cls-modal-body">
                    <form id="editScriptForm">
                        <input type="hidden" id="editScriptId" value="${script.id}">
                        <div class="cls-form-group">
                             <label class="cls-form-label" for="editModalScriptTitle">话术标题 *</label>
                             <input type="text" id="editModalScriptTitle" class="cls-form-control" placeholder="请输入话术标题" value="${script.title || ''}" required>
                             <div id="editTitleError" class="cls-error-message" style="display: none;"></div>
                         </div>
                         
                         <div class="cls-form-group">
                             <label class="cls-form-label" for="editModalScriptNote">备注</label>
                             <textarea id="editModalScriptNote" class="cls-form-control" placeholder="请输入备注信息（可选）" rows="2">${script.note || ''}</textarea>
                             <div id="editNoteError" class="cls-error-message" style="display: none;"></div>
                         </div>
                         
                         <div class="cls-form-group">
                             <label class="cls-form-label">所属分组</label>
                            <div class="edit-group-tabs" id="editModalGroupTabs">
                                <div class="edit-group-tab" data-group="">无分组</div>
                            </div>
                            <input type="hidden" id="editModalScriptGroup" value="">
                        </div>
                        
                        <div class="cls-form-group">
                             <label class="cls-form-label" for="editModalScriptContent">话术内容 *</label>
                             <textarea id="editModalScriptContent" class="cls-form-control textarea" placeholder="请输入话术内容" required>${script.content || ''}</textarea>
                             <div id="editContentError" class="cls-error-message" style="display: none;"></div>
                         </div>
                         
                         <div class="cls-form-actions">
                             <button type="button" class="cls-btn cls-btn-secondary cls-btn-cancel-edit-modal">取消</button>
                             <button type="button" class="cls-btn cls-btn-primary cls-btn-save-edit-modal">保存话术</button>
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

  // 填充编辑分组选项
  populateEditGroupOptions(currentGroup) {
    const groupTabs = document.getElementById('editModalGroupTabs');
    const hiddenInput = document.getElementById('editModalScriptGroup');
    if (!groupTabs || !hiddenInput) return;
    
    // 构建分组按钮HTML
    let tabsHTML = `<div class="edit-group-tab ${!currentGroup ? 'active' : ''}" data-group="">无分组</div>`;
    
    this.widget.groups.forEach(group => {
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

  // 绑定编辑模态框事件
  bindEditModalEvents() {
    // 关闭按钮
    const closeBtn = document.querySelector('#editScriptModal .cls-btn-close-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hideEditScriptModal());
    }
    
    // 取消按钮
    const cancelBtn = document.querySelector('.cls-btn-cancel-edit-modal');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.hideEditScriptModal());
    }
    
    // 保存按钮
    const saveBtn = document.querySelector('.cls-btn-save-edit-modal');
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

  // 隐藏编辑话术模态框
  hideEditScriptModal() {
    console.log('隐藏编辑话术模态框');
    const modal = document.getElementById('editScriptModal');
    if (modal) {
      modal.remove();
    }
    // 关闭预览浮层
    if (this.widget.previewModule) {
      this.widget.previewModule.forceHidePreview();
    }
  }

  // 保存编辑的话术
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
    const scriptIndex = this.widget.scripts.findIndex(s => s.id === scriptId);
    if (scriptIndex !== -1) {
      this.widget.scripts[scriptIndex] = {
        ...this.widget.scripts[scriptIndex],
        title,
        note,
        groupId: group,
        content,
        updatedAt: new Date().toISOString()
      };
      
      // 保存到存储
      this.widget.saveData();
      
      // 刷新显示
      this.widget.renderScripts();
      
      // 隐藏模态框
      this.hideEditScriptModal();
      
      // 关闭预览浮层
      if (this.widget.previewModule) {
        this.widget.previewModule.forceHidePreview();
      }
      
      console.log('话术更新成功');
    } else {
      console.error('未找到要更新的话术');
    }
  }

  // 显示错误信息
  showError(errorId, message) {
    const errorEl = document.getElementById(errorId);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }
  }

  // 清除错误信息
  clearErrors(errorIds) {
    errorIds.forEach(id => {
      const errorEl = document.getElementById(id);
      if (errorEl) {
        errorEl.style.display = 'none';
      }
    });
  }

  // 删除话术
  deleteScript(scriptId) {
    if (this.widget.showConfirmDialog) {
      this.widget.showConfirmDialog(
        '确认删除',
        '确定要删除这个话术吗？',
        () => {
          this.widget.scripts = this.widget.scripts.filter(s => s.id !== scriptId);
          this.widget.saveData();
          this.widget.renderScripts();
        }
      );
    } else {
      console.error('showConfirmDialog 方法未找到');
    }
  }

  // 保存话术（管理面板中的保存功能）
  saveScript() {
    try {
      console.log('开始保存话术...');
      
      const id = this.widget.widget.querySelector('#edit-script-id').value;
      const title = this.widget.widget.querySelector('#script-title').value.trim();
      const note = this.widget.widget.querySelector('#script-note').value.trim();
      const groupId = this.widget.widget.querySelector('#script-group').value;
      const content = this.widget.widget.querySelector('#script-content').value.trim();

      console.log('获取到的表单数据:', { id, title, note, groupId, content });

      if (!title || !content) {
        console.warn('验证失败: 标题或内容为空');
        alert('请填写话术标题和内容');
        return;
      }

      if (id) {
        // 编辑现有话术
        const script = this.widget.scripts.find(s => s.id === id);
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
        this.widget.scripts.push(newScript);
        console.log('添加新话术:', newScript);
        console.log('当前话术总数:', this.widget.scripts.length);
      }

      // 保存数据
      this.widget.saveData()
        .then(() => {
          console.log('数据保存成功');
          this.widget.renderScripts();
          this.clearScriptForm();
          if (this.widget.hideManagePanel) {
            this.widget.hideManagePanel();
          }
          
          // 显示成功提示
          if (this.widget.showSuccessMessage) {
            this.widget.showSuccessMessage(id ? '话术更新成功' : '话术添加成功');
          }
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

  // 清空话术表单
  clearScriptForm() {
    try {
      console.log('清空话术表单...');
      
      const elements = {
        'edit-script-id': this.widget.widget.querySelector('#edit-script-id'),
        'script-title': this.widget.widget.querySelector('#script-title'),
        'script-note': this.widget.widget.querySelector('#script-note'),
        'script-group': this.widget.widget.querySelector('#script-group'),
        'script-content': this.widget.widget.querySelector('#script-content')
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
}

// 全局暴露
if (typeof window !== 'undefined') {
  window.ScriptManagement = ScriptManagement;
}