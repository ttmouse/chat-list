/**
 * 输入框检测核心模块
 * 负责查找和验证页面中的输入框元素
 */
class InputDetector {
  constructor() {
    this.debugMode = false;
  }

  /**
   * 规范化文本，移除重音并转换为小写
   * @param {string} value 原始文本
   * @returns {string} 规范化后的文本
   */
  normalizeText(value) {
    if (!value) return '';
    return String(value)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  /**
   * 判断值数组中是否包含任意关键词
   * @param {Array<string>} values 待匹配的值
   * @param {Array<string>} keywords 目标关键词
   * @returns {boolean}
   */
  includesKeyword(values, keywords) {
    if (!values || !keywords) return false;
    const normalizedValues = values.map(value => this.normalizeText(value));
    return keywords.some(keyword => {
      const normalizedKeyword = this.normalizeText(keyword);
      if (!normalizedKeyword) return false;
      return normalizedValues.some(value => value.includes(normalizedKeyword));
    });
  }

  /**
   * 查找页面中所有输入框
   * @returns {Array} 输入框元素数组
   */
  findAllInputs() {
    const selectors = [
      'input[type="text"]',
      'input[type="search"]', 
      'input[type="email"]',
      'input[type="url"]',
      'input[type="tel"]',
      'input[type="password"]',
      'input:not([type])',
      'textarea',
      '[contenteditable="true"]',
      '[role="textbox"]',
      '[data-text="true"]'
    ];
    
    const inputs = [];
    selectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        inputs.push(...Array.from(elements));
      } catch (e) {
        console.warn(`查找输入框失败 (${selector}):`, e);
      }
    });
    
    // 去重
    return [...new Set(inputs)];
  }

  /**
   * 查找有效的输入框（过滤掉不可用的）
   * @returns {Array} 有效输入框数组
   */
  findValidInputs() {
    const allInputs = this.findAllInputs();
    return allInputs.filter(input => this.isValidInput(input));
  }

  /**
   * 检查输入框是否有效
   * @param {Element} element 输入框元素
   * @returns {boolean} 是否有效
   */
  isValidInput(element) {
    if (!element || !this.isValidInputElement(element)) {
      return false;
    }
    
    // 检查是否为消息输入框（排除搜索框等），必须满足至少一个消息判定条件
    return this.isMessageInput(element);
  }

  /**
   * 检查元素是否为有效的输入框元素
   * @param {Element} element 要检查的元素
   * @returns {boolean} 是否为有效输入框
   */
  isValidInputElement(element) {
    if (!element) {
      return false;
    }
    
    // 检查是否为只读或禁用
    if (element.readOnly || element.disabled) {
      return false;
    }
    
    // 对于contenteditable元素，确保真的可编辑
    if (element.contentEditable === 'true' || element.getAttribute('contenteditable') === 'true') {
      return true;
    }
    
    // 对于role="textbox"的元素
    if (element.getAttribute('role') === 'textbox') {
      return true;
    }
    
    // 对于传统input和textarea
    const tagName = element.tagName.toLowerCase();
    if (tagName === 'textarea' || tagName === 'input') {
      return true;
    }
    
    // 检查是否有特殊的输入框属性
    if (element.getAttribute('data-text') === 'true') {
      return true;
    }
    
    // 检查是否有输入框相关的类名
    const className = String(element.className || '');
    if (className.includes('input') || className.includes('textarea') || className.includes('textbox')) {
      return true;
    }
    
    return false;
  }

  /**
   * 判断输入框是否为消息输入框（排除搜索框等）
   * @param {Element} element 输入框元素
   * @returns {boolean} 是否为消息输入框
   */
  isMessageInput(element) {
    if (!element) return false;
    
    const placeholderRaw = element.getAttribute('placeholder') || element.placeholder || '';
    const ariaLabelRaw = element.getAttribute('aria-label') || '';
    const classNameRaw = element.className || '';
    const idRaw = element.id || '';
    const nameRaw = element.getAttribute('name') || '';
    const dataE2eRaw = element.getAttribute('data-e2e') || '';
    const dataTestIdRaw = element.getAttribute('data-testid') || '';
    const ariaDescribedByRaw = element.getAttribute('aria-describedby') || '';

    const attributeValues = [
      placeholderRaw,
      ariaLabelRaw,
      classNameRaw,
      idRaw,
      nameRaw,
      dataE2eRaw,
      dataTestIdRaw,
      ariaDescribedByRaw
    ];

    const classNameLower = this.normalizeText(classNameRaw);
    const isDraftEditor = classNameLower.includes('public-drafteditor-content') ||
      classNameLower.includes('drafteditor');

    const contentEditableAttr = this.normalizeText(element.getAttribute('contenteditable') || '');
    const isContentEditable = element.contentEditable === 'true' || contentEditableAttr === 'true' || element.isContentEditable;
    const role = this.normalizeText(element.getAttribute('role') || '');
    const behavesLikeEditor = isContentEditable || role === 'textbox';

    // 检查是否为明显的搜索相关输入框 - 只排除明确的搜索框
    const searchKeywords = ['search', '搜索', 'find', '查找', 'search box', 'tìm kiếm', 'tim kiem'];
    if (this.includesKeyword(attributeValues, searchKeywords)) {
      return false;
    }

    // 排除明显的导航栏、头部区域的输入框
    const excludeSelectors = [
      'nav', 'header', '.navbar', '.header', '.top-bar', '.search-bar',
      '[role="navigation"]', '[role="banner"]'
    ];
    
    for (let selector of excludeSelectors) {
      if (ChatListUtils.closest(element, selector)) {
        return false;
      }
    }
    
    if (!behavesLikeEditor && !isDraftEditor) {
      // 排除联系方式、电话等非聊天输入
      const contactKeywords = [
        'phone', 'mobile', '电话', '手机号', 'liên hệ', 'liên lạc',
        'so dien thoai', 'số điện thoại', 'dien thoai', 'điện thoại', 'sdt',
        'contact', 'email', 'mail', 'gmail', '号码', '號碼', 'tel'
      ];
      if (this.includesKeyword(attributeValues, contactKeywords)) {
        return false;
      }

      const contactSelectors = ['.phone-component', '.contact-input', '.contact-field'];
      if (typeof ChatListUtils !== 'undefined' && ChatListUtils.closest) {
        for (let selector of contactSelectors) {
          if (ChatListUtils.closest(element, selector)) {
            return false;
          }
        }
      }

      const inputType = this.normalizeText(element.getAttribute('type') || '');
      if (inputType === 'tel' || inputType === 'phone') {
        return false;
      }

      const inputMode = this.normalizeText(element.getAttribute('inputmode') || '');
      if (inputMode === 'tel' || inputMode === 'numeric') {
        return false;
      }
    }

    // 检查是否为Zalo页面的聊天输入框
    if (ChatListUtils.closest(element, '#chat-input-container-id')) {
      return true;
    }

    const messageKeywords = [
      'message', '消息', 'comment', '评论', 'chat', '聊天', 'reply', '回复',
      'tin nhan', 'nhan tin', 'soan', 'gui tin nhan', 'tra loi', 'tro chuyen',
      'compose', 'answer', 'respond', 'inbox', 'dm', 'direct message'
    ];
    const hasMessageKeyword = this.includesKeyword(attributeValues, messageKeywords);

    // 检查是否在聊天或消息相关的容器中
    const chatContainers = [
      '[data-e2e="message-input-area"]',
      '.css-6fmtan-5e6d46e3--DivMessageInputAndSendButton',
      '.css-m2yd4j-5e6d46e3--DivInputAreaContainer',
      '.css-y13y08-5e6d46e3--DivEditorContainer',
      '.css-s6hdfk-5e6d46e3--DivInputAreaContainer',
      '[data-e2e*="message"]',
      '[data-e2e*="chat"]',
      '[data-testid*="message"]',
      '[data-testid*="composer"]',
      '[data-testid*="reply"]',
      '.DraftEditor-root',
      '.DraftEditor-editorContainer',
      '.chat-input', '.chatbox', '.chat-box', '.chat-footer',
      '[id*="chat"]', '[class*="chat"]',
      '[id*="message"]', '[class*="message"]',
      '[id*="compose"]', '[class*="compose"]',
      '[aria-label*="tin nhan"]', '[aria-label*="tin nhắn"]', '[aria-label*="消息"]', '[aria-label*="留言"]'
    ];

    let inChatContainer = false;
    if (typeof ChatListUtils !== 'undefined' && ChatListUtils.closest) {
      for (let selector of chatContainers) {
        if (ChatListUtils.closest(element, selector)) {
          inChatContainer = true;
          break;
        }
      }
    }

    // 只有在存在明确消息信号时才认为是真正的聊天输入框
    return (
      hasMessageKeyword ||
      isDraftEditor ||
      (behavesLikeEditor && inChatContainer)
    );
  }

  /**
   * 检查元素是否可见
   * @param {Element} element 要检查的元素
   * @returns {boolean} 是否可见
   */
  isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.visibility !== 'hidden' &&
      style.display !== 'none' &&
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth
    );
  }

  /**
   * 获取元素的简要信息（用于调试）
   * @param {Element} element 元素
   * @returns {string} 元素信息
   */
  getElementInfo(element) {
    if (!element) return 'Unknown';
    
    let info = element.tagName.toLowerCase();
    
    if (element.id) {
      info += `#${element.id}`;
    }
    
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.trim()).slice(0, 2);
      if (classes.length > 0) {
        info += `.${classes.join('.')}`;
      }
    }
    
    if (element.placeholder) {
      info += ` [${element.placeholder.substring(0, 20)}...]`;
    }
    
    return info;
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
  module.exports = InputDetector;
} else if (typeof window !== 'undefined') {
  window.InputDetector = InputDetector;
}
