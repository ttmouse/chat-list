/**
 * 输入框检测核心模块
 * 负责查找和验证页面中的输入框元素
 */
class InputDetector {
  constructor() {
    this.debugMode = false;
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
    
    // 检查是否为消息输入框（排除搜索框等）
    if (!this.isMessageInput(element)) {
      return false;
    }
    
    return true;
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
    
    // 检查是否为明显的搜索相关输入框 - 只排除明确的搜索框
    const searchKeywords = ['search', '搜索', 'find', '查找'];
    
    // 检查placeholder - 只检查明确的搜索关键词
    const placeholder = element.placeholder || '';
    if (searchKeywords.some(keyword => placeholder.toLowerCase().includes(keyword.toLowerCase()))) {
      return false;
    }
    
    // 检查aria-label - 只检查明确的搜索关键词
    const ariaLabel = element.getAttribute('aria-label') || '';
    if (searchKeywords.some(keyword => ariaLabel.toLowerCase().includes(keyword.toLowerCase()))) {
      return false;
    }
    
    // 检查class名称 - 只检查明确的搜索关键词
    const className = element.className || '';
    if (searchKeywords.some(keyword => className.toLowerCase().includes(keyword.toLowerCase()))) {
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
    
    // 检查是否为Zalo页面的聊天输入框
    if (ChatListUtils.closest(element, '#chat-input-container-id')) {
      return true;
    }
    
    // 如果输入框有明确的消息相关属性，直接通过
    const messageKeywords = ['message', '消息', 'comment', '评论', 'chat', '聊天', 'reply', '回复', 'input', 'text'];
    if (messageKeywords.some(keyword => 
      placeholder.toLowerCase().includes(keyword.toLowerCase()) ||
      ariaLabel.toLowerCase().includes(keyword.toLowerCase()) ||
      className.toLowerCase().includes(keyword.toLowerCase())
    )) {
      return true;
    }
    
    // 检查是否在聊天或消息相关的容器中
    const chatContainers = [
      '[id*="chat"]', '[class*="chat"]',
      '[id*="message"]', '[class*="message"]',
      '[id*="input"]', '[class*="input"]',
      '[id*="compose"]', '[class*="compose"]'
    ];
    
    for (let selector of chatContainers) {
      if (ChatListUtils.closest(element, selector)) {
        return true;
      }
    }
    
    // 默认允许通过，除非明确是搜索框
    return true;
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