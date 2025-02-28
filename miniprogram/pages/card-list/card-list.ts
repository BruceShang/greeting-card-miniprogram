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
    categoryId: "",
    isHot: false as any,
    navigationTitle: "贺卡列表",
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(query) {
    if (query.type) {
      this.data.isHot = query.type === "hot" ? true : null;
      this.data.categoryId = query.type !== "hot" ? query.type : "";

      this.loadCardList();
    }

    if (query.name) {
      this.setData({
        navigationTitle: query.name,
      });
    }
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

    await this.loadCardList();
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    if (this.data.hasMore) {
      this.loadCardList();
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {},

  // 加载收藏数据
  async loadCardList() {
    if (!this.data.hasMore || this.data.loading) return;

    this.setData({ loading: true });

    const params = {
      categoryId: this.data.categoryId,
    };
    const params2 = {
      isHot: this.data.isHot,
    };

    const resultParams = this.data.isHot ? params2 : params;

    try {
      const { result } = await wx.cloud.callFunction({
        name: "getCardListById",
        data: {
          pageNum: this.data.pageNum,
          pageSize: this.data.pageSize,
          ...resultParams,
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

  // 处理收藏/取消收藏
  async handleLike(e: any) {
    const templateId = e.currentTarget.dataset.id;
    const index = e.currentTarget.dataset.index;

    try {
      wx.showLoading({ title: "加载中" });

      const { result } = await wx.cloud.callFunction({
        name: "toggleFavorite",
        data: { templateId },
      });

      if (result.success) {
        // 直接更新当前卡片的收藏状态
        this.setData({
          [`popularCards[${index}].isLiked`]: result.isLiked,
          [`popularCards[${index}].likeCount`]:
            this.data.popularCards[index].likeCount + (result.isLiked ? 1 : -1),
        });

        wx.showToast({
          title: result.isLiked ? "收藏成功" : "取消收藏",
          icon: "success",
        });
      }
    } catch (err) {
      console.error("收藏操作失败：", err);
      wx.showToast({
        title: "操作失败",
        icon: "error",
      });
    } finally {
      wx.hideLoading();
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
    // if (!this.data.userInfoDetail.isVIP && item.isVIP) {
    //   this.handleOpenProcess();
    //   return;
    // }
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
