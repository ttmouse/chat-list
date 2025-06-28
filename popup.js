// 弹出页面脚本
class PopupManager {
  constructor() {
    this.settings = {
      autoShow: false,
      allowDrag: true,
      rememberPosition: true
    };
    this.init();
  }

  async init() {
    await this.loadSettings();
    await this.loadStats();
    this.bindEvents();
    this.updateUI();
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.local.get(['chatSettings']);
      if (result.chatSettings) {
        this.settings = { ...this.settings, ...result.chatSettings };
      }
    } catch (error) {
      console.error('加载设置失败:', error);
    }
  }

  async loadStats() {
    try {
      const result = await chrome.storage.local.get(['chatScripts', 'chatGroups', 'usageStats']);
      const scripts = result.chatScripts || [];
      const groups = result.chatGroups || [];
      const stats = result.usageStats || { totalUsage: 0 };

      document.getElementById('script-count').textContent = scripts.length;
      document.getElementById('group-count').textContent = groups.length;
      document.getElementById('usage-count').textContent = stats.totalUsage;
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  }

  updateUI() {
    document.getElementById('auto-show').checked = this.settings.autoShow;
    document.getElementById('allow-drag').checked = this.settings.allowDrag;
    document.getElementById('remember-position').checked = this.settings.rememberPosition;
  }

  bindEvents() {
    // 设置选项变更
    document.getElementById('auto-show').addEventListener('change', (e) => {
      this.settings.autoShow = e.target.checked;
      this.saveSettings();
    });

    document.getElementById('allow-drag').addEventListener('change', (e) => {
      this.settings.allowDrag = e.target.checked;
      this.saveSettings();
    });

    document.getElementById('remember-position').addEventListener('change', (e) => {
      this.settings.rememberPosition = e.target.checked;
      this.saveSettings();
    });

    // 管理话术按钮
    document.getElementById('manage-scripts').addEventListener('click', (e) => {
      e.preventDefault();
      this.openManagePage();
    });

    // 导入导出按钮
    document.getElementById('import-export').addEventListener('click', (e) => {
      e.preventDefault();
      this.showImportExportDialog();
    });

    // 帮助链接
    document.getElementById('help-link').addEventListener('click', (e) => {
      e.preventDefault();
      this.showHelp();
    });

    // 反馈链接
    document.getElementById('feedback-link').addEventListener('click', (e) => {
      e.preventDefault();
      this.showFeedback();
    });
  }

  async saveSettings() {
    try {
      await chrome.storage.local.set({ chatSettings: this.settings });
      // 通知内容脚本设置已更新
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'SETTINGS_UPDATED',
          settings: this.settings
        }).catch(() => {
          // 忽略错误，可能页面还没有加载内容脚本
        });
      }
    } catch (error) {
      console.error('保存设置失败:', error);
    }
  }

  async openManagePage() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        // 发送消息给内容脚本，打开管理面板
        chrome.tabs.sendMessage(tab.id, {
          type: 'OPEN_MANAGE_PANEL'
        }).catch(() => {
          alert('请在网页中使用话术助手管理功能');
        });
        window.close();
      }
    } catch (error) {
      console.error('打开管理页面失败:', error);
    }
  }

  showImportExportDialog() {
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    `;

    dialog.innerHTML = `
      <div style="
        background: white;
        padding: 24px;
        border-radius: 12px;
        width: 300px;
        max-width: 90vw;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      ">
        <h3 style="margin: 0 0 16px; text-align: center; color: #333;">导入/导出话术</h3>
        
        <div style="margin-bottom: 16px;">
          <button id="export-btn" style="
            width: 100%;
            padding: 12px;
            background: #28a745;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            margin-bottom: 8px;
            font-size: 14px;
          ">导出话术数据</button>
          
          <input type="file" id="import-file" accept=".json" style="display: none;">
          <button id="import-btn" style="
            width: 100%;
            padding: 12px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            margin-bottom: 8px;
            font-size: 14px;
          ">导入话术数据</button>
        </div>
        
        <div style="text-align: center;">
          <button id="close-dialog" style="
            padding: 8px 16px;
            background: #6c757d;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
          ">关闭</button>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    // 绑定事件
    dialog.querySelector('#export-btn').addEventListener('click', () => {
      this.exportData();
    });

    dialog.querySelector('#import-btn').addEventListener('click', () => {
      dialog.querySelector('#import-file').click();
    });

    dialog.querySelector('#import-file').addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.importData(e.target.files[0]);
      }
    });

    dialog.querySelector('#close-dialog').addEventListener('click', () => {
      document.body.removeChild(dialog);
    });

    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        document.body.removeChild(dialog);
      }
    });
  }

  async exportData() {
    try {
      const result = await chrome.storage.local.get(['chatScripts', 'chatGroups']);
      const data = {
        scripts: result.chatScripts || [],
        groups: result.chatGroups || [],
        exportTime: new Date().toISOString(),
        version: '1.0.0'
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `话术助手数据_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      alert('导出成功！');
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
    }
  }

  async importData(file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.scripts || !Array.isArray(data.scripts)) {
        throw new Error('无效的数据格式');
      }

      const confirmImport = confirm(
        `即将导入 ${data.scripts.length} 个话术和 ${(data.groups || []).length} 个分组。\n\n这将覆盖现有数据，是否继续？`
      );

      if (confirmImport) {
        await chrome.storage.local.set({
          chatScripts: data.scripts,
          chatGroups: data.groups || []
        });

        alert('导入成功！');
        this.loadStats();

        // 通知内容脚本数据已更新
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'DATA_UPDATED'
          }).catch(() => {
            // 忽略错误
          });
        }
      }
    } catch (error) {
      console.error('导入失败:', error);
      alert('导入失败，请检查文件格式是否正确');
    }
  }

  showHelp() {
    const helpContent = `
话术助手使用说明：

1. 话术管理：
   - 点击"管理我的话术"可以添加、编辑、删除话术
   - 支持话术分组管理
   - 可以为话术设置不同的分组和颜色

2. 使用话术：
   - 在任意网页右侧会显示悬浮的话术列表
   - 点击话术内容即可自动填充到当前焦点的输入框
   - 支持按分组筛选话术

3. 设置选项：
   - 自动显示：页面加载时自动显示话术助手
   - 允许拖拽：可以拖拽话术助手到任意位置
   - 记住位置：记住上次拖拽的位置

4. 数据管理：
   - 支持导出话术数据进行备份
   - 支持导入话术数据进行恢复

如有问题，请联系开发者。
    `;

    alert(helpContent);
  }

  showFeedback() {
    const feedback = prompt('请输入您的反馈建议：');
    if (feedback && feedback.trim()) {
      // 这里可以实现反馈提交功能
      alert('感谢您的反馈！我们会认真考虑您的建议。');
    }
  }
}

// 初始化弹出页面
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});