// components/rocket/rocket.ts
Component({

  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    isLaunching: false
  },

  /**
   * 组件的方法列表
   */
  methods: {

  },

  observers: {
    'show': function(show) {
      if (show) {
        // 延迟一帧添加动画类
        setTimeout(() => {
          this.setData({ isLaunching: true });
        }, 100);

        // 动画结束后触发事件
        setTimeout(() => {
          this.triggerEvent('launchComplete');
        }, 3000);
      } else {
        this.setData({ isLaunching: false });
      }
    }
  }
})