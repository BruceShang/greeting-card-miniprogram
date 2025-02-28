import { storage } from "../../utils/storage";

Page({
  /**
   * 页面的初始数据
   */
  data: {
    dyShow: false,
    contentShow: false,
    dynamicEffectList: [
      {
        title: "璀璨烟花",
        name: "yh",
      },
      {
        title: "红包雨",
        name: "hby",
        imgUrl:
          "https://6772-greeting-card-7glxmbnm2fb7705b-1334247811.tcb.qcloud.la/icons/red-packet.png?sign=db95fa21ada6d21b90e257f59c25eb2c&t=1737428215",
        imageWith: "80",
        imageHeight: "80",
      },
      {
        title: "恭喜发财",
        name: "gxfc",
        imgUrl:
          "https://6772-greeting-card-7glxmbnm2fb7705b-1334247811.tcb.qcloud.la/icons/yuanbao.png?sign=cc2ed284fd8eda88c972d8b04bfce194&t=1737428702",
        imageWith: "80",
        imageHeight: "56",
      },
      {
        title: "新春大吉",
        name: "xcdj",
        imgUrl:
          "https://6772-greeting-card-7glxmbnm2fb7705b-1334247811.tcb.qcloud.la/icons/xinchun.png?sign=6d818687730700caaebc594aaac73ada&t=1737428883",
        imageWith: "80",
        imageHeight: "80",
      },
      {
        title: "新年送福",
        name: "xnsf",
        imgUrl:
          "https://6772-greeting-card-7glxmbnm2fb7705b-1334247811.tcb.qcloud.la/icons/fu-02.png?sign=32754002a65563c9ae7c8193e4717d65&t=1737428842",
        imageWith: "80",
        imageHeight: "80",
      },
      {
        title: "SpaceX火箭",
        name: "hj",
        isVIP: true,
      },
      {
        title: "生日蛋糕",
        name: "dg",
        isVIP: true,
      },
    ],
    rainParams: {
      imgUrl: "",
      imageWith: "",
      imageHeight: "",
    },
    dynamicEffectShow: false,
    dynamicCellValue: [], // // 动画特效 - value
    dynamicCellLabel: "", // 动画特效 - label
    autosize: {
      minHeight: 60,
    },
    title: "",
    musicUrl: "",
    content: "",
    showRain: false,
    showRocket: false,
    showCake: false,
    showFireworks: false,
    fireworks: [] as Array<{
      id: number;
      left: number;
      active: boolean;
    }>,
    fireworkCount: 0,
    batchCount: 0, // 添加批次计数
    cardItemInfo: {} as any, // 卡片信息
    greetingContents: [], // content
    greetingTitles: [], // title
    shareImage: "",
    shareCardId: "",
    openId: "",
    userInfoDetail: {}, // 用户信息详情
    openProcessShow: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad() {
    this.getOpenId();
    wx.showShareMenu({
      withShareTicket: true,
      menus: ["shareAppMessage", "shareTimeline"],
    });

    const cardItemInfo: any = storage.get("CARD_ITEM_INFO", {});
    this.setData({
      shareImage: cardItemInfo.coverUrl,
      cardItemInfo,
    });
    this.getGreetingTitleData();
    this.getGreetingContentData();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {},

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
   * 用户点击右上角分享
   */
  async onShareAppMessage() {
    try {
      wx.showLoading({ title: "加载中" });

      let finalShareCardId = this.data.shareCardId;

      // 如果没有 shareCardId，先保存卡片
      if (!finalShareCardId) {
        const { result } = await wx.cloud.callFunction({
          name: "cardUseSelect",
          data: {
            type: "saveUserCard",
            cardData: {
              title: this.data.title,
              musicUrl: this.data.musicUrl,
              content: this.data.content,
              templateId: this.data.cardItemInfo._id,
              coverUrl: this.data.cardItemInfo.coverUrl,
              animations: this.data.dynamicCellValue,
            },
          },
        });

        if (result.success) {
          finalShareCardId = result.data.cardId;
          // 立即更新 shareCardId，确保后续逻辑使用最新值
          this.setData({ shareCardId: finalShareCardId });
        } else {
          throw new Error("保存卡片失败");
        }
      }

      // 更新分享次数
      const { result: shareCountResult } = await wx.cloud.callFunction({
        name: "user",
        data: { type: "updateShareCount" },
      });

      if (shareCountResult.success && shareCountResult.data.isVIP) {
        const userInfoDetail = storage.get("USER_INFO_DETAIL", {});
        if (userInfoDetail.nickName) {
          userInfoDetail.isVIP = true;
          this.setData({ userInfoDetail });
          storage.set("USER_INFO_DETAIL", userInfoDetail);
        }
      }

      // 返回分享配置，直接使用 finalShareCardId（避免依赖 this.data.shareCardId 的异步更新）
      return {
        title: this.data.title,
        path: `pages/card-result/card-result?shareCardId=${finalShareCardId}&userId=${this.data.openId}`,
        imageUrl: this.data.shareImage,
      };
    } catch (error) {
      console.error("分享处理失败：", error);
      return {
        title: this.data.title,
        path: "pages/index/index",
        imageUrl: this.data.shareImage,
      };
    } finally {
      wx.hideLoading();
    }
  },
  // 获取 - 贺卡正文 - 内容
  async getOpenId() {
    try {
      const { result } = await wx.cloud.callFunction({
        name: "getOpenId",
      });
      this.setData({
        openId: result.openid,
      });
      console.log(result, "------result");
    } catch (err) {
      wx.showToast({
        title: "加载失败，请重试",
        icon: "error",
      });
    }
  },
  // 获取 - 贺卡正文 - 内容
  async getGreetingContentData() {
    if (!this.data.cardItemInfo.categoryId) {
      wx.showToast({
        title: "categoryId不能为空！",
        icon: "error",
      });
      return;
    }
    try {
      wx.showLoading({ title: "加载中" });
      const { result } = await wx.cloud.callFunction({
        name: "cardUseSelect",
        data: {
          type: "getCardContentSelect",
          categoryId: this.data.cardItemInfo.categoryId,
        },
      });

      // 数据预处理
      if (result.success) {
        const { greetingContents } = result.data;
        this.setData({
          greetingContents,
          content:
            (greetingContents.length > 0 && greetingContents[0]["content"]) ||
            "",
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
  // 获取 - 贺卡标题 - 内容
  async getGreetingTitleData() {
    if (!this.data.cardItemInfo.categoryId) {
      wx.showToast({
        title: "categoryId不能为空！",
        icon: "error",
      });
      return;
    }
    try {
      wx.showLoading({ title: "加载中" });
      const { result } = await wx.cloud.callFunction({
        name: "cardUseSelect",
        data: {
          type: "getCardTitleSelect",
          categoryId: this.data.cardItemInfo.categoryId,
        },
      });
      console.log(result, "-----------greetingTitles");
      // 数据预处理
      if (result.success) {
        const { greetingTitles } = result.data;
        this.setData({
          greetingTitles,
          title:
            (greetingTitles.length > 0 && greetingTitles[0]["title"]) || "",
          musicUrl:
            (greetingTitles.length > 0 && greetingTitles[0]["MusicUrl"]) || "",
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
  },
  back() {
    console.log("----wx.navigateBack");
    wx.navigateBack({
      delta: 1,
      fail: (err) => {
        this.home();
        console.log(err, "--------err");
      },
      success: (err) => {
        console.log(err, "--------success");
      },
    });
  },

  // 点击 动画特效 底部按钮
  handleDynamicEffect() {
    this.setData({
      dynamicEffectShow: true,
    });
  },
  // 点击 贺卡正文 底部按钮
  handleContent() {
    this.setData({
      contentShow: true,
    });
  },
  // 打开 开通流程弹窗
  handleOpenProcess() {
    this.setData({
      dynamicEffectShow: false, // 关闭动画特效弹窗
      openProcessShow: true,
    });
  },
  // 关闭 开通流程弹窗
  handleOpenProcessCancel() {
    this.setData({
      openProcessShow: false,
    });
  },
  // 切换分类
  handleCellDy(e: any) {
    const item = e.currentTarget.dataset.item;

    if (!this.data.userInfoDetail.isVIP && item.isVIP) {
      this.handleOpenProcess();
      return;
    }
    this.setData({
      dynamicCellLabel: item.title,
      dynamicCellValue: [item.name],
      dynamicEffectShow: false,
    });
    // 默认不播放
    // this.dynamicEffectPlay(item.name);
  },
  dynamicEffectPlay(type) {
    switch (type) {
      case "hby":
        this.handleEffect();
        break;
      case "fd":
        this.handleEffect();
        break;
      case "yh":
        this.startFireworks();
        break;
      case "hj":
        this.startRocket();
        break;
      case "dg":
        this.startCake();
        break;
      default:
        break;
    }
  },
  handleCell(e: any) {
    const content = e.currentTarget.dataset.content;
    this.setData({
      content,
      contentShow: false,
    });
  },
  handleCancel() {
    this.setData({
      dynamicEffectShow: false,
      contentShow: false,
    });
  },

  // 点击动画特效时触发红包雨
  handleEffect() {
    console.log("触发红包雨动画");
    // 无论当前状态如何，都先关闭再打开
    this.setData({ showRain: false }, () => {
      setTimeout(() => {
        console.log("开始新的动画");
        this.setData({ showRain: true });
      }, 100);
    });
  },

  // 开始火箭动画
  startRocket() {
    this.setData({ showRocket: true });
    setTimeout(() => {
      this.setData({ showRocket: false });
    }, 4000); // 3.5秒动画 + 0.5秒缓冲
  },

  // 开始蛋糕动画
  startCake() {
    this.setData({ showCake: true });
    setTimeout(() => {
      this.setData({ showCake: false });
    }, 7500); // 5秒后自动隐藏
  },

  // 开始烟花效果
  startFireworks() {
    this.setData({
      showFireworks: true,
    });
  },

  onRainComplete() {
    console.log("动画完成");
    this.setData({ showRain: false });
  },
  onTitleChange(event) {
    this.setData({
      title: event.detail,
    });
  },
  onContentChange(event) {
    this.setData({
      content: event.detail,
    });
  },
  // 校验表单
  isSubmitForm() {
    const { title, content } = this.data;
    if (!title.trim()) {
      wx.showToast({
        title: "“贺卡标题”不能为空！",
        icon: "none",
      });
      return false;
    }
    if (!content.trim()) {
      wx.showToast({
        title: "“贺卡正文”不能为空！",
        icon: "none",
      });
      return false;
    }
    return true;
  },
  // 保存发送的卡片
  async handleCardSave() {
    try {
      // 2. 调用云函数保存
      const { result } = await wx.cloud.callFunction({
        name: "cardUseSelect",
        data: {
          type: "saveUserCard",
          cardData: {
            title: this.data.title,
            musicUrl: this.data.musicUrl,
            content: this.data.content,
            templateId: this.data.cardItemInfo._id, // 模板ID
            coverUrl: this.data.cardItemInfo.coverUrl, // 模板ID
            animations: this.data.dynamicCellValue, // 动画特效
          },
        },
      });

      console.log(result, "-----------result");
      if (result.success) {
        this.setData({
          shareCardId: result.data.cardId || "",
        });
        // wx.showToast({
        //   title: "保存成功",
        //   icon: "success",
        // });
        // 3. 跳转到预览页
        // wx.navigateTo({
        //   url: `/pages/card-result/card-result?cardId=${result.data.cardId}`,
        // });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("保存失败：", error);
      wx.showToast({
        title: "保存失败",
        icon: "error",
      });
    }
  },
  // 发送给好友
  onSend() {
    // if (this.isSubmitForm()) {
    //   this.handleCardSave();
    // }
  },
  // 跳到 - 预览页
  goPreviewPage(e: any) {
    if (this.isSubmitForm()) {
      storage.set("CARD_RESULT_INFO", {
        title: this.data.title,
        musicUrl: this.data.musicUrl,
        content: this.data.content,
        templateId: this.data.cardItemInfo._id, // 模板ID
        coverUrl: this.data.cardItemInfo.coverUrl, // 模板ID
        animations: this.data.dynamicCellValue, // 动画特效
      });
      wx.navigateTo({
        url: "/pages/card-result/card-result",
      });
    }
  },
  // 处理收藏/取消收藏
  async handleLike() {
    const templateId = this.data.cardItemInfo._id;
    wx.showLoading({ title: "加载中" });

    try {
      const { result } = await wx.cloud.callFunction({
        name: "toggleFavorite",
        data: { templateId },
      });

      if (result.success) {
        // 直接更新当前卡片的收藏状态
        this.setData({
          [`cardItemInfo.isLiked`]: result.isLiked,
          [`cardItemInfo.likeCount`]:
            this.data.cardItemInfo.likeCount + (result.isLiked ? 1 : -1),
        });
        storage.set("CARD_ITEM_INFO", this.data.cardItemInfo || {});

        wx.showToast({
          title: result.isLiked ? "收藏成功" : "取消收藏",
          icon: "success",
        });
        // 清除首页数据缓存
        storage.remove("HOME_DATA");
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
});
