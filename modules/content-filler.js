/**
 * 内容填充模块
 * 负责将内容填充到目标输入框
 */
class ContentFiller {
  constructor() {
    this.debugMode = false;
  }

  /**
   * 将内容插入到指定的输入框
   * @param {Element} element 目标输入框
   * @param {string} content 要插入的内容
   */
  insertContent(element, content) {
    try {
      // 聚焦到目标元素
      element.focus();
      
      // 等待一小段时间确保焦点设置完成
      setTimeout(() => {
        this.setElementContent(element, content);
        this.triggerInputEvents(element);
      }, 50);
      
    } catch (error) {
      console.error('填充内容失败:', error);
      alert('填充失败，请手动复制内容');
    }
  }

  /**
   * 设置元素内容
   * @param {Element} element 目标元素
   * @param {string} content 要设置的内容
   */
  setElementContent(element, content) {
    const tagName = element.tagName.toLowerCase();
    const isContentEditable = element.contentEditable === 'true' || element.getAttribute('contenteditable') === 'true';
    const hasRole = element.getAttribute('role') === 'textbox';
    
    if (isContentEditable || hasRole) {
      // 处理可编辑元素和role="textbox"元素
      if (this.isDraftJsEditor(element)) {
        this.setDraftJsContent(element, content);
      } else if (element.classList.contains('rich-input') || element.id === 'richInput') {
        // TikTok/Zalo类型的复杂输入框结构
        this.setZaloContent(element, content);
      } else {
        // 其他 contentEditable 元素使用简单的 innerText
        element.innerText = content;
      }
    } else if (tagName === 'input' || tagName === 'textarea') {
      // 处理传统输入框
      element.value = content;
    } else {
      // 兜底处理
      if (element.value !== undefined) {
        element.value = content;
      } else {
        element.innerText = content;
      }
    }
  }

  /**
   * 为Zalo类型的复杂输入框设置内容
   * @param {Element} element 目标元素
   * @param {string} content 要设置的内容
   */
  setZaloContent(element, content) {
    // 清空现有内容
    element.innerHTML = '';
    
    // 按行分割内容并创建对应的 div 结构
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      const lineDiv = document.createElement('div');
      lineDiv.id = `input_line_${index}`;
      
      if (line.trim() === '') {
        // 空行使用 <br> 标签
        lineDiv.appendChild(document.createElement('br'));
      } else {
        // 非空行创建 span 元素
        const span = document.createElement('span');
        span.className = '';
        span.setAttribute('data-mention', line);
        span.id = 'input_part_0';
        span.style.whiteSpace = 'pre-wrap';
        span.textContent = line;
        lineDiv.appendChild(span);
      }
      
      element.appendChild(lineDiv);
    });
  }

  /**
   * 判断元素是否为 Draft.js 编辑器
   * @param {Element} element 目标元素
   * @returns {boolean}
   */
  isDraftJsEditor(element) {
    if (!element) return false;

    const className = element.className || '';
    if (className.includes('public-DraftEditor-content')) {
      return true;
    }

    const root = element.closest('.DraftEditor-root');
    return Boolean(root);
  }

  /**
   * 为 Draft.js 编辑器设置内容
   * @param {Element} element 目标元素
   * @param {string} content 要设置的内容
   */
  setDraftJsContent(element, content) {
    element.focus();

    // 选中现有内容
    const selection = window.getSelection();
    if (selection) {
      const range = document.createRange();
      range.selectNodeContents(element);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    // 优先使用 execCommand 触发 Draft.js 内部的输入事件
    let commandSucceeded = false;
    try {
      commandSucceeded = document.execCommand('insertText', false, content);
    } catch (error) {
      if (this.debugMode) {
        console.warn('execCommand 插入 Draft.js 内容失败:', error);
      }
    }

    if (!commandSucceeded) {
      // 退化方案：先清空再设置文本内容
      element.innerText = content;
    }

    // 手动触发关键输入事件，确保React/ Draft.js 同步状态
    if (typeof InputEvent === 'function') {
      try {
        const beforeInputEvent = new InputEvent('beforeinput', {
          inputType: 'insertFromPaste',
          data: content,
          bubbles: true,
          cancelable: true,
          composed: true
        });
        element.dispatchEvent(beforeInputEvent);
      } catch (error) {
        if (this.debugMode) {
          console.warn('触发 Draft.js beforeinput 事件失败:', error);
        }
      }
    }
  }

  /**
   * 触发输入框的各种事件以确保页面响应
   * @param {Element} element 目标元素
   */
  triggerInputEvents(element) {
    const events = [
      'input',
      'change', 
      'keyup',
      'keydown',
      'blur',
      'focus'
    ];
    
    events.forEach(eventType => {
      try {
        const event = new Event(eventType, { 
          bubbles: true, 
          cancelable: true,
          composed: true
        });
        element.dispatchEvent(event);
      } catch (e) {
        // 忽略事件触发错误
        if (this.debugMode) {
          console.warn(`触发${eventType}事件失败:`, e);
        }
      }
    });
    
    // 额外触发键盘事件（某些网站需要）
    try {
      const keyboardEvent = new KeyboardEvent('keypress', {
        bubbles: true,
        cancelable: true,
        key: ' ',
        code: 'Space'
      });
      element.dispatchEvent(keyboardEvent);
    } catch (e) {
      if (this.debugMode) {
        console.warn('触发键盘事件失败:', e);
      }
    }
  }

  /**
   * 检查元素是否支持内容填充
   * @param {Element} element 要检查的元素
   * @returns {boolean} 是否支持填充
   */
  canFillContent(element) {
    if (!element) return false;
    
    const tagName = element.tagName.toLowerCase();
    const isContentEditable = element.contentEditable === 'true' || element.getAttribute('contenteditable') === 'true';
    const hasRole = element.getAttribute('role') === 'textbox';
    
    return (
      tagName === 'input' ||
      tagName === 'textarea' ||
      isContentEditable ||
      hasRole ||
      element.hasAttribute('data-text')
    );
  }

  /**
   * 获取元素当前的内容
   * @param {Element} element 目标元素
   * @returns {string} 当前内容
   */
  getElementContent(element) {
    if (!element) return '';
    
    const tagName = element.tagName.toLowerCase();
    const isContentEditable = element.contentEditable === 'true' || element.getAttribute('contenteditable') === 'true';
    const hasRole = element.getAttribute('role') === 'textbox';
    
    if (isContentEditable || hasRole) {
      return element.innerText || element.textContent || '';
    } else if (tagName === 'input' || tagName === 'textarea') {
      return element.value || '';
    } else {
      return element.value || element.innerText || element.textContent || '';
    }
  }

  /**
   * 清空元素内容
   * @param {Element} element 目标元素
   */
  clearContent(element) {
    this.setElementContent(element, '');
  }

  /**
   * 在当前光标位置插入内容（而不是替换全部内容）
   * @param {Element} element 目标元素
   * @param {string} content 要插入的内容
   */
  insertAtCursor(element, content) {
    try {
      element.focus();
      
      const tagName = element.tagName.toLowerCase();
      const isContentEditable = element.contentEditable === 'true' || element.getAttribute('contenteditable') === 'true';
      
      if (isContentEditable) {
        // 对于contentEditable元素，使用execCommand或Selection API
        if (document.execCommand) {
          document.execCommand('insertText', false, content);
        } else {
          // 现代浏览器使用Selection API
          const selection = window.getSelection();
          if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(document.createTextNode(content));
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
      } else if (tagName === 'input' || tagName === 'textarea') {
        // 对于传统输入框，在光标位置插入
        const start = element.selectionStart;
        const end = element.selectionEnd;
        const value = element.value;
        
        element.value = value.substring(0, start) + content + value.substring(end);
        element.selectionStart = element.selectionEnd = start + content.length;
      }
      
      this.triggerInputEvents(element);
    } catch (error) {
      console.error('在光标位置插入内容失败:', error);
      // 降级到替换全部内容
      this.insertContent(element, content);
    }
  }

  /**
   * 设置调试模式
   * @param {boolean} enabled 是否启用调试模式
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ContentFiller;
} else if (typeof window !== 'undefined') {
  window.ContentFiller = ContentFiller;
}
