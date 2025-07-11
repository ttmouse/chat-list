/**
 * 通用工具函数模块 - 消除重复的工具代码
 * 遵循奥卡姆剃刀原理：统一常用功能，避免重复实现
 */
class CommonUtils {
  
  /**
   * 通用的调试模式管理
   */
  static createDebugManager() {
    return {
      debugMode: false,
      
      setDebugMode(enabled) {
        this.debugMode = enabled;
        console.log(`🔧 调试模式: ${enabled ? '开启' : '关闭'}`);
      },
      
      log(...args) {
        if (this.debugMode) {
          console.log('🐛 [DEBUG]', ...args);
        }
      },
      
      warn(...args) {
        if (this.debugMode) {
          console.warn('⚠️ [DEBUG]', ...args);
        }
      },
      
      error(...args) {
        if (this.debugMode) {
          console.error('❌ [DEBUG]', ...args);
        }
      }
    };
  }

  /**
   * 通用的状态检查器
   */
  static createStateChecker() {
    return {
      /**
       * 检查扩展上下文是否有效
       */
      isExtensionContextValid() {
        try {
          return !!(chrome && chrome.runtime && chrome.runtime.id);
        } catch (error) {
          return false;
        }
      },

      /**
       * 检查DOM元素是否存在且有效
       */
      isElementValid(element) {
        return element && 
               element.nodeType === Node.ELEMENT_NODE && 
               document.contains(element);
      },

      /**
       * 检查对象是否为空
       */
      isEmpty(obj) {
        if (obj == null) return true;
        if (Array.isArray(obj)) return obj.length === 0;
        if (typeof obj === 'object') return Object.keys(obj).length === 0;
        if (typeof obj === 'string') return obj.trim().length === 0;
        return false;
      },

      /**
       * 安全的属性访问
       */
      safeGet(obj, path, defaultValue = null) {
        try {
          const keys = path.split('.');
          let result = obj;
          for (const key of keys) {
            if (result == null || typeof result !== 'object') {
              return defaultValue;
            }
            result = result[key];
          }
          return result !== undefined ? result : defaultValue;
        } catch (error) {
          return defaultValue;
        }
      }
    };
  }

  /**
   * 通用的DOM操作工具
   */
  static createDOMUtils() {
    return {
      /**
       * 安全的querySelector
       */
      safeQuery(selector, context = document) {
        try {
          return context.querySelector(selector);
        } catch (error) {
          console.warn('querySelector 失败:', selector, error);
          return null;
        }
      },

      /**
       * 安全的querySelectorAll
       */
      safeQueryAll(selector, context = document) {
        try {
          return Array.from(context.querySelectorAll(selector));
        } catch (error) {
          console.warn('querySelectorAll 失败:', selector, error);
          return [];
        }
      },

      /**
       * 创建元素并设置属性
       */
      createElement(tag, attributes = {}, textContent = '') {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
          if (key === 'className') {
            element.className = value;
          } else if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
          } else {
            element.setAttribute(key, value);
          }
        });
        
        if (textContent) {
          element.textContent = textContent;
        }
        
        return element;
      },

      /**
       * 安全的事件绑定
       */
      safeAddEventListener(element, event, handler, options = {}) {
        if (!this.isElementValid(element)) {
          console.warn('尝试为无效元素绑定事件:', element);
          return null;
        }
        
        try {
          element.addEventListener(event, handler, options);
          return () => element.removeEventListener(event, handler, options);
        } catch (error) {
          console.error('事件绑定失败:', error);
          return null;
        }
      },

      /**
       * 检查元素是否有效
       */
      isElementValid(element) {
        return element && 
               element.nodeType === Node.ELEMENT_NODE && 
               document.contains(element);
      }
    };
  }

  /**
   * 通用的错误处理器
   */
  static createErrorHandler() {
    return {
      /**
       * 安全执行函数
       */
      async safeExecute(fn, context = null, ...args) {
        try {
          const result = context ? fn.apply(context, args) : fn(...args);
          return result instanceof Promise ? await result : result;
        } catch (error) {
          console.error('函数执行失败:', error);
          return null;
        }
      },

      /**
       * 带重试的异步执行
       */
      async executeWithRetry(fn, maxRetries = 3, delay = 1000) {
        let lastError;
        
        for (let i = 0; i < maxRetries; i++) {
          try {
            return await fn();
          } catch (error) {
            lastError = error;
            console.warn(`执行失败，第 ${i + 1} 次重试:`, error);
            
            if (i < maxRetries - 1) {
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        }
        
        throw lastError;
      },

      /**
       * 创建错误边界
       */
      createErrorBoundary(operation, fallback = null) {
        return (...args) => {
          try {
            const result = operation(...args);
            return result instanceof Promise ? 
              result.catch(error => {
                console.error('异步操作失败:', error);
                return fallback;
              }) : result;
          } catch (error) {
            console.error('同步操作失败:', error);
            return fallback;
          }
        };
      }
    };
  }

  /**
   * 通用的性能优化工具
   */
  static createPerformanceUtils() {
    return {
      /**
       * 防抖函数
       */
      debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
          const later = () => {
            timeout = null;
            if (!immediate) func.apply(this, args);
          };
          const callNow = immediate && !timeout;
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
          if (callNow) func.apply(this, args);
        };
      },

      /**
       * 节流函数
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
      },

      /**
       * 批量处理
       */
      batch(items, batchSize = 10, processor) {
        const batches = [];
        for (let i = 0; i < items.length; i += batchSize) {
          batches.push(items.slice(i, i + batchSize));
        }
        return batches.map(batch => processor(batch));
      },

      /**
       * 延迟执行
       */
      delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
      }
    };
  }

  /**
   * 创建完整的工具集合
   */
  static createToolkit() {
    return {
      debug: this.createDebugManager(),
      state: this.createStateChecker(),
      dom: this.createDOMUtils(),
      error: this.createErrorHandler(),
      performance: this.createPerformanceUtils()
    };
  }
}