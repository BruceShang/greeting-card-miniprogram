// components/open-process/open-process.ts
Component({
  /**
   * 组件的属性列表
   */
  properties: {},

  /**
   * 组件的初始数据
   */
  data: {},

  /**
   * 组件的方法列表
   */
  methods: {
    onSendShare() {
      // 触发父组件的关闭事件
      this.triggerEvent("close");
    },
    // 预览图片
    previewImage(e: any) {
      const { url } = e.currentTarget.dataset;
      wx.previewImage({
        current: url,
        urls: [url],
      });
    },
  },
});
