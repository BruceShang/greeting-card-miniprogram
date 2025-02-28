Component({
  options: {
    multipleSlots: true,
    addGlobalClass: true,
  },

  properties: {
    extClass: {
      type: String,
      value: "",
    },
    title: {
      type: String,
      value: "",
    },
    background: {
      type: String,
      value: "#FFF",
    },
    color: {
      type: String,
      value: "#000",
    },
    back: {
      type: Boolean,
      value: true,
    },
    loading: {
      type: Boolean,
      value: false,
    },
    homeButton: {
      type: Boolean,
      value: false,
    },
    animated: {
      type: Boolean,
      value: true,
    },
    show: {
      type: Boolean,
      value: true,
      observer: "_showChange",
    },
    delta: {
      type: Number,
      value: 1,
    },
    fixed: {
      type: Boolean,
      value: true,
    },
    isCustomBg: {
      type: Boolean,
      value: false,
    },
  },

  data: {
    displayStyle: "",
    ios: false,
    statusBarHeight: 0,
    innerPaddingRight: "",
    leftWidth: "",
    safeAreaTop: "",
    navigationBarHeight: 0,
  },

  lifetimes: {
    attached() {
      const rect = wx.getMenuButtonBoundingClientRect();
      const systemInfo = wx.getWindowInfo();
      const appBaseInfo = wx.getAppBaseInfo();
      const deviceInfo = wx.getDeviceInfo();

      const isAndroid = deviceInfo.platform === "android";
      const isDevtools = deviceInfo.platform === "devtools";
      const statusBarHeight = systemInfo.statusBarHeight;
      const navHeight = isAndroid ? 48 : 44;
      const totalHeight = navHeight + statusBarHeight;

      this.setData({
        ios: !isAndroid,
        statusBarHeight,
        navigationBarHeight: totalHeight,
        innerPaddingRight: `padding-right: ${
          systemInfo.windowWidth - rect.left
        }px;`,
        leftWidth: `width: ${systemInfo.windowWidth - rect.left}px;`,
        safeAreaTop:
          isDevtools || isAndroid
            ? `height: calc(var(--height) + ${
                systemInfo.safeArea.top
              }px); padding-top: ${systemInfo.safeArea.top + 2}px;`
            : ``,
      });
    },
  },

  methods: {
    _showChange(show: boolean) {
      const animated = this.data.animated;
      let displayStyle = "";
      if (animated) {
        displayStyle = `opacity: ${show ? "1" : "0"};transition:opacity 0.5s;`;
      } else {
        displayStyle = `display: ${show ? "" : "none"}`;
      }
      this.setData({
        displayStyle,
      });
    },

    back() {
      const data = this.data;
      if (data.delta) {
        wx.navigateBack({
          delta: data.delta,
          fail: () => {
            this.home();
          },
        });
      }
      this.triggerEvent("back", { delta: data.delta }, {});
    },

    home() {
      wx.reLaunch({
        url: "/pages/index/index",
        fail(error) {
          console.error("返回首页失败:", error);
          wx.showToast({
            title: "返回首页失败",
            icon: "none",
          });
        },
      });
      this.triggerEvent("home", {}, {});
    },

    handleHomeNavigation() {
      try {
        wx.switchTab({
          url: "/pages/index/index",
          fail: (error) => {
            console.log("switchTab 失败，尝试 reLaunch", error);
            wx.reLaunch({
              url: "/pages/index/index",
              fail: (error) => {
                console.error("所有跳转方式都失败:", error);
                wx.showToast({
                  title: "返回首页失败",
                  icon: "none",
                });
              },
            });
          },
        });
      } catch (error) {
        console.error("跳转异常:", error);
        wx.showToast({
          title: "返回首页失败",
          icon: "none",
        });
      }
    },
  },
});
