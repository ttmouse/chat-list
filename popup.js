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