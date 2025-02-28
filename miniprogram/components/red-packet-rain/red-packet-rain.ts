// components/red-packet-rain/red-packet-rain.ts
Component({

  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    packetCount: {
      type: Number,
      value: 20
    },
    spacing: {
      type: Number,
      value: 5
    },
    delay: {
      type: Number,
      value: 0.3
    },
    imageUrl: {
      type: String,
      value: ''
    },
    imageWidth: {
      type: Number,
      value: 60
    },
    imageHeight: {
      type: Number,
      value: 80
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    rainKey: 0
  },

  /**
   * 组件的方法列表
   */
  methods: {
    startRainRound() {
      if (!this.data.show || this.data.currentRound >= this.data.maxRounds) {
        if (this.data.currentRound >= this.data.maxRounds) {
          this.triggerEvent('complete');
        }
        return;
      }

      // 开始新一轮动画
      this.setData({
        isRaining: true,
        currentRound: this.data.currentRound + 1
      });

      // 等待当前轮次完全结束
      const lastPacketDelay = this.data.delay * (this.data.packetCount - 1);
      const animationDuration = 4000;
      const totalDuration = animationDuration + (lastPacketDelay * 1000) + 500;

      setTimeout(() => {
        if (this.data.show) {
          // 先停止当前动画
          this.setData({ 
            isRaining: false
          }, () => {
            // 短暂延迟后开始下一轮
            if (this.data.currentRound < this.data.maxRounds) {
              setTimeout(() => {
                this.startRainRound();
              }, 100);
            } else {
              this.triggerEvent('complete');
            }
          });
        }
      }, totalDuration);
    }
  },

  observers: {
    'show': function(show) {
      if (!show) {
        this.triggerEvent('complete');
      }
    }
  }
})