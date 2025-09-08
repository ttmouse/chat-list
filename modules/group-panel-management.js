/**
 * 分组面板管理模块
 * 负责分组管理面板的显示、渲染和相关操作
 */
class GroupPanelManagement {
  constructor(chatListWidget) {
    this.widget = chatListWidget;
  }

  /**
   * 显示分组管理面板
   */
  showManagePanel() {
    try {
      // 移除已存在的管理面板
      const existingPanel = document.getElementById('managePanelModal');
      if (existingPanel) {
        existingPanel.remove();
      }
      
      // 创建分组管理面板HTML
      const managePanelHTML = `
        <div id="managePanelModal" class="cls-modal-overlay">
          <div class="cls-modal-content">
            <div class="cls-modal-header">
              <h3 class="cls-modal-title">分组管理</h3>
              <button id="closeManagePanel" class="cls-btn-close-modal">×</button>
            </div>
            <div class="cls-modal-body">
              <div class="group-management">
                <div class="group-management-header">
                  <h4>分组列表</h4>
                  <div class="batch-actions">
                    <button id="importDataBtn">导入JSON</button>
                    <button id="exportDataBtn">导出JSON</button>
                    <button id="batchEditBtn">批量编辑</button>
                  </div>
                </div>
                <div id="groupListContainer" class="group-list"></div>
                <div class="group-actions">
                  <button id="addGroupBtn" class="cls-btn-add-group">+ 添加分组</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // 添加管理面板到页面
      document.body.insertAdjacentHTML('beforeend', managePanelHTML);
      
      // 显示模态框
      const modal = document.getElementById('managePanelModal');
      if (modal) {
        modal.style.display = 'flex';
      }
      
      // 绑定关闭按钮事件
      document.getElementById('closeManagePanel')?.addEventListener('click', () => this.hideManagePanel());
      
      // 绑定添加分组按钮事件
      document.getElementById('addGroupBtn')?.addEventListener('click', () => {
        if (this.widget.groupManagement && typeof this.widget.groupManagement.addGroup === 'function') {
          this.widget.groupManagement.addGroup();
        } else if (typeof this.widget.addGroup === 'function') {
          this.widget.addGroup();
        }
        setTimeout(() => this.renderGroupList(), 100);
      });
      
      // 绑定批量编辑按钮事件
      document.getElementById('batchEditBtn')?.addEventListener('click', () => this.showBatchEditPanel());

      // 导入/导出事件
      document.getElementById('importDataBtn')?.addEventListener('click', () => {
        try { this.widget.showImportDialog(); } catch (e) { console.error('导入失败', e); }
      });
      document.getElementById('exportDataBtn')?.addEventListener('click', () => {
        try { this.widget.exportData(); } catch (e) { console.error('导出失败', e); }
      });
      
      // 渲染分组列表
      this.renderGroupList();
    } catch (error) {
      console.error('显示管理面板时出错:', error);
      alert('显示管理面板时出错，请刷新页面重试');
    }
  }

  /**
   * 隐藏分组管理面板
   */
  hideManagePanel() {
    const managePanelModal = document.getElementById('managePanelModal');
    if (managePanelModal) {
      managePanelModal.remove();
    }
  }

  /**
   * 渲染分组列表
   */
  renderGroupList() {
    const container = document.getElementById('groupListContainer');
    if (!container) return;
    
    if (!this.widget.groups || this.widget.groups.length === 0) {
      container.innerHTML = '<div class="empty-group-message">暂无分组，请添加分组</div>';
      return;
    }
    
    const tableHTML = `
      <table class="group-table">
        <thead>
          <tr>
            <th style="width: 40%">分组名称</th>
            <th style="width: 20%" class="text-center">话术数量</th>
            <th style="width: 40%" class="text-center">操作</th>
          </tr>
        </thead>
        <tbody>
          ${this.widget.groups.map(group => {
            // 计算该分组下的话术数量
            const scriptCount = this.widget.scripts.filter(s => s.groupId === group.id).length;
            
            return `
              <tr data-group-id="${group.id}">
                <td>
                  <div class="group-name-cell">
                    <span class="group-color-dot" style="background-color: ${group.color || '#ccc'}"></span>
                    ${group.name}
                  </div>
                </td>
                <td class="text-center">${scriptCount}</td>
                <td class="text-center">
                  <div class="group-actions-cell">
                    <button class="edit-group-btn" data-group-id="${group.id}">编辑</button>
                    <button class="delete-group-btn" data-group-id="${group.id}">删除</button>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
    
    container.innerHTML = tableHTML;
    
    // 绑定编辑和删除按钮事件
    container.querySelectorAll('.edit-group-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const groupId = btn.getAttribute('data-group-id');
        if (this.widget.groupManagement && typeof this.widget.groupManagement.editGroup === 'function') {
          this.widget.groupManagement.editGroup(groupId);
        } else if (typeof this.widget.editGroup === 'function') {
          this.widget.editGroup(groupId);
        }
      });
    });
    
    container.querySelectorAll('.delete-group-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const groupId = btn.getAttribute('data-group-id');
        if (this.widget.groupManagement && typeof this.widget.groupManagement.deleteGroup === 'function') {
          this.widget.groupManagement.deleteGroup(groupId);
        } else if (typeof this.widget.deleteGroup === 'function') {
          this.widget.deleteGroup(groupId);
        }
        // 删除后重新渲染列表
        setTimeout(() => this.renderGroupList(), 100);
      });
    });
  }

  /**
   * 显示批量编辑面板
   */
  showBatchEditPanel() {
    try {
      // 创建批量编辑面板HTML
      const batchEditHTML = `
        <div id="batchEditModal" class="cls-modal-overlay">
          <div class="cls-modal-content">
            <div class="cls-modal-header">
              <h3 class="cls-modal-title">批量编辑分组</h3>
              <button id="closeBatchEdit" class="cls-btn-close-modal">×</button>
            </div>
            <div class="cls-modal-body">
              <div class="form-group">
                <p>在下方文本框中编辑分组数据，每行一个分组，格式为：分组ID|分组名称|分组颜色</p>
                <textarea id="batchEditText" class="form-control"></textarea>
              </div>
              <div class="form-actions">
                <button id="cancelBatchEdit">取消</button>
                <button id="saveBatchEdit">保存</button>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // 添加批量编辑面板到页面
      document.body.insertAdjacentHTML('beforeend', batchEditHTML);
      
      // 显示模态框
      const modal = document.getElementById('batchEditModal');
      if (modal) {
        modal.style.display = 'flex';
      }
      
      // 填充当前分组数据
      const textarea = document.getElementById('batchEditText');
      if (textarea) {
        textarea.value = this.widget.groups.map(group => 
          `${group.id}|${group.name}|${group.color || '#cccccc'}`
        ).join('\n');
      }
      
      // 绑定关闭按钮事件
      document.getElementById('closeBatchEdit')?.addEventListener('click', () => {
        const modal = document.getElementById('batchEditModal');
        if (modal) modal.remove();
      });
      
      // 绑定取消按钮事件
      document.getElementById('cancelBatchEdit')?.addEventListener('click', () => {
        const modal = document.getElementById('batchEditModal');
        if (modal) modal.remove();
      });
      
      // 绑定保存按钮事件
      document.getElementById('saveBatchEdit')?.addEventListener('click', () => {
        this.saveBatchEditGroups();
      });
    } catch (error) {
      console.error('显示批量编辑面板时出错:', error);
      alert('显示批量编辑面板时出错，请刷新页面重试');
    }
  }

  /**
   * 保存批量编辑的分组
   */
  saveBatchEditGroups() {
    try {
      const textarea = document.getElementById('batchEditText');
      if (!textarea) return;
      
      const lines = textarea.value.trim().split('\n');
      const newGroups = [];
      
      lines.forEach(line => {
        const parts = line.split('|');
        if (parts.length >= 3) {
          newGroups.push({
            id: parts[0].trim(),
            name: parts[1].trim(),
            color: parts[2].trim()
          });
        }
      });
      
      if (newGroups.length > 0) {
        this.widget.groups = newGroups;
        this.widget.saveData();
        this.renderGroupList();
        
        // 关闭批量编辑面板
        const modal = document.getElementById('batchEditModal');
        if (modal) modal.remove();
        
        // 显示成功消息
        this.widget.showSuccessMessage('分组批量编辑成功');
      } else {
        alert('分组数据格式错误，请检查后重试');
      }
    } catch (error) {
      console.error('保存批量编辑分组时出错:', error);
      alert('保存分组数据时出错，请刷新页面重试');
    }
  }
}

// 全局暴露
if (typeof window !== 'undefined') {
  window.GroupPanelManagement = GroupPanelManagement;
}
