import { storage } from "../../utils/storage";

Page({
  /**
   * 页面的初始数据
   */
  data: {
    popularCards: [],
    pageNum: 1,
    pageSize: 15,
    total: 0,
    loading: false,
    hasMore: true,
    dialogShow: false,
    imageUrl: "",
    openProcessShow: false,
    userInfoDetail: {},
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    this.loadFavorites();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    const userInfoDetail: any = storage.get("USER_INFO_DETAIL", {});
    if (userInfoDetail.nickName) {
      this.setData({
        userInfoDetail: userInfoDetail,
      });
    } else {
      this.getUserInfo();
    }
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
  async onPullDownRefresh() {
    this.setData({
      popularCards: [],
      pageNum: 1,
      hasMore: true,
    });

    await this.loadFavorites();
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    if (this.data.hasMore) {
      this.loadFavorites();
    }
  },

  /**
   * 用户点击右上角分享
   */
  async onShareAppMessage() {
    try {
      // 更新分享次数
      const { result } = await wx.cloud.callFunction({
        name: "user",
        data: {
          type: "updateShareCount",
        },
      });

      console.log(result, "----------------onShareAppMessage");
      if (result.success) {
        // 如果成为VIP，显示提示
        if (result.data.isVIP) {
          const userInfoDetail: any = storage.get("USER_INFO_DETAIL", {});

          if (userInfoDetail.nickName) {
            userInfoDetail.isVIP = true;

            this.setData({
              userInfoDetail,
            });
            storage.set("USER_INFO_DETAIL", userInfoDetail);
          }
          // wx.showModal({
          //   title: "成功",
          //   content: "恭喜成为VIP会员！",
          // });
        }
      }
    } catch (err) {
      console.error("更新分享次数失败：", err);
    }
    return {
      title: "往来贺卡",
      path: "pages/index/index",
    };
  },

  // 获取用户资料信息
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

  // 加载收藏数据
  async loadFavorites() {
    if (!this.data.hasMore || this.data.loading) return;

    this.setData({ loading: true });

    try {
      const { result } = await wx.cloud.callFunction({
        name: "favoriteList",
        data: {
          pageNum: this.data.pageNum,
          pageSize: this.data.pageSize,
        },
      });

      if (result.success) {
        const { list, total } = result.data;
        const newCards = [...this.data.popularCards, ...list];

        this.setData({
          popularCards: newCards,
          total,
          hasMore: newCards.length < total,
          pageNum: this.data.pageNum + 1,
        });
      } else {
        wx.showToast({
          title: "加载失败",
          icon: "error",
        });
      }
    } catch (err) {
      console.error("加载收藏失败：", err);
      wx.showToast({
        title: "加载失败",
        icon: "error",
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 取消收藏
  async handleUnlike(e: any) {
    const templateId = e.currentTarget.dataset.id;
    try {
      const { result } = await wx.cloud.callFunction({
        name: "toggleFavorite",
        data: { templateId },
      });

      if (result.success) {
        // 从列表中移除
        const popularCards = this.data.popularCards.filter(
          (card: any) => card._id !== templateId
        );

        this.setData({ popularCards });
        storage.remove("HOME_DATA");
        wx.showToast({
          title: "取消收藏成功",
          icon: "success",
        });
      }
    } catch (err) {
      console.error("取消收藏失败：", err);
      wx.showToast({
        title: "操作失败",
        icon: "error",
      });
    }
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
  // 去使用
  handleGoUse() {
    const _this = this;
    wx.navigateTo({
      url: "/pages/card-use/card-use",
      success: function () {
        _this.setData({
          dialogShow: false,
        });
      },
    });
  },
  handleOpenDialog(e: any) {
    const item = e.currentTarget.dataset.item;
    if (!this.data.userInfoDetail.isVIP && item.isVIP) {
      this.handleOpenProcess();
      return;
    }
    // console.log(item, "-----item");
    // 更新本地存储
    storage.set("CARD_ITEM_INFO", item);
    // coverUrl
    this.setData({
      imageUrl: item.coverUrl,
      dialogShow: true,
    });
    console.log(item, "-----item");
  },
  handleColseDialog() {
    this.setData({
      dialogShow: false,
    });
  },
  // 打开 开通流程弹窗
  handleOpenProcess() {
    this.setData({
      openProcessShow: true,
    });
  },
  // 关闭 开通流程弹窗
  handleOpenProcessCancel() {
    this.setData({
      openProcessShow: false,
    });
  },
});
