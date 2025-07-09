/**
 * 焦点管理模块
 * 负责管理输入框的焦点历史记录和焦点相关操作
 */
class FocusManagement {
  constructor() {
    this.lastFocusedElement = null; // 记住最后聚焦的元素
    this.focusHistory = []; // 焦点历史记录，最多保存2个
  }

  /**
   * 添加元素到焦点历史记录
   * @param {Element} element - 要添加的元素
   */
  addToFocusHistory(element) {
    // 移除已存在的相同元素
    this.focusHistory = this.focusHistory.filter(el => el !== element);
    
    // 添加到历史记录开头
    this.focusHistory.unshift(element);
    
    // 限制历史记录长度为2个
    if (this.focusHistory.length > 2) {
      this.focusHistory = this.focusHistory.slice(0, 2);
    }
  }

  /**
   * 从焦点历史中获取有效的焦点元素
   * @param {Function} isValidInputCallback - 验证输入框有效性的回调函数
   * @returns {Element|null} 有效的焦点元素或null
   */
  getValidFocusFromHistory(isValidInputCallback) {
    for (let element of this.focusHistory) {
      // 检查元素是否仍然存在于DOM中且有效
      if (document.contains(element) && isValidInputCallback(element)) {
        return element;
      }
    }
    return null;
  }

  /**
   * 设置最后聚焦的元素
   * @param {Element} element - 要设置的元素
   */
  setLastFocusedElement(element) {
    this.lastFocusedElement = element;
  }

  /**
   * 获取最后聚焦的元素
   * @returns {Element|null} 最后聚焦的元素
   */
  getLastFocusedElement() {
    return this.lastFocusedElement;
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
   * @returns {Array} 焦点历史记录数组
   */
  getFocusHistory() {
    return [...this.focusHistory]; // 返回副本
  }

  /**
   * 检查元素是否在焦点历史中
   * @param {Element} element - 要检查的元素
   * @returns {boolean} 是否在焦点历史中
   */
  isInFocusHistory(element) {
    return this.focusHistory.includes(element);
  }

  /**
   * 获取元素在焦点历史中的索引
   * @param {Element} element - 要查找的元素
   * @returns {number} 索引值，-1表示不存在
   */
  getFocusHistoryIndex(element) {
    return this.focusHistory.indexOf(element);
  }

  /**
   * 计算输入框的焦点优先级分数
   * @param {Element} input - 输入框元素
   * @param {Function} isElementVisibleCallback - 检查元素可见性的回调函数
   * @returns {number} 优先级分数
   */
  calculateFocusPriorityScore(input, isElementVisibleCallback) {
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
    if (isElementVisibleCallback && isElementVisibleCallback(input)) {
      score += 100;
    }
    
    // 5. 位置加分（页面下半部分优先）
    const centerY = rect.top + rect.height / 2;
    if (centerY > viewportHeight * 0.5) {
      score += 50;
    }
    
    // 6. 面积加分
    const area = rect.width * rect.height;
    if (area > 5000) score += 30;
    else if (area > 1000) score += 15;
    
    // 7. 距离视窗中心的距离（越近越好）
    const centerX = rect.left + rect.width / 2;
    const distanceFromCenter = Math.sqrt(
      Math.pow(centerX - viewportWidth / 2, 2) + 
      Math.pow(centerY - viewportHeight / 2, 2)
    );
    const maxDistance = Math.sqrt(Math.pow(viewportWidth / 2, 2) + Math.pow(viewportHeight / 2, 2));
    const distanceScore = (1 - distanceFromCenter / maxDistance) * 20;
    score += distanceScore;
    
    return score;
  }

  /**
   * 从输入框列表中选择最佳的输入框
   * @param {Array} inputs - 输入框列表
   * @param {Function} isElementVisibleCallback - 检查元素可见性的回调函数
   * @param {Function} isMessageInputCallback - 检查是否为消息输入框的回调函数
   * @returns {Element|null} 最佳输入框或null
   */
  selectBestInput(inputs, isElementVisibleCallback, isMessageInputCallback) {
    if (inputs.length === 0) return null;
    if (inputs.length === 1) return inputs[0];
    
    // 优先选择可见的输入框
    const visibleInputs = isElementVisibleCallback ? 
      inputs.filter(input => isElementVisibleCallback(input)) : inputs;
    const candidateInputs = visibleInputs.length > 0 ? visibleInputs : inputs;
    
    // 按优先级排序
    const scoredInputs = candidateInputs.map(input => {
      let score = this.calculateFocusPriorityScore(input, isElementVisibleCallback);
      
      // 8. 消息输入框优先级
      if (isMessageInputCallback && isMessageInputCallback(input)) {
        score += 80;
      }
      
      return { input, score };
    });
    
    // 按分数降序排序
    scoredInputs.sort((a, b) => b.score - a.score);
    
    console.log('输入框优先级排序:', scoredInputs.map(item => ({
      element: item.input,
      score: item.score,
      tag: item.input.tagName,
      type: item.input.type,
      placeholder: item.input.placeholder
    })));
    
    return scoredInputs[0].input;
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FocusManagement;
} else {
  window.FocusManagement = FocusManagement;
}