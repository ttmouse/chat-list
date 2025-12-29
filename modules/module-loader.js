/**
 * 通用模块加载器 - 简化模块初始化过程
 * 遵循奥卡姆剃刀原理：用一个简单的方法替代多个重复的初始化方法
 */
class ModuleLoader {
  constructor(context) {
    this.context = context;
    this.modules = new Map();
  }

  /**
   * 通用模块加载方法
   * @param {string} moduleName - 模块名称
   * @param {string} className - 全局类名
   * @param {string} propertyName - 实例属性名
   * @returns {boolean} 是否加载成功
   */
  loadModule(moduleName, className, propertyName) {
    try {
      if (window[className]) {
        const instance = new window[className](this.context);
        this.context[propertyName] = instance;
        this.modules.set(moduleName, instance);
        // console.log(`✅ ${moduleName} 模块加载成功`);
        return true;
      } else {
        console.error(`❌ ${moduleName} 模块未找到 (${className})`);
        return false;
      }
    } catch (error) {
      console.error(`❌ ${moduleName} 模块加载失败:`, error);
      return false;
    }
  }

  /**
   * 批量加载模块
   * @param {Array} moduleConfigs - 模块配置数组
   */
  loadModules(moduleConfigs) {
    const results = moduleConfigs.map(config => {
      const { name, className, property } = config;
      return {
        name,
        success: this.loadModule(name, className, property)
      };
    });

    // 统计加载结果
    const successful = results.filter(r => r.success).length;
    const total = results.length;

    // console.log(`📊 模块加载完成: ${successful}/${total} 个模块成功加载`);

    if (successful < total) {
      const failed = results.filter(r => !r.success).map(r => r.name);
      console.warn('⚠️ 未能加载的模块:', failed.join(', '));
    }

    return results;
  }

  /**
   * 获取已加载的模块实例
   * @param {string} moduleName - 模块名称
   * @returns {Object|null} 模块实例
   */
  getModule(moduleName) {
    return this.modules.get(moduleName) || null;
  }

  /**
   * 检查模块是否已加载
   * @param {string} moduleName - 模块名称
   * @returns {boolean} 是否已加载
   */
  isModuleLoaded(moduleName) {
    return this.modules.has(moduleName);
  }

  /**
   * 获取所有已加载模块的名称
   * @returns {Array} 模块名称数组
   */
  getLoadedModules() {
    return Array.from(this.modules.keys());
  }
}