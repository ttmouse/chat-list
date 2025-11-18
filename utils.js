/**
 * 工具函数模块
 * 提供通用的工具函数，包括剪贴板操作、对话框显示、扩展上下文检查等
 */

// Element.closest() polyfill for older browsers
if (!Element.prototype.closest) {
  Element.prototype.closest = function(selector) {
    let element = this;
    while (element && element.nodeType === 1) {
      if (element.matches(selector)) {
        return element;
      }
      element = element.parentElement || element.parentNode;
    }
    return null;
  };
}

// Element.matches() polyfill for older browsers
if (!Element.prototype.matches) {
  Element.prototype.matches = Element.prototype.msMatchesSelector || 
                              Element.prototype.webkitMatchesSelector;
}

class Utils {
  constructor() {
    this.contextNoticeShown = false;
  }

  /**
   * 复制内容到剪贴板
   * @param {string} text - 要复制的文本
   */
  async copyToClipboard(text) {
    try {
      // 优先使用现代的 Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        console.log('内容已复制到剪贴板');
      } else {
        // 降级方案：使用传统的 execCommand
        this.fallbackCopyToClipboard(text);
      }
    } catch (error) {
      console.error('复制到剪贴板失败:', error);
      // 如果现代API失败，尝试降级方案
      this.fallbackCopyToClipboard(text);
    }
  }

  /**
   * 降级复制方案
   * @param {string} text - 要复制的文本
   */
  fallbackCopyToClipboard(text) {
    try {
      // 创建临时文本区域
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      // 执行复制命令
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        console.log('内容已复制到剪贴板（降级方案）');
      } else {
        console.error('复制失败');
      }
    } catch (error) {
      console.error('降级复制方案失败:', error);
    }
  }

  /**
   * 显示自定义确认对话框
   * @param {string} title - 对话框标题
   * @param {string} message - 对话框消息
   * @param {Function} onConfirm - 确认回调函数
   * @param {Function} onCancel - 取消回调函数
   */
  showConfirmDialog(title, message, onConfirm, onCancel = null) {
    // 移除已存在的确认对话框
    const existingDialog = document.getElementById('custom-confirm-dialog');
    if (existingDialog) {
      existingDialog.remove();
    }

    // 创建对话框HTML
    const dialogHTML = `
      <div class="chatlist-confirm-overlay" id="custom-confirm-dialog">
        <div class="chatlist-confirm-content">
          <div class="chatlist-confirm-header">
            <h3>${title}</h3>
          </div>
          <div class="chatlist-confirm-body">
            <p>${message.replace(/\n/g, '<br>')}</p>
          </div>
          <div class="chatlist-confirm-footer">
            <button class="cls-btn cls-btn-secondary" id="confirm-cancel-btn">取消</button>
            <button class="cls-btn cls-btn-danger" id="confirm-ok-btn">确定</button>
          </div>
        </div>
      </div>
    `;

    // 添加到页面
    document.body.insertAdjacentHTML('beforeend', dialogHTML);
    const dialog = document.getElementById('custom-confirm-dialog');

    // 绑定事件
    const cancelBtn = dialog.querySelector('#confirm-cancel-btn');
    const okBtn = dialog.querySelector('#confirm-ok-btn');

    const closeDialog = () => {
      dialog.remove();
    };

    // 取消按钮
    cancelBtn.addEventListener('click', () => {
      closeDialog();
      if (onCancel) onCancel();
    });

    // 确定按钮
    okBtn.addEventListener('click', () => {
      closeDialog();
      if (onConfirm) onConfirm();
    });

    // 点击遮罩层关闭
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        closeDialog();
        if (onCancel) onCancel();
      }
    });

    // ESC键关闭
    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        closeDialog();
        if (onCancel) onCancel();
        document.removeEventListener('keydown', handleKeydown);
      }
    };
    document.addEventListener('keydown', handleKeydown);

    // 聚焦到确定按钮
    setTimeout(() => {
      okBtn.focus();
    }, 100);
  }

  /**
   * 检查扩展上下文是否有效
   * @returns {boolean} 扩展上下文是否有效
   */
  isExtensionContextValid() {
    try {
      return !!(chrome && chrome.runtime && chrome.runtime.id);
    } catch (error) {
      return false;
    }
  }

  /**
   * 显示上下文失效提示
   */
  showContextInvalidatedNotice() {
    // 避免重复显示提示
    if (this.contextNoticeShown) return;
    this.contextNoticeShown = true;
    
    const notice = document.createElement('div');
    notice.className = 'chatlist-notice';
    notice.innerHTML = `
      <div class="title">扩展已更新</div>
      <div class="desc">请刷新页面以继续使用话术助手</div>
    `;
    
    // 点击关闭提示
    notice.addEventListener('click', () => {
      notice.remove();
    });
    
    // 5秒后自动关闭
    setTimeout(() => {
      if (notice.parentNode) {
        notice.remove();
      }
    }, 5000);
    
    document.body.appendChild(notice);
  }

  /**
   * 显示成功消息
   * @param {string} message - 成功消息内容
   */
  showSuccessMessage(message) {
    // 移除已存在的成功消息
    const existingMessage = document.getElementById('success-message');
    if (existingMessage) {
      existingMessage.remove();
    }

    const messageEl = document.createElement('div');
    messageEl.id = 'success-message';
    messageEl.className = 'chatlist-toast';
    messageEl.textContent = message;

    document.body.appendChild(messageEl);

    // 显示动画
    setTimeout(() => {
      messageEl.classList.add('show');
    }, 10);

    // 3秒后自动隐藏
    setTimeout(() => {
      messageEl.classList.remove('show');
      setTimeout(() => {
        if (messageEl.parentNode) {
          messageEl.remove();
        }
      }, 300);
    }, 3000);
  }

  /**
   * 获取元素信息（用于调试）
   * @param {Element} element - DOM元素
   * @returns {string} 元素信息字符串
   */
  getElementInfo(element) {
    if (!element) return '无';
    
    const tagName = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : '';
    const className = element.className ? `.${element.className.split(' ').join('.')}` : '';
    const type = element.type ? `[type="${element.type}"]` : '';
    const placeholder = element.placeholder ? `[placeholder="${element.placeholder.substring(0, 20)}..."]` : '';
    
    return `${tagName}${id}${className}${type}${placeholder}`.substring(0, 100);
  }

  /**
   * 生成唯一ID
   * @returns {string} 唯一ID
   */
  generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  /**
   * 防抖函数
   * @param {Function} func - 要防抖的函数
   * @param {number} wait - 等待时间（毫秒）
   * @returns {Function} 防抖后的函数
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * 节流函数
   * @param {Function} func - 要节流的函数
   * @param {number} limit - 限制时间（毫秒）
   * @returns {Function} 节流后的函数
   */
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * 深拷贝对象
   * @param {any} obj - 要拷贝的对象
   * @returns {any} 拷贝后的对象
   */
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }
    
    if (obj instanceof Array) {
      return obj.map(item => this.deepClone(item));
    }
    
    if (typeof obj === 'object') {
      const clonedObj = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = this.deepClone(obj[key]);
        }
      }
      return clonedObj;
    }
  }

  /**
   * 格式化日期
   * @param {Date} date - 日期对象
   * @param {string} format - 格式字符串
   * @returns {string} 格式化后的日期字符串
   */
  formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }

  /**
   * 兼容性的 closest 方法
   * @param {Element} element - DOM元素
   * @param {string} selector - CSS选择器
   * @returns {Element|null} 匹配的祖先元素或null
   */
  closest(element, selector) {
    if (!element || !selector) return null;
    
    // 如果浏览器支持原生closest方法，直接使用
    if (element.closest) {
      return element.closest(selector);
    }
    
    // 降级方案：手动向上遍历DOM树
    let current = element;
    while (current && current.nodeType === 1) {
      if (this.matches(current, selector)) {
        return current;
      }
      current = current.parentElement || current.parentNode;
    }
    return null;
  }

  /**
   * 兼容性的 matches 方法
   * @param {Element} element - DOM元素
   * @param {string} selector - CSS选择器
   * @returns {boolean} 是否匹配选择器
   */
  matches(element, selector) {
    if (!element || !selector) return false;
    
    // 如果浏览器支持原生matches方法，直接使用
    if (element.matches) {
      return element.matches(selector);
    }
    
    // 降级方案：使用其他兼容方法
    if (element.msMatchesSelector) {
      return element.msMatchesSelector(selector);
    }
    if (element.webkitMatchesSelector) {
      return element.webkitMatchesSelector(selector);
    }
    
    // 最后的降级方案：使用querySelectorAll
    const matches = (element.document || element.ownerDocument).querySelectorAll(selector);
    let i = matches.length;
    while (--i >= 0 && matches.item(i) !== element) {}
    return i > -1;
  }
}

// 导出工具类实例
window.ChatListUtils = new Utils();
