// Zalo页面输入框检测调试脚本
// 在浏览器控制台中运行此脚本来调试输入框检测问题

console.log('=== Zalo页面输入框检测调试 ===');

// 复制扩展中的检测逻辑
function isValidInputElement(element) {
  if (!element) return false;
  
  // 检查元素是否可见
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden') {
    return false;
  }
  
  // 检查元素尺寸
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
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
  
  return false;
}

function isMessageInput(element) {
  if (!element) return false;
  
  // 检查是否为明显的搜索相关输入框
  const searchKeywords = ['search', '搜索', 'find', '查找', '筛选', 'filter', 'query'];
  
  // 检查placeholder
  const placeholder = element.placeholder || '';
  if (searchKeywords.some(keyword => placeholder.toLowerCase().includes(keyword.toLowerCase()))) {
    return false;
  }
  
  // 检查aria-label
  const ariaLabel = element.getAttribute('aria-label') || '';
  if (searchKeywords.some(keyword => ariaLabel.toLowerCase().includes(keyword.toLowerCase()))) {
    return false;
  }
  
  // 检查class名称
  const className = element.className || '';
  if (searchKeywords.some(keyword => className.toLowerCase().includes(keyword.toLowerCase()))) {
    return false;
  }
  
  // 检查父元素的class或id
  const parent = element.parentElement;
  if (parent) {
    const parentClass = parent.className || '';
    const parentId = parent.id || '';
    if (searchKeywords.some(keyword => 
      parentClass.toLowerCase().includes(keyword.toLowerCase()) ||
      parentId.toLowerCase().includes(keyword.toLowerCase())
    )) {
      return false;
    }
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
  const messageKeywords = ['message', '消息', 'comment', '评论', 'chat', '聊天', 'reply', '回复'];
  if (messageKeywords.some(keyword => 
    placeholder.toLowerCase().includes(keyword.toLowerCase()) ||
    ariaLabel.toLowerCase().includes(keyword.toLowerCase()) ||
    className.toLowerCase().includes(keyword.toLowerCase())
  )) {
    return true;
  }
  
  // 默认允许通过，除非明确是搜索框
  return true;
}

function findValidInputs() {
  const selectors = [
    'textarea:not([readonly]):not([disabled])',
    'input[type="text"]:not([readonly]):not([disabled])',
    'input[type="search"]:not([readonly]):not([disabled])',
    'input[type="url"]:not([readonly]):not([disabled])',
    'input[type="email"]:not([readonly]):not([disabled])',
    'input:not([type]):not([readonly]):not([disabled])',
    '[contenteditable="true"]',
    'div[role="textbox"]',
    'div[contenteditable="true"]',
    'div[data-text="true"]',
    '.input_area',
    '.chat_textarea',
    '#chat-input-container-id',
    '#chat-input-container-id input',
    '#chat-input-container-id textarea',
    '#chat-input-container-id [contenteditable="true"]',
    '#chat-input-container-id [role="textbox"]',
    '[role="textbox"]',
    '[aria-label*="消息"]',
    '[aria-label*="message"]',
    '[aria-label*="评论"]',
    '[aria-label*="comment"]',
    '[placeholder*="消息"]',
    '[placeholder*="message"]',
    '[placeholder*="评论"]',
    '[placeholder*="comment"]'
  ];
  
  const inputs = [];
  selectors.forEach(selector => {
    try {
      document.querySelectorAll(selector).forEach(input => {
        // 排除插件自身的输入框
        if (!ChatListUtils.closest(input, '#chat-list-widget') && isValidInputElement(input) && isMessageInput(input)) {
          inputs.push(input);
        }
      });
    } catch (e) {
      console.warn('选择器错误:', selector, e);
    }
  });
  
  return inputs;
}

// 开始调试
console.log('1. 检查页面URL:', window.location.href);
console.log('2. 检查页面标题:', document.title);

// 检查所有输入相关元素
const allInputs = document.querySelectorAll('input, textarea, [contenteditable="true"], [role="textbox"]');
console.log(`3. 页面总共有 ${allInputs.length} 个输入相关元素:`);

allInputs.forEach((input, index) => {
  const rect = input.getBoundingClientRect();
  const style = window.getComputedStyle(input);
  const isValid = isValidInputElement(input);
  const isMessage = isMessageInput(input);
  
  console.log(`元素 ${index + 1}:`, {
    tagName: input.tagName,
    type: input.type || 'N/A',
    id: input.id || 'N/A',
    className: input.className || 'N/A',
    placeholder: input.placeholder || 'N/A',
    contentEditable: input.contentEditable,
    role: input.getAttribute('role') || 'N/A',
    visible: style.display !== 'none' && style.visibility !== 'hidden',
    size: `${Math.round(rect.width)}x${Math.round(rect.height)}`,
    readOnly: input.readOnly,
    disabled: input.disabled,
    isValidElement: isValid,
    isMessageInput: isMessage,
    finalResult: isValid && isMessage,
    element: input
  });
});

// 使用扩展的检测逻辑
const validInputs = findValidInputs();
console.log(`4. 扩展检测到 ${validInputs.length} 个有效输入框:`, validInputs);

// 检查特定的Zalo选择器
console.log('5. 检查Zalo特定选择器:');
const zaloSelectors = [
  '#chat-input-container-id',
  '#chat-input-container-id input',
  '#chat-input-container-id textarea',
  '#chat-input-container-id [contenteditable="true"]',
  '#chat-input-container-id [role="textbox"]'
];

zaloSelectors.forEach(selector => {
  const elements = document.querySelectorAll(selector);
  console.log(`选择器 "${selector}" 找到 ${elements.length} 个元素:`, elements);
});

// 检查可能的输入框容器
console.log('6. 检查可能的输入框容器:');
const containers = document.querySelectorAll('[id*="input"], [class*="input"], [id*="chat"], [class*="chat"], [id*="message"], [class*="message"]');
console.log(`找到 ${containers.length} 个可能的容器:`);
containers.forEach((container, index) => {
  console.log(`容器 ${index + 1}:`, {
    tagName: container.tagName,
    id: container.id || 'N/A',
    className: container.className || 'N/A',
    element: container
  });
});

// 检查当前焦点元素
const activeElement = document.activeElement;
console.log('7. 当前焦点元素:', {
  tagName: activeElement ? activeElement.tagName : 'null',
  id: activeElement ? activeElement.id : 'N/A',
  className: activeElement ? activeElement.className : 'N/A',
  isValidElement: activeElement ? isValidInputElement(activeElement) : false,
  isMessageInput: activeElement ? isMessageInput(activeElement) : false,
  element: activeElement
});

// 提供手动测试函数
window.debugZaloInput = {
  findValidInputs,
  isValidInputElement,
  isMessageInput,
  highlightInputs: function() {
    // 清除之前的高亮
    document.querySelectorAll('.debug-highlight').forEach(el => {
      el.classList.remove('debug-highlight');
      el.style.border = '';
      el.style.backgroundColor = '';
    });
    
    // 高亮有效输入框
    const inputs = findValidInputs();
    inputs.forEach(input => {
      input.classList.add('debug-highlight');
      input.style.border = '3px solid red';
      input.style.backgroundColor = 'yellow';
    });
    
    console.log(`高亮了 ${inputs.length} 个有效输入框`);
    return inputs;
  },
  clearHighlight: function() {
    document.querySelectorAll('.debug-highlight').forEach(el => {
      el.classList.remove('debug-highlight');
      el.style.border = '';
      el.style.backgroundColor = '';
    });
    console.log('清除了所有高亮');
  },
  testFill: function(text = '测试填充内容') {
    const inputs = findValidInputs();
    if (inputs.length === 0) {
      console.log('未找到可填充的输入框');
      return;
    }
    
    const input = inputs[0];
    console.log('尝试填充到:', input);
    
    if (input.tagName.toLowerCase() === 'input' || input.tagName.toLowerCase() === 'textarea') {
      input.value = text;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (input.contentEditable === 'true') {
      input.textContent = text;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    console.log('填充完成');
  }
};

console.log('调试完成！可以使用以下函数进行进一步测试:');
console.log('- debugZaloInput.highlightInputs() // 高亮显示有效输入框');
console.log('- debugZaloInput.clearHighlight() // 清除高亮');
console.log('- debugZaloInput.testFill("测试文本") // 测试填充内容');
console.log('- debugZaloInput.findValidInputs() // 获取有效输入框列表');