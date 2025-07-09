/**
 * 数据导入导出模块
 * 提供话术数据的导入导出功能，包括文件处理、格式验证和增量导入逻辑
 */

class DataImportExport {
  constructor(chatListWidget) {
    this.widget = chatListWidget;
  }

  /**
   * 显示导入对话框
   * 创建文件选择器并处理文件选择事件
   */
  showImportDialog() {
    // 直接创建文件输入元素并触发选择
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    
    // 文件选择处理
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.importData(e.target.files[0]);
      }
      // 清理临时元素
      document.body.removeChild(fileInput);
    });
    
    // 添加到页面并触发点击
    document.body.appendChild(fileInput);
    fileInput.click();
  }
  
  /**
   * 导入数据
   * @param {File} file - 要导入的JSON文件
   */
  async importData(file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!data.scripts || !Array.isArray(data.scripts)) {
        throw new Error('无效的数据格式');
      }
      
      // 分析导入数据
      const existingTitles = new Set(this.widget.scripts.map(script => script.title));
      const newScripts = data.scripts.filter(script => !existingTitles.has(script.title));
      const duplicateScripts = data.scripts.filter(script => existingTitles.has(script.title));
      
      // 处理分组数据
      const existingGroupIds = new Set(this.widget.groups.map(group => group.id));
      const newGroups = (data.groups || []).filter(group => !existingGroupIds.has(group.id));
      
      // 显示导入预览
      const importMessage = [
        `共 ${data.scripts.length} 个话术，${(data.groups || []).length} 个分组`,
        `新话术：${newScripts.length} 个`,
        `重复话术：${duplicateScripts.length} 个（将跳过）`,
        `新分组：${newGroups.length} 个`,
        '',
        '是否继续增量导入？'
      ].join('\n');
      
      this.widget.showConfirmDialog(
        '导入确认',
        importMessage,
        async () => {
          await this._performImport(newScripts, newGroups, duplicateScripts);
        }
      );
    } catch (error) {
      console.error('导入失败:', error);
      alert('导入失败，请检查文件格式是否正确');
    }
  }

  /**
   * 执行实际的导入操作
   * @param {Array} newScripts - 新话术列表
   * @param {Array} newGroups - 新分组列表
   * @param {Array} duplicateScripts - 重复话术列表
   * @private
   */
  async _performImport(newScripts, newGroups, duplicateScripts) {
    try {
      // 生成新的ID避免冲突
      const maxId = Math.max(0, ...this.widget.scripts.map(s => parseInt(s.id) || 0));
      newScripts.forEach((script, index) => {
        script.id = String(maxId + index + 1);
      });
      
      // 合并数据
      this.widget.scripts = [...this.widget.scripts, ...newScripts];
      this.widget.groups = [...this.widget.groups, ...newGroups];
      
      await this.widget.saveData();
      
      // 重新渲染界面
      this.widget.renderGroups();
      this.widget.renderScripts();
      
      const resultMessage = [
        '导入完成！',
        `新增话术：${newScripts.length} 个`,
        `跳过重复：${duplicateScripts.length} 个`,
        `新增分组：${newGroups.length} 个`
      ].join('\n');
      
      this.widget.showSuccessMessage(resultMessage);
    } catch (error) {
      console.error('执行导入失败:', error);
      alert('导入过程中发生错误，请稍后重试');
    }
  }

  /**
   * 导出数据
   * 将当前的话术和分组数据导出为JSON文件
   */
  exportData() {
    try {
      const exportData = {
        scripts: this.widget.scripts,
        groups: this.widget.groups,
        exportTime: new Date().toISOString(),
        version: '1.0'
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-scripts-${new Date().toISOString().split('T')[0]}.json`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      
      this.widget.showSuccessMessage('导出成功！');
      console.log('话术数据导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请稍后重试');
    }
  }

  /**
   * 验证导入数据格式
   * @param {Object} data - 要验证的数据对象
   * @returns {boolean} 是否为有效格式
   */
  validateImportData(data) {
    if (!data || typeof data !== 'object') {
      return false;
    }
    
    // 检查必需的scripts字段
    if (!data.scripts || !Array.isArray(data.scripts)) {
      return false;
    }
    
    // 检查每个话术的基本结构
    for (const script of data.scripts) {
      if (!script.title || !script.content) {
        return false;
      }
    }
    
    // 检查分组数据（可选）
    if (data.groups && !Array.isArray(data.groups)) {
      return false;
    }
    
    return true;
  }

  /**
   * 获取导入统计信息
   * @param {Object} data - 导入的数据
   * @returns {Object} 统计信息对象
   */
  getImportStats(data) {
    const existingTitles = new Set(this.widget.scripts.map(script => script.title));
    const existingGroupIds = new Set(this.widget.groups.map(group => group.id));
    
    const newScripts = data.scripts.filter(script => !existingTitles.has(script.title));
    const duplicateScripts = data.scripts.filter(script => existingTitles.has(script.title));
    const newGroups = (data.groups || []).filter(group => !existingGroupIds.has(group.id));
    
    return {
      totalScripts: data.scripts.length,
      totalGroups: (data.groups || []).length,
      newScripts: newScripts.length,
      duplicateScripts: duplicateScripts.length,
      newGroups: newGroups.length
    };
  }
}

// 导出模块（如果支持模块系统）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataImportExport;
}

// 全局访问（用于浏览器环境）
window.DataImportExport = DataImportExport;