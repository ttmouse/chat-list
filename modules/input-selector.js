/**
 * 智能选择算法模块
 * 负责从多个输入框中选择最佳的一个
 */
class InputSelector {
  constructor() {
    this.debugMode = false;
    this.focusHistory = [];
    this.lastFocusedElement = null;
    this.maxHistorySize = 10;
    
    // 监听焦点变化
    this.initFocusTracking();
  }

  /**
   * 初始化焦点跟踪
   */
  initFocusTracking() {
    document.addEventListener('focusin', (e) => {
      if (this.isInputElement(e.target)) {
        this.updateFocusHistory(e.target);
      }
    });
  }

  /**
   * 检查元素是否为输入框
   * @param {Element} element 要检查的元素
   * @returns {boolean} 是否为输入框
   */
  isInputElement(element) {
    if (!element) return false;
    
    const tagName = element.tagName.toLowerCase();
    return (
      tagName === 'input' ||
      tagName === 'textarea' ||
      element.contentEditable === 'true' ||
      element.getAttribute('role') === 'textbox'
    );
  }

  /**
   * 更新焦点历史记录
   * @param {Element} element 获得焦点的元素
   */
  updateFocusHistory(element) {
    this.lastFocusedElement = element;
    
    // 移除已存在的记录
    const existingIndex = this.focusHistory.indexOf(element);
    if (existingIndex !== -1) {
      this.focusHistory.splice(existingIndex, 1);
    }
    
    // 添加到历史记录开头
    this.focusHistory.unshift(element);
    
    // 限制历史记录大小
    if (this.focusHistory.length > this.maxHistorySize) {
      this.focusHistory = this.focusHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * 从输入框数组中选择最佳的一个
   * @param {Array} inputs 输入框数组
   * @returns {Element|null} 最佳输入框
   */
  selectBestInput(inputs) {
    if (inputs.length === 0) return null;
    if (inputs.length === 1) return inputs[0];
    
    // 优先级策略（增强版）：
    // 1. 当前焦点元素（最高优先级）
    // 2. 最近交互过的输入框
    // 3. 可见且在视窗内的输入框
    // 4. 消息相关的输入框（通过属性判断）
    // 5. 位置在页面下半部分的输入框
    // 6. 面积较大的输入框
    // 7. 距离视窗中心较近的输入框
    
    const visibleInputs = inputs.filter(input => this.isElementVisible(input));
    const candidateInputs = visibleInputs.length > 0 ? visibleInputs : inputs;
    
    // 按优先级排序
    const scoredInputs = candidateInputs.map(input => {
      const rect = input.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      let score = 0;
      
      // 1. 当前焦点元素（最高优先级）
      if (input === document.activeElement) score += 500;
      
      // 2. 最近交互加分（提高权重）
      const historyIndex = this.focusHistory.indexOf(input);
      if (historyIndex !== -1) {
        score += (this.focusHistory.length - historyIndex) * 20;
      }
      
      // 3. 是否为最后聚焦的元素（提高权重）
      if (input === this.lastFocusedElement) score += 300;
      
      // 4. 可见性加分
      if (this.isElementVisible(input)) score += 100;
      
      // 5. 消息相关属性加分
      const placeholder = (input.placeholder || '').toLowerCase();
      const ariaLabel = (input.getAttribute('aria-label') || '').toLowerCase();
      const className = String(input.className || '').toLowerCase();
      const messageKeywords = ['message', '消息', 'comment', '评论', 'chat', '聊天', 'reply', '回复', 'input', '输入'];
      
      if (messageKeywords.some(keyword => 
        placeholder.includes(keyword) || 
        ariaLabel.includes(keyword) || 
        className.includes(keyword)
      )) {
        score += 80;
      }
      
      // 6. 位置加分（页面下半部分，但权重降低）
      if (rect.top > viewportHeight * 0.4) score += 30;
      
      // 7. 面积加分（适中的面积更好）
      const area = rect.width * rect.height;
      if (area > 5000 && area < 50000) {
        score += Math.min(area / 2000, 40);
      } else if (area >= 50000) {
        score += 20; // 过大的面积降低分数
      }
      
      // 8. 距离视窗中心的距离（越近越好）
      const centerX = viewportWidth / 2;
      const centerY = viewportHeight / 2;
      const inputCenterX = rect.left + rect.width / 2;
      const inputCenterY = rect.top + rect.height / 2;
      const distance = Math.sqrt(
        Math.pow(inputCenterX - centerX, 2) + 
        Math.pow(inputCenterY - centerY, 2)
      );
      const maxDistance = Math.sqrt(Math.pow(centerX, 2) + Math.pow(centerY, 2));
      const distanceScore = (1 - distance / maxDistance) * 20;
      score += distanceScore;
      
      // 9. 输入框类型加分
      const tagName = input.tagName.toLowerCase();
      if (tagName === 'textarea') score += 25;
      if (input.contentEditable === 'true') score += 15;
      
      // 10. 排除明显的搜索框（减分）
      const searchKeywords = ['search', '搜索', 'find', '查找', 'filter', '筛选'];
      if (searchKeywords.some(keyword => 
        placeholder.includes(keyword) || 
        ariaLabel.includes(keyword) || 
        className.includes(keyword)
      )) {
        score -= 50;
      }
      
      return { input, score, rect };
    });
    
    // 按分数排序，返回最高分的输入框
    scoredInputs.sort((a, b) => b.score - a.score);
    
    // 调试信息
    if (this.debugMode) {
      console.log('输入框评分结果:', scoredInputs.map(item => ({
        element: this.getElementInfo(item.input),
        score: item.score,
        rect: item.rect
      })));
    }
    
    return scoredInputs[0].input;
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

  /**
   * 清空焦点历史记录
   */
  clearFocusHistory() {
    this.focusHistory = [];
    this.lastFocusedElement = null;
  }

  /**
   * 获取焦点历史记录
   * @returns {Array} 焦点历史记录
   */
  getFocusHistory() {
    return [...this.focusHistory];
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = InputSelector;
} else if (typeof window !== 'undefined') {
  window.InputSelector = InputSelector;
}