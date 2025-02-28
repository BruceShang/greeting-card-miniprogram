// components/fireworks.ts
Component({
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    maxRounds: {
      type: Number,
      value: 3
    }
  },

  data: {
    fireworks: [] as Array<{
      id: number;
      left: number;
      active: boolean;
    }>,
    fireworkCount: 0,
    currentRound: 0
  },

  observers: {
    'show': function(show) {
      if (show) {
        this.setData({ currentRound: 0 });
        this.createMultipleFireworks(4);
      } else {
        this.setData({ 
          fireworks: [],
          currentRound: 0
        });
      }
    }
  },

  methods: {
    createMultipleFireworks(count: number) {
      if (!this.data.show || this.data.currentRound >= this.data.maxRounds) {
        if (this.data.currentRound >= this.data.maxRounds) {
          this.triggerEvent('complete');
          this.setData({ show: false });
        }
        return;
      }

      // 创建新烟花前先获取当前数组
      const currentFireworks = [...this.data.fireworks];
      const newFireworks = Array.from({ length: count }, (_, i) => ({
        id: this.data.fireworkCount + i,
        left: Math.random() * 80 + 10,
        active: false
      }));

      this.setData({
        fireworks: [...currentFireworks, ...newFireworks],
        fireworkCount: this.data.fireworkCount + count
      });

      // 错开激活时间
      newFireworks.forEach((firework, index) => {
        setTimeout(() => {
          const fireworks = this.data.fireworks.map(f => {
            if (f.id === firework.id) {
              return { ...f, active: true };
            }
            return f;
          });
          
          this.setData({ fireworks });
        }, index * 200);
      });

      // 动画结束后清理并发射新的一批
      setTimeout(() => {
        if (this.data.show) {
          const remainingFireworks = this.data.fireworks.filter(f => 
            !newFireworks.find(nf => nf.id === f.id)
          );
          
          this.setData({ 
            fireworks: remainingFireworks,
            currentRound: this.data.currentRound + 1
          });
          
          // 随机发射2-4个烟花
          this.createMultipleFireworks(Math.floor(Math.random() * 3) + 2);
        }
      }, 3500);
    }
  }
});