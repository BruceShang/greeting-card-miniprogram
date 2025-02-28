// components/birthday-cake/birthday-cake.ts
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

  },

  /**
   * 组件的方法列表
   */
  methods: {

  },

  observers: {
    'show': function(show) {
      if (show) {
        // 可以在这里添加显示时的逻辑
      }
    }
  }
})