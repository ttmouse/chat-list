/**
 * 文本框自适应高度工具模块
 * 提供文本框自适应高度功能，包括初始化、监听和自动调整
 */

class TextareaUtils {
  constructor() {
    this.observer = null;
    this.initialized = false;
  }

  /**
   * 自动调整文本框高度
   * @param {HTMLTextAreaElement} textarea - 需要调整高度的文本框
   */
  autoResizeTextarea(textarea) {
    // 重置高度以获取正确的scrollHeight
    textarea.style.height = 'auto';
    
    // 计算新高度
    const newHeight = Math.max(textarea.scrollHeight, parseInt(getComputedStyle(textarea).minHeight));
    
    // 设置新高度
    textarea.style.height = newHeight + 'px';
  }

  /**
   * 为单个textarea设置自适应功能
   * @param {HTMLTextAreaElement} textarea - 需要设置自适应的文本框
   */
  setupTextareaAutoResize(textarea) {
    // 避免重复绑定
    if (textarea.hasAttribute('data-auto-resize')) {
      return;
    }
    
    textarea.setAttribute('data-auto-resize', 'true');
    
    // 输入事件
    textarea.addEventListener('input', () => {
      this.autoResizeTextarea(textarea);
    });
    
    // 粘贴事件
    textarea.addEventListener('paste', () => {
      setTimeout(() => {
        this.autoResizeTextarea(textarea);
      }, 0);
    });
    
    // 初始调整
    setTimeout(() => {
      this.autoResizeTextarea(textarea);
    }, 0);
  }

  /**
   * 初始化所有textarea的自适应高度功能
   */
  initAutoResizeTextareas() {
    if (this.initialized) {
      return;
    }

    // 为现有的textarea添加自适应功能
    document.querySelectorAll('textarea').forEach(textarea => {
      this.setupTextareaAutoResize(textarea);
    });
    
    // 监听动态添加的textarea
    this.observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // 检查新添加的节点是否是textarea
            if (node.tagName === 'TEXTAREA') {
              this.setupTextareaAutoResize(node);
            }
            // 检查新添加节点内部的textarea
            node.querySelectorAll && node.querySelectorAll('textarea').forEach(textarea => {
              this.setupTextareaAutoResize(textarea);
            });
          }
        });
      });
    });
    
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    this.initialized = true;
  }

  /**
   * 销毁观察器，清理资源
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.initialized = false;
  }
}

// 创建全局实例
window.TextareaUtils = window.TextareaUtils || new TextareaUtils();

// 兼容原有的全局函数调用方式
window.autoResizeTextarea = function(textarea) {
  window.TextareaUtils.autoResizeTextarea(textarea);
};

window.setupTextareaAutoResize = function(textarea) {
  window.TextareaUtils.setupTextareaAutoResize(textarea);
};

window.initAutoResizeTextareas = function() {
  window.TextareaUtils.initAutoResizeTextareas();
};

// 导出模块（如果支持模块系统）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TextareaUtils;
}