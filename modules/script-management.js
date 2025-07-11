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
      // 使用ModalManagement模块的方法
      if (this.widget.modalManagement) {
        this.widget.modalManagement.showEditScriptModal(script);
      } else {
        this.showEditScriptModal(script);
      }
    } else {
      console.error('未找到指定的话术:', scriptId);
    }
  }

  // 显示编辑话术模态框 (备用方法，优先使用ModalManagement中的方法)
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
    
    // 清除所有错误提示
    this.clearErrors(['editTitleError', 'editNoteError', 'editContentError']);
    
    // 查找原始话术
    const scriptIndex = this.widget.scripts.findIndex(s => s.id === scriptId);
    if (scriptIndex === -1) {
      console.error('找不到要更新的话术:', scriptId);
      alert('更新失败，找不到话术');
      return;
    }
    
    // 更新话术数据
    const originalScript = this.widget.scripts[scriptIndex];
    const updatedScript = {
      ...originalScript,
      title,
      note,
      content,
      groupId: group,
      updateTime: new Date().toISOString()
    };
    
    // 替换原有话术
    this.widget.scripts[scriptIndex] = updatedScript;
    
    // 保存数据
    this.widget.saveData().then(() => {
      console.log('话术更新成功');
      this.widget.showSuccessMessage('话术更新成功！');
      this.widget.renderScripts();
      this.hideEditScriptModal();
    }).catch(error => {
      console.error('更新话术失败:', error);
      alert('更新失败，请重试');
    });
  }

  // 显示错误信息
  showError(errorId, message) {
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
  }

  // 清除错误信息
  clearErrors(errorIds) {
    errorIds.forEach(id => {
      const errorElement = document.getElementById(id);
      if (errorElement) {
        errorElement.style.display = 'none';
      }
    });
  }

  // 删除话术
  deleteScript(scriptId) {
    this.widget.showConfirmDialog(
      '确认删除',
      '确定要删除这条话术吗？此操作不可恢复。',
      () => {
        // 删除话术
        this.widget.scripts = this.widget.scripts.filter(s => s.id !== scriptId);
        
        // 保存数据
        this.widget.saveData().then(() => {
          console.log('话术删除成功');
          this.widget.showSuccessMessage('话术删除成功！');
          this.widget.renderScripts();
        }).catch(error => {
          console.error('删除话术失败:', error);
          alert('删除失败，请重试');
        });
      }
    );
  }

  // 保存话术 (管理面板中的保存)
  saveScript() {
    try {
      console.log('保存话术');
      
      const scriptId = document.getElementById('edit-script-id')?.value;
      const title = document.getElementById('script-title')?.value?.trim();
      const note = document.getElementById('script-note')?.value?.trim();
      const groupId = document.getElementById('script-group')?.value;
      const content = document.getElementById('script-content')?.value?.trim();
      
      console.log('表单数据:', { scriptId, title, note, groupId, content });
      
      // 验证必填字段
      if (!title) {
        alert('请输入话术标题');
        return;
      }
      
      if (!content) {
        alert('请输入话术内容');
        return;
      }
      
      if (scriptId) {
        // 编辑现有话术
        const index = this.widget.scripts.findIndex(s => s.id === scriptId);
        if (index !== -1) {
          this.widget.scripts[index] = {
            ...this.widget.scripts[index],
            title,
            note,
            content,
            groupId,
            updateTime: new Date().toISOString()
          };
          
          console.log('更新话术:', this.widget.scripts[index]);
        } else {
          console.error('找不到要更新的话术:', scriptId);
          return;
        }
      } else {
        // 添加新话术
        const newScript = {
          id: Date.now().toString(),
          title,
          note,
          content,
          groupId,
          createTime: new Date().toISOString(),
          updateTime: new Date().toISOString()
        };
        
        this.widget.scripts.push(newScript);
        console.log('添加新话术:', newScript);
      }
      
      // 保存数据
      this.widget.saveData().then(() => {
        console.log('话术保存成功');
        this.widget.showSuccessMessage('话术保存成功！');
        this.widget.renderScripts();
        this.clearScriptForm();
        
        // 如果是在管理面板中，更新分组列表
        if (this.widget.groupPanelManagement) {
          this.widget.groupPanelManagement.renderGroupList();
        } else if (this.widget.modalManagement) {
          this.widget.modalManagement.renderGroupList();
        }
      }).catch(error => {
        console.error('保存话术失败:', error);
        alert('保存失败，请重试');
      });
      
    } catch (error) {
      console.error('保存话术时出错:', error);
      alert('保存失败，请重试');
    }
  }

  // 清除话术表单
  clearScriptForm() {
    const idInput = document.getElementById('edit-script-id');
    const titleInput = document.getElementById('script-title');
    const noteInput = document.getElementById('script-note');
    const groupSelect = document.getElementById('script-group');
    const contentInput = document.getElementById('script-content');
    
    if (idInput) idInput.value = '';
    if (titleInput) titleInput.value = '';
    if (noteInput) noteInput.value = '';
    if (groupSelect) groupSelect.value = '';
    if (contentInput) contentInput.value = '';
  }
}

// 全局暴露
if (typeof window !== 'undefined') {
  window.ScriptManagement = ScriptManagement;
}