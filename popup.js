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
    await this.loadVersion();
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

  // 白名单加载逻辑已移除

  async loadVersion() {
    try {
      // 从 manifest.json 获取版本号
      const manifest = chrome.runtime.getManifest();
      const version = manifest.version;

      // 更新页面中的版本号显示
      const versionElement = document.querySelector('.footer p');
      if (versionElement) {
        versionElement.innerHTML = `话术助手 v${version} | <a href="#" id="help-link">帮助</a> | <a href="#" id="feedback-link">反馈</a>`;

        // 重新绑定帮助和反馈链接事件
        document.getElementById('help-link').addEventListener('click', (e) => {
          e.preventDefault();
          this.showHelp();
        });

        document.getElementById('feedback-link').addEventListener('click', (e) => {
          e.preventDefault();
          this.showFeedback();
        });
      }
    } catch (error) {
      console.error('加载版本号失败:', error);
    }
  }

  updateUI() {
    document.getElementById('auto-show').checked = this.settings.autoShow;
    document.getElementById('allow-drag').checked = this.settings.allowDrag;
    document.getElementById('remember-position').checked = this.settings.rememberPosition;
    // 白名单设置已移除
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

    // 浮层控制按钮
    document.getElementById('toggle-widget').addEventListener('click', (e) => {
      e.preventDefault();
      this.toggleWidget();
    });

    document.getElementById('show-widget').addEventListener('click', (e) => {
      e.preventDefault();
      this.showWidget();
    });

    // 管理话术按钮
    document.getElementById('manage-scripts').addEventListener('click', (e) => {
      e.preventDefault();
      this.openManagePage();
    });

  }

  async saveSettings() {
    try {
      await chrome.storage.local.set({ chatSettings: this.settings });
      // 仍保留通知，但不再涉及白名单逻辑
      const tabs = await chrome.tabs.query({});
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'SETTINGS_UPDATED',
          settings: this.settings
        }).catch(() => { });
      });
    } catch (error) {
      console.error('保存设置失败:', error);
    }
  }

  async openManagePage() {
    try {
      chrome.tabs.create({ url: 'http://[::]:5500/web-admin/index.html' });
      window.close();
    } catch (error) {
      console.error('打开管理页面失败:', error);
    }
  }

  async toggleWidget() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        const response = await chrome.tabs.sendMessage(tab.id, {
          type: 'TOGGLE_WIDGET'
        });
        if (response && response.success) {
          const status = response.visible ? '已显示' : '已隐藏';
          // 可以在这里显示状态提示
          // console.log(`话术助手${status}`);
        }
        window.close();
      }
    } catch (error) {
      console.error('切换浮层失败:', error);
      alert('请在网页中使用话术助手功能');
    }
  }

  async showWidget() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        const response = await chrome.tabs.sendMessage(tab.id, {
          type: 'SHOW_WIDGET'
        });
        if (response && response.success) {
          // console.log('话术助手已显示');
        }
        window.close();
      }
    } catch (error) {
      console.error('显示浮层失败:', error);
      alert('请在网页中使用话术助手功能');
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

5. 如有问题，请联系开发者。
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
