App({
  globalData: {
    userInfo: undefined,
  },
  // 可以添加全局方法
  setUserInfo(userInfo: any) {
    this.globalData.userInfo = userInfo;
  },
  clearUserInfo() {
    this.globalData.userInfo = undefined;
  },
  onLaunch() {
    // 初始化云开发环境
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
    } else {
      console.log("初始化云开发环境");
      wx.cloud.init({
        env: "greeting-card-7glxmbnm2fb7705b",
        traceUser: true, // 是否记录用户访问记录
      });
    }
  },
});
