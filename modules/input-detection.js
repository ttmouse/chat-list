/**
 * 输入框检测和内容填充模块
 * 负责检测页面中的输入框、验证有效性、选择最佳输入框并填充内容
 */
class InputDetection {
  constructor() {
    this.lastFocusedElement = null;
    this.inputSelectors = [
      'input[type="text"]',
      'input[type="search"]', 
      'input[type="email"]',
      'input[type="tel"]',
      'input[type="url"]',
      'input[type="password"]',
      'input:not([type])',
      'textarea',
      '[contenteditable="true"]',
      '[contenteditable=""]',
      'div[role="textbox"]',
      'span[role="textbox"]',
      '[data-text="true"]',
      '.ql-editor',
      '.note-editable',
      '.fr-element',
      '.cke_editable',
      '.mce-content-body',
      '.tox-edit-area__iframe',
      '.CodeMirror-code',
      '.ace_text-input',
      '.monaco-editor textarea'
    ];
  }

  /**
   * 插入内容到当前焦点或最佳输入框
   * @param {string} content - 要插入的内容
   * @returns {boolean} - 是否成功插入
   */
  insertContent(content) {
    console.log('开始插入内容:', content);
    
    // 首先尝试当前焦点元素
    const activeElement = document.activeElement;
    if (activeElement && this.isValidInput(activeElement)) {
      console.log('使用当前焦点元素:', activeElement);
      this.setElementContent(activeElement, content);
      this.triggerInputEvents(activeElement);
      return true;
    }
    
    // 如果没有焦点或焦点无效，查找最佳输入框
    const bestInput = this.selectBestInput();
    if (bestInput) {
      console.log('使用最佳输入框:', bestInput);
      bestInput.focus();
      this.setElementContent(bestInput, content);
      this.triggerInputEvents(bestInput);
      return true;
    }
    
    console.warn('未找到有效的输入框');
    return false;
  }

  /**
   * 验证元素是否为有效输入框
   * @param {Element} element - 要验证的元素
   * @returns {boolean} - 是否为有效输入框
   */
  isValidInput(element) {
    if (!element || !element.tagName) return false;
    
    const tagName = element.tagName.toLowerCase();
    
    // 检查基本输入元素
    if (tagName === 'input') {
      const type = element.type ? element.type.toLowerCase() : 'text';
      const validTypes = ['text', 'search', 'email', 'tel', 'url', 'password', ''];
      return validTypes.includes(type) && !element.disabled && !element.readOnly;
    }
    
    if (tagName === 'textarea') {
      return !element.disabled && !element.readOnly;
    }
    
    // 检查可编辑元素
    if (element.contentEditable === 'true' || element.contentEditable === '') {
      return true;
    }
    
    // 检查特殊角色
    if (element.getAttribute('role') === 'textbox') {
      return true;
    }
    
    // 检查特殊属性
    if (element.getAttribute('data-text') === 'true') {
      return true;
    }
    
    // 检查富文本编辑器
    const editorClasses = [
      'ql-editor', 'note-editable', 'fr-element', 'cke_editable',
      'mce-content-body', 'CodeMirror-code', 'ace_text-input'
    ];
    
    return editorClasses.some(cls => element.classList.contains(cls));
  }

  /**
   * 查找页面中所有输入框
   * @returns {Element[]} - 输入框元素数组
   */
  findAllInputs() {
    const inputs = [];
    
    this.inputSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          if (this.isValidInputElement(element)) {
            inputs.push(element);
          }
        });
      } catch (e) {
        console.warn(`选择器 ${selector} 查询失败:`, e);
      }
    });
    
    // 去重
    return [...new Set(inputs)];
  }

  /**
   * 查找有效的输入框
   * @returns {Element[]} - 有效输入框数组
   */
  findValidInputs() {
    return this.findAllInputs().filter(input => 
      this.isValidInputElement(input) && this.isElementVisible(input)
    );
  }

  /**
   * 验证输入元素是否有效
   * @param {Element} element - 要验证的元素
   * @returns {boolean} - 是否有效
   */
  isValidInputElement(element) {
    if (!element || !element.tagName) return false;
    
    // 基本有效性检查
    if (!this.isValidInput(element)) return false;
    
    // 检查是否被禁用或只读
    if (element.disabled || element.readOnly) return false;
    
    // 检查是否隐藏
    if (element.style.display === 'none' || element.style.visibility === 'hidden') {
      return false;
    }
    
    // 检查父元素是否隐藏
    let parent = element.parentElement;
    while (parent && parent !== document.body) {
      if (parent.style.display === 'none' || parent.style.visibility === 'hidden') {
        return false;
      }
      parent = parent.parentElement;
    }
    
    return true;
  }

  /**
   * 判断输入框是否为消息输入框
   * @param {Element} element - 输入框元素
   * @returns {boolean} - 是否为消息输入框
   */
  isMessageInput(element) {
    if (!element) return false;
    
    const messageKeywords = [
      'message', 'msg', 'chat', 'comment', 'reply', 'post', 'content',
      'text', 'input', 'write', 'compose', 'send', 'talk', 'say'
    ];
    
    // 检查元素属性
    const checkAttributes = ['id', 'name', 'class', 'placeholder', 'aria-label', 'data-testid'];
    
    for (const attr of checkAttributes) {
      const value = element.getAttribute(attr);
      if (value && messageKeywords.some(keyword => 
        value.toLowerCase().includes(keyword)
      )) {
        return true;
      }
    }
    
    // 检查父元素的类名和ID
    let parent = element.parentElement;
    let depth = 0;
    while (parent && depth < 3) {
      const parentClass = parent.className || '';
      const parentId = parent.id || '';
      
      if (messageKeywords.some(keyword => 
        parentClass.toLowerCase().includes(keyword) || 
        parentId.toLowerCase().includes(keyword)
      )) {
        return true;
      }
      
      parent = parent.parentElement;
      depth++;
    }
    
    return false;
  }

  /**
   * 检查元素是否可见
   * @param {Element} element - 要检查的元素
   * @returns {boolean} - 是否可见
   */
  isElementVisible(element) {
    if (!element) return false;
    
    // 检查元素本身的样式
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return false;
    }
    
    // 检查元素是否在视窗内
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return false;
    }
    
    // 检查是否在视窗范围内
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    
    return (
      rect.left < viewportWidth &&
      rect.right > 0 &&
      rect.top < viewportHeight &&
      rect.bottom > 0
    );
  }

  /**
   * 选择最佳输入框
   * @returns {Element|null} - 最佳输入框元素
   */
  selectBestInput() {
    const inputs = this.findValidInputs();
    
    if (inputs.length === 0) {
      console.log('未找到有效输入框');
      return null;
    }
    
    if (inputs.length === 1) {
      console.log('找到唯一输入框:', inputs[0]);
      return inputs[0];
    }
    
    console.log(`找到 ${inputs.length} 个输入框，开始评分选择`);
    
    let bestInput = null;
    let bestScore = -1;
    
    inputs.forEach(input => {
      const score = this.calculateInputScore(input);
      console.log('输入框评分:', input, score);
      
      if (score > bestScore) {
        bestScore = score;
        bestInput = input;
      }
    });
    
    console.log('选择的最佳输入框:', bestInput, '评分:', bestScore);
    return bestInput;
  }

  /**
   * 计算输入框评分
   * @param {Element} input - 输入框元素
   * @returns {number} - 评分
   */
  calculateInputScore(input) {
    let score = 0;
    
    // 基础分数
    score += 10;
    
    // 可见性加分
    if (this.isElementVisible(input)) {
      score += 20;
    }
    
    // 消息相关加分
    if (this.isMessageInput(input)) {
      score += 30;
    }
    
    // 位置加分（越靠下越好）
    const rect = input.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const relativePosition = rect.top / viewportHeight;
    if (relativePosition > 0.5) {
      score += 15;
    }
    
    // 面积加分
    const area = rect.width * rect.height;
    if (area > 5000) {
      score += 10;
    }
    
    // 距离视窗中心的距离（越近越好）
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const inputCenterX = rect.left + rect.width / 2;
    const inputCenterY = rect.top + rect.height / 2;
    const distance = Math.sqrt(
      Math.pow(inputCenterX - centerX, 2) + Math.pow(inputCenterY - centerY, 2)
    );
    const maxDistance = Math.sqrt(Math.pow(centerX, 2) + Math.pow(centerY, 2));
    const distanceScore = (1 - distance / maxDistance) * 10;
    score += distanceScore;
    
    // 输入框类型加分
    const tagName = input.tagName.toLowerCase();
    if (tagName === 'textarea') {
      score += 15;
    } else if (input.contentEditable === 'true') {
      score += 12;
    }
    
    // 搜索框减分
    const searchKeywords = ['search', 'find', 'query', 'filter'];
    const inputText = (input.placeholder || input.name || input.id || '').toLowerCase();
    if (searchKeywords.some(keyword => inputText.includes(keyword))) {
      score -= 20;
    }
    
    return score;
  }

  /**
   * 获取输入框评分信息
   * @returns {Array} - 输入框评分信息数组
   */
  getInputScores() {
    const inputs = this.findValidInputs();
    return inputs.map(input => {
      const score = this.calculateInputScore(input);
      const rect = input.getBoundingClientRect();
      
      return {
        element: input,
        score: score,
        info: {
          tagName: input.tagName.toLowerCase(),
          type: input.type || 'N/A',
          id: input.id || 'N/A',
          className: input.className || 'N/A',
          placeholder: input.placeholder || 'N/A',
          position: `${Math.round(rect.left)}, ${Math.round(rect.top)}`,
          size: `${Math.round(rect.width)} × ${Math.round(rect.height)}`,
          visible: this.isElementVisible(input),
          isMessage: this.isMessageInput(input)
        }
      };
    }).sort((a, b) => b.score - a.score);
  }

  /**
   * 设置元素内容
   * @param {Element} element - 目标元素
   * @param {string} content - 要设置的内容
   */
  setElementContent(element, content) {
    if (!element || !content) return;
    
    try {
      // 处理可编辑元素
      if (element.contentEditable === 'true' || element.contentEditable === '') {
        // 特殊处理 Zalo 类型的复杂结构
        const isZaloType = element.querySelector('span[data-text="true"]');
        if (isZaloType) {
          const textSpan = element.querySelector('span[data-text="true"]');
          if (textSpan) {
            textSpan.textContent = content;
            return;
          }
        }
        
        // 普通可编辑元素
        element.textContent = content;
        return;
      }
      
      // 处理传统输入框
      if (element.tagName.toLowerCase() === 'input' || element.tagName.toLowerCase() === 'textarea') {
        element.value = content;
        return;
      }
      
      // 其他情况尝试设置 textContent
      element.textContent = content;
      
    } catch (e) {
      console.warn('设置元素内容失败:', e);
    }
  }

  /**
   * 触发输入事件
   * @param {Element} element - 目标元素
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
        console.warn(`触发${eventType}事件失败:`, e);
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
      console.warn('触发键盘事件失败:', e);
    }
  }

  /**
   * 高亮显示元素
   * @param {Element} element - 要高亮的元素
   * @param {number} duration - 高亮持续时间（毫秒）
   */
  highlightElement(element, duration = 2000) {
    if (!element) return;
    
    const originalStyle = {
      outline: element.style.outline,
      outlineOffset: element.style.outlineOffset,
      transition: element.style.transition
    };
    
    // 添加高亮样式
    element.style.outline = '3px solid #ff6b6b';
    element.style.outlineOffset = '2px';
    element.style.transition = 'outline 0.3s ease';
    
    // 移除高亮
    setTimeout(() => {
      element.style.outline = originalStyle.outline;
      element.style.outlineOffset = originalStyle.outlineOffset;
      element.style.transition = originalStyle.transition;
    }, duration);
  }

  /**
   * 高亮显示所有输入框
   * @param {number} duration - 高亮持续时间（毫秒）
   */
  highlightAllInputs(duration = 3000) {
    const inputs = this.findValidInputs();
    inputs.forEach(input => {
      this.highlightElement(input, duration);
    });
  }

  /**
   * 获取元素信息
   * @param {Element} element - 目标元素
   * @returns {Object} - 元素信息
   */
  getElementInfo(element) {
    if (!element) return null;
    
    const rect = element.getBoundingClientRect();
    
    return {
      tagName: element.tagName.toLowerCase(),
      type: element.type || 'N/A',
      id: element.id || 'N/A',
      className: element.className || 'N/A',
      placeholder: element.placeholder || 'N/A',
      value: element.value || element.textContent || 'N/A',
      position: {
        x: Math.round(rect.left),
        y: Math.round(rect.top)
      },
      size: {
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      },
      visible: this.isElementVisible(element),
      isMessage: this.isMessageInput(element),
      score: this.calculateInputScore(element)
    };
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = InputDetection;
} else if (typeof window !== 'undefined') {
  window.InputDetection = InputDetection;
}