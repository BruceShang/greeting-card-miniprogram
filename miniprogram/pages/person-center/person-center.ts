import { storage } from "../../utils/storage";

Page({
  /**
   * 页面的初始数据
   */
  data: {
    userInfoDetail: {}, // 用户信息
    openProcessShow: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {},

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    const userFlag = storage.get("USER_FLAG", false);
    const userInfoDetail: any = storage.get("USER_INFO_DETAIL", {});
    if (userFlag) {
      this.setData({
        userInfoDetail: userInfoDetail,
      });
      return;
    }
    this.getUserInfo();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {},

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {},

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {},
  // 获取 - 贺卡正文 - 内容
  async getUserInfo() {
    try {
      wx.showLoading({ title: "加载中" });
      const { result } = await wx.cloud.callFunction({
        name: "user",
        data: {
          type: "getUserInfo",
        },
      });

      // 数据预处理
      if (result.success) {
        const userInfoDetail = result.data;
        storage.set("USER_FLAG", true, 30 * 60);
        storage.set("USER_INFO_DETAIL", userInfoDetail);
        this.setData({
          userInfoDetail,
        });
      }
    } catch (err) {
      console.error(err);
      wx.showToast({
        title: "加载失败，请重试",
        icon: "error",
      });
    } finally {
      wx.hideLoading();
      this.setData({
        loading: false,
      });
    }
  },
  goEditUser() {
    wx.navigateTo({
      url: "/pages/edit-user/edit-user",
    });
  },
  goPage(e: any) {
    const type = e.currentTarget.dataset.type;
    let url = "";
    console.log(type, "---type");
    switch (type) {
      case "sendCard":
        url = "/pages/send-card/send-card";
        break;
      case "favorite":
        url = "/pages/card-favorites/card-favorites";
        break;

      case "received":
        url = "/pages/received-list/received-list";
        break;
      case "feedback":
        url = "/pages/problem-feedback/problem-feedback";
        break;
      case "aboutUs":
        url = "/pages/about-us/about-us";
        break;
      // case "vip":
      //   url = "/pages/card-vip/card-vip";
      //   break;
      default:
        break;
    }
    wx.navigateTo({
      url,
    });
  },
  handleTabBar(e: any) {
    const type = e.currentTarget.dataset.type;
    let url = "";
    console.log(type, "---type");
    switch (type) {
      case "home":
        url = "/pages/index/index";
        break;
      case "favorite":
        url = "/pages/card-favorites/card-favorites";
        break;
      case "sendCard":
        url = "/pages/send-card/send-card";
        break;
      case "person":
        url = "/pages/person-center/person-center";
        break;
      default:
        break;
    }
    // wx.navigateTo({
    wx.reLaunch({
      url,
    });
  },
  // 点击 贺卡正文 底部按钮
  handleOpenProcess() {
    this.setData({
      openProcessShow: true,
    });
  },
  handleOpenProcessCancel() {
    this.setData({
      openProcessShow: false,
    });
  },
});
