/**
 * 预览模块 - 负责话术预览浮层的创建、显示和隐藏
 */
class PreviewModule {
  constructor(chatListWidget) {
    this.widget = chatListWidget.widget;
    this.chatListWidget = chatListWidget;
    this.previewLayer = null;
    this.hidePreviewTimeout = null;
  }

  /**
   * 创建预览浮层
   */
  createPreviewLayer() {
    console.log('创建预览浮层');
    
    const previewHTML = `
      <div class="preview-layer" id="script-preview-layer">
        <div class="preview-content">
          <div class="preview-header">
            <div class="preview-title"></div>
            <div class="preview-actions">
               <button class="cls-btn-edit-preview" title="编辑"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.75 9.75V15C15.75 15.4142 15.4142 15.75 15 15.75H3C2.58579 15.75 2.25 15.4142 2.25 15V3C2.25 2.58579 2.58579 2.25 3 2.25H8.25" stroke="#333333" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.25 10.02V12.75H7.99395L15.75 4.99054L13.0107 2.25L5.25 10.02Z" stroke="#333333" stroke-width="0.75" stroke-linejoin="round"/></svg></button>
             </div>
          </div>
          <div class="preview-group"></div>
          <div class="preview-note"></div>
          <div class="preview-text"></div>
        </div>
      </div>
    `;
    
    // 添加预览浮层到页面
    document.body.insertAdjacentHTML('beforeend', previewHTML);
    this.previewLayer = document.getElementById('script-preview-layer');
    
    // 绑定预览浮层事件
    this.bindPreviewEvents();
    
    console.log('预览浮层创建完成');
  }

  /**
   * 绑定预览浮层事件
   */
  bindPreviewEvents() {
    if (!this.previewLayer) return;
    
    // 鼠标进入预览浮层时添加hover类
    this.previewLayer.addEventListener('mouseenter', () => {
      // console.log('鼠标进入预览浮层');
      this.previewLayer.classList.add('hover');
      // 清除延迟隐藏定时器
      if (this.hidePreviewTimeout) {
        clearTimeout(this.hidePreviewTimeout);
        this.hidePreviewTimeout = null;
      }
    });
    
    // 鼠标离开预览浮层时移除hover类并延迟隐藏
    this.previewLayer.addEventListener('mouseleave', () => {
      // console.log('鼠标离开预览浮层');
      this.previewLayer.classList.remove('hover');
      // 延迟隐藏预览浮层
      this.hidePreviewTimeout = setTimeout(() => {
        this.hidePreview();
      }, 200);
    });
  }

  /**
   * 显示预览
   */
  showPreview(scriptItem) {
    // console.log('showPreview 被调用');
    const title = scriptItem.dataset.title;
    const content = scriptItem.dataset.content;
    const note = scriptItem.dataset.note || '';
    const groupId = scriptItem.dataset.groupId;
    const scriptId = scriptItem.dataset.id;
    
    if (!title || !content) {
      console.log('缺少标题或内容，退出预览');
      return;
    }
    // console.log('显示预览:', title);
    
    // 更新预览内容
    this.previewLayer.querySelector('.preview-title').textContent = title;
    
    // 显示分组信息
    const groupElement = this.previewLayer.querySelector('.preview-group');
    const group = this.chatListWidget.groups.find(g => g.id === groupId);
    if (group) {
      groupElement.innerHTML = `<span class="group-tag" style="background-color: ${group.color}">${group.name}</span>`;
      groupElement.style.display = 'block';
    } else {
      groupElement.style.display = 'none';
    }
    
    const noteElement = this.previewLayer.querySelector('.preview-note');
    if (note) {
      noteElement.textContent = note;
      noteElement.style.display = 'block';
    } else {
      noteElement.style.display = 'none';
    }
    this.previewLayer.querySelector('.preview-text').textContent = content;
    
    // 绑定编辑按钮事件
    const editBtn = this.previewLayer.querySelector('.cls-btn-edit-preview');
    editBtn.onclick = () => {
      this.hidePreview();
      const script = this.chatListWidget.scripts.find(s => s.id === scriptId);
      if (script) {
        this.chatListWidget.showEditScriptModal(script);
      } else {
        console.error('未找到对应的话术:', scriptId);
      }
    };
    
    // 先显示预览浮层以获取实际尺寸（但设置为不可见）
    this.previewLayer.style.visibility = 'hidden';
    this.previewLayer.style.opacity = '0';
    this.previewLayer.style.display = 'block';
    
    // 计算位置
    const itemRect = scriptItem.getBoundingClientRect();
    const widgetRect = this.widget.getBoundingClientRect();
    
    // 获取预览浮层的实际尺寸
    const previewRect = this.previewLayer.getBoundingClientRect();
    const previewWidth = previewRect.width;
    const previewHeight = previewRect.height;
    
    // 预览浮层右对齐，距离主界面5px
    let left = widgetRect.right + 5;
    let top = itemRect.top;
    
    // 检查是否会超出右边界
    if (left + previewWidth > window.innerWidth) {
      // 显示在左侧
      left = widgetRect.left - previewWidth - 5;
    }
    
    // 检查是否会超出下边界
    if (top + previewHeight > window.innerHeight) {
      top = window.innerHeight - previewHeight - 10;
    }
    
    // 检查是否会超出上边界
    if (top < 10) {
      top = 10;
    }
    
    // 设置最终位置并正常显示
    this.previewLayer.style.left = left + 'px';
    this.previewLayer.style.top = top + 'px';
    // 清除临时样式并添加visible类
    this.previewLayer.style.visibility = '';
    this.previewLayer.style.opacity = '';
    this.previewLayer.style.display = '';
    this.previewLayer.classList.add('visible');
    // console.log('预览浮层已显示，visible类已添加');
  }

  /**
   * 隐藏预览
   */
  hidePreview() {
    if (!this.previewLayer.classList.contains('hover')) {
      this.previewLayer.classList.remove('visible');
    }
  }

  /**
   * 强制隐藏预览浮层（用于主面板mouseleave事件）
   */
  forceHidePreview() {
    console.log('forceHidePreview 被调用');
    // 清除延迟隐藏定时器
    if (this.hidePreviewTimeout) {
      clearTimeout(this.hidePreviewTimeout);
      this.hidePreviewTimeout = null;
    }
    // 清除所有样式并移除CSS类
    this.previewLayer.style.visibility = '';
    this.previewLayer.style.opacity = '';
    this.previewLayer.style.display = '';
    this.previewLayer.classList.remove('visible', 'hover');
    console.log('预览浮层已隐藏，visible类已移除');
  }

  /**
   * 销毁预览模块
   */
  destroy() {
    if (this.previewLayer) {
      this.previewLayer.remove();
      this.previewLayer = null;
    }
    if (this.hidePreviewTimeout) {
      clearTimeout(this.hidePreviewTimeout);
      this.hidePreviewTimeout = null;
    }
  }
}