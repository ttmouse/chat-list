/**
 * 输入框管理器
 * 整合输入框检测、选择和填充功能的统一接口
 */
class InputManager {
  constructor() {
    this.detector = new InputDetector();
    this.selector = new InputSelector();
    this.filler = new ContentFiller();
    this.debugMode = false;
  }

  /**
   * 查找并选择最佳的输入框
   * @returns {Element|null} 最佳输入框
   */
  findBestInput() {
    const validInputs = this.detector.findValidInputs();
    
    if (this.debugMode) {
      console.log(`找到 ${validInputs.length} 个有效输入框`);
    }
    
    if (validInputs.length === 0) {
      return null;
    }
    
    return this.selector.selectBestInput(validInputs);
  }

  /**
   * 将内容填充到最佳输入框
   * @param {string} content 要填充的内容
   * @param {Object} options 选项
   * @param {Element} options.lastFocusedElement 最后聚焦的元素
   * @param {Function} options.getValidFocusFromHistory 获取有效焦点历史的函数
   * @returns {boolean} 是否成功填充
   */
  fillContent(content, options = {}) {
    const { lastFocusedElement, getValidFocusFromHistory } = options;
    
    // 查找当前焦点的输入框
    const activeElement = document.activeElement;
    
    // 如果当前焦点是插件内部的搜索框，优先使用焦点历史记录
    if (activeElement && this._isInsideWidget(activeElement)) {
      if (getValidFocusFromHistory) {
        const validFocusElement = getValidFocusFromHistory();
        if (validFocusElement) {
          this.filler.insertContent(validFocusElement, content);
          return true;
        }
      }
      
      // 如果焦点历史中没有有效元素，使用最后聚焦的元素
      if (lastFocusedElement && this.detector.isValidInput(lastFocusedElement)) {
        // 检查元素是否仍然存在于DOM中
        if (document.contains(lastFocusedElement)) {
          this.filler.insertContent(lastFocusedElement, content);
          return true;
        }
      }
    }
    
    // 如果当前有焦点的输入框且不是插件内部的输入框，优先使用
    if (activeElement && this.detector.isValidInput(activeElement) && !this._isInsideWidget(activeElement)) {
      this.filler.insertContent(activeElement, content);
      return true;
    }
    
    // 如果没有当前焦点或焦点无效，使用焦点历史记录
    if (getValidFocusFromHistory) {
      const validFocusElement = getValidFocusFromHistory();
      if (validFocusElement) {
        this.filler.insertContent(validFocusElement, content);
        return true;
      }
    }
    
    // 如果焦点历史中没有有效元素，使用最后聚焦的元素
    if (lastFocusedElement && this.detector.isValidInput(lastFocusedElement)) {
      // 检查元素是否仍然存在于DOM中
      if (document.contains(lastFocusedElement)) {
        this.filler.insertContent(lastFocusedElement, content);
        return true;
      }
    }
    
    // 查找页面中可能的输入框，按优先级排序
    const inputs = this.detector.findValidInputs();
    
    if (inputs.length === 0) {
      return false;
    }
    
    // 如果只有一个输入框，直接使用
    if (inputs.length === 1) {
      this.filler.insertContent(inputs[0], content);
      return true;
    }
    
    // 多个输入框时，使用智能选择策略
    const target = this.selector.selectBestInput(inputs);
    this.filler.insertContent(target, content);
    return true;
  }

  /**
   * 检查元素是否在插件内部
   * @param {Element} element 要检查的元素
   * @returns {boolean} 是否在插件内部
   */
  _isInsideWidget(element) {
    // 使用ChatListUtils.closest检查是否在插件内部
    if (typeof ChatListUtils !== 'undefined' && ChatListUtils.closest) {
      return ChatListUtils.closest(element, '#chat-list-widget');
    }
    
    // 备用检查方法
    let current = element;
    while (current && current !== document.body) {
      if (current.id === 'chat-list-widget') {
        return true;
      }
      current = current.parentElement;
    }
    return false;
  }

  /**
   * 在光标位置插入内容
   * @param {string} content 要插入的内容
   * @returns {boolean} 是否成功插入
   */
  insertAtCursor(content) {
    const bestInput = this.findBestInput();
    
    if (!bestInput) {
      if (this.debugMode) {
        console.warn('未找到合适的输入框');
      }
      return false;
    }
    
    this.filler.insertAtCursor(bestInput, content);
    return true;
  }

  /**
   * 获取所有有效输入框
   * @returns {Array} 有效输入框数组
   */
  getAllValidInputs() {
    return this.detector.findValidInputs();
  }

  /**
   * 获取当前最佳输入框的内容
   * @returns {string} 当前内容
   */
  getCurrentContent() {
    const bestInput = this.findBestInput();
    return bestInput ? this.filler.getElementContent(bestInput) : '';
  }

  /**
   * 清空当前最佳输入框的内容
   * @returns {boolean} 是否成功清空
   */
  clearCurrentContent() {
    const bestInput = this.findBestInput();
    
    if (!bestInput) {
      return false;
    }
    
    this.filler.clearContent(bestInput);
    return true;
  }

  /**
   * 获取输入框的详细信息（用于调试）
   * @returns {Object} 输入框信息
   */
  getInputInfo() {
    const validInputs = this.detector.findValidInputs();
    const bestInput = this.selector.selectBestInput(validInputs);
    
    return {
      totalInputs: validInputs.length,
      bestInput: bestInput ? this.detector.getElementInfo(bestInput) : null,
      focusHistory: this.selector.getFocusHistory().map(el => this.detector.getElementInfo(el)),
      allInputs: validInputs.map(input => ({
        info: this.detector.getElementInfo(input),
        visible: this.detector.isElementVisible(input),
        canFill: this.filler.canFillContent(input)
      }))
    };
  }

  /**
   * 设置调试模式
   * @param {boolean} enabled 是否启用调试模式
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
    this.detector.setDebugMode(enabled);
    this.selector.setDebugMode(enabled);
    this.filler.setDebugMode(enabled);
  }

  /**
   * 清空焦点历史记录
   */
  clearFocusHistory() {
    this.selector.clearFocusHistory();
  }

  /**
   * 手动更新焦点历史（当外部代码改变焦点时）
   * @param {Element} element 获得焦点的元素
   */
  updateFocus(element) {
    if (this.selector.isInputElement(element)) {
      this.selector.updateFocusHistory(element);
    }
  }

  /**
   * 检查指定元素是否为有效输入框
   * @param {Element} element 要检查的元素
   * @returns {boolean} 是否为有效输入框
   */
  isValidInput(element) {
    return this.detector.isValidInput(element);
  }

  /**
   * 将内容填充到指定的输入框
   * @param {Element} element 目标输入框
   * @param {string} content 要填充的内容
   * @returns {boolean} 是否成功填充
   */
  fillSpecificInput(element, content) {
    if (!this.detector.isValidInput(element)) {
      return false;
    }
    
    if (!this.filler.canFillContent(element)) {
      return false;
    }
    
    this.filler.insertContent(element, content);
    return true;
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = InputManager;
} else if (typeof window !== 'undefined') {
  window.InputManager = InputManager;
}