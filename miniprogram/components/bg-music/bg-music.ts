Component({
  properties: {
    musicUrl: {
      type: String,
      value: "",
    },
  },

  data: {
    playerIcon:
      "cloud://greeting-card-7glxmbnm2fb7705b.6772-greeting-card-7glxmbnm2fb7705b-1334247811/icons/yinfu-icon-red.png",
    isPlaying: false,
    audioContext: null as any,
    hasUserInteraction: false,
  },

  lifetimes: {
    attached() {
      const audioContext = wx.createInnerAudioContext();
      audioContext.src = this.properties.musicUrl;
      audioContext.loop = true; // 循环播放

      // 监听播放状态
      audioContext.onPlay(() => {
        this.setData({ isPlaying: true });
      });

      audioContext.onPause(() => {
        this.setData({ isPlaying: false });
      });

      audioContext.onStop(() => {
        this.setData({ isPlaying: false });
      });

      audioContext.onError((err) => {
        console.error("音频播放错误：", err);
        wx.showToast({
          title: "音乐播放失败",
          icon: "none",
        });
      });

      this.setData({ audioContext });

      // 监听小程序切前台事件
      wx.onAppShow(() => {
        if (this.data.hasUserInteraction && this.data.isPlaying) {
          audioContext.play();
        }
      });
    },

    detached() {
      if (this.data.audioContext) {
        this.data.audioContext.destroy();
      }
    },
  },

  methods: {
    togglePlay() {
      const { audioContext } = this.data;
      this.setData({ hasUserInteraction: true });

      if (this.data.isPlaying) {
        audioContext.pause();
      } else {
        audioContext.play();
      }
    },
  },
});
