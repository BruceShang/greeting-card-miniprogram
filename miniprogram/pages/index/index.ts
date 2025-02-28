import { storage } from "../../utils/storage";

Page({
  data: {
    show: false,
    imageUrl: "",
    overlayStyle: {
      border: "1px red solid",
      background: "none",
    },
    statusBarHeight: 0,
    categories: [],
    hotCards: [],
    categoryCards: {},
    currentCategory: "all",
    loading: true,
    userInfoDetail: {}, // 用户信息详情
    openProcessShow: false,
    // 搜索
    searchKey: "",
  },

  onLoad() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ["shareAppMessage", "shareTimeline"],
    });
    this.loadHomeData();
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
  // updateFieldQuery() {
  //   wx.cloud.callFunction({
  //     name: "updateField",
  //     data: {
  //       fieldToUpdate: "isVIP", // 要更新的字段名
  //       newValue: false, // 新的字段值
  //       queryCondition: {
  //         // 查询条件
  //         isVIP: true,
  //         categoryId: "02b3d02c67a566b602461fa44e28fd6a",
  //       },
  //     },
  //     success: (res) => {
  //       console.log("批量更新成功", res.result);
  //     },
  //     fail: (err) => {
  //       console.error("批量更新失败", err);
  //     },
  //   });
  // },
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

  async loadHomeData() {
    try {
      wx.showLoading({ title: "加载中" });
      const cache = storage.get("HOME_DATA", {});
      if (cache.categoryCards) {
        this.setData({ ...cache });
        return;
      }

      const { result } = await wx.cloud.callFunction({
        name: "getHomeData",
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      // 数据预处理
      const { categories, hotCards, categoryCards } = result.data;

      // 3. 更新缓存
      if (result.success) {
        storage.set("HOME_DATA", result.data, 30 * 60);
      }
      // 更新状态
      this.setData({
        categories,
        hotCards,
        categoryCards,
        // loading: false,
      });
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
  onSearchInput(e) {
    const searchKey = e.detail.value.trim().toLowerCase();
    this.setData({ searchKey });

    // 当搜索关键字为空时，切换到"全部"分类
    if (!searchKey) {
      this.handleCategoryChange({
        currentTarget: {
          dataset: { category: "all" },
        },
      });
      return;
    }

    // 在 categories 数组中查找匹配项
    const matchedCategory = this.data.categories.find((category) => {
      // 匹配分类名称
      if (category.name.toLowerCase().includes(searchKey)) {
        return true;
      }
      // // 如果分类有描述字段，也进行匹配
      // if (category.description && category.description.toLowerCase().includes(searchKey)) {
      //   return true;
      // }
      // // 如果分类有标签字段，也进行匹配
      // if (category.tags && Array.isArray(category.tags)) {
      //   return category.tags.some(tag => tag.toLowerCase().includes(searchKey));
      // }
      return false;
    });

    if (matchedCategory) {
      this.handleCategoryChange({
        currentTarget: {
          dataset: { category: matchedCategory._id },
        },
      });
    }
  },
  // 切换分类
  handleCategoryChange(e: any) {
    const category = e.currentTarget.dataset.category;
    this.setData({
      currentCategory: category,
    });
  },
  // 收藏/取消收藏
  async handleLike(e: any) {
    const templateId = e.currentTarget.dataset.id;

    try {
      wx.showLoading({ title: "加载中" });

      const { result } = await wx.cloud.callFunction({
        name: "toggleFavorite",
        data: {
          templateId,
        },
      });
      if (result.success) {
        // 清除缓存
        storage.remove("HOME_DATA");
        // 更新数据
        this.loadHomeData();
        // 显示操作结果
        wx.showToast({
          title: result.isLiked ? "收藏成功" : "取消收藏",
          icon: "success",
        });
      }
    } catch (err) {
      console.log(err, "---err");
      wx.showToast({
        title: "操作失败",
        icon: "error",
      });
    } finally {
      wx.hideLoading();
    }
  },
  navigateToCardList(e: any) {
    const type = e.currentTarget.dataset.type;
    const name = e.currentTarget.dataset.name;
    wx.navigateTo({
      url: `/pages/card-list/card-list?type=${type}&name=${name}`,
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
          show: false,
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
    // 更新本地存储
    storage.set("CARD_ITEM_INFO", item);
    // coverUrl
    this.setData({
      imageUrl: item.coverUrl,
      show: true,
    });
    console.log(item, "-----item");
  },
  handleColseDialog() {
    this.setData({
      show: false,
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
  onCloseOpenProcess() {
    this.setData({
      openProcessShow: false,
    });
  },
});
