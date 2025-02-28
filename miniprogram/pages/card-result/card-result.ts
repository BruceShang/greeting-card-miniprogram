import { storage } from "../../utils/storage";

Page({
  /**
   * 页面的初始数据
   */
  data: {
    conStr:
      "蛇年到，福气绕。愿你的生活如灵蛇般灵动，并存! \n龙行龘龘传佳讯，蛇舞翩翩启新年。\n蛇年到，福气绕。愿你的生活如灵蛇般灵动，\n并存! 龙行龘龘传佳讯，蛇舞翩翩启新年。",
    showAnimation: false,
    cardDialogShow: false,
    isRotating: false,
    showRain: false,
    showRocket: false,
    showCake: false,
    showFireworks: false,
    cardResultInfo: {}, // 贺卡数据 - 数据源有2个；1 预览入口；2 通过分享参数 接口获取
    shareCardId: "",
    shareUserId: "", // 分享者的 openid
    pageType: "", // 为了处理”发出的贺卡“页面进入 result 页 - 返回退出的问题
    userInfoDetail: {},
    shareUserInfo: {
      avatarUrl: "",
      nickName: "",
    },
    rainParams: {
      // 红包雨 组件 - 参数配置
      imgUrl: "",
      imageWith: "",
      imageHeight: "",
    },
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(query) {
    console.log(query, "--------------query");
    if (query.shareCardId) {
      // 通过分享进入
      this.setData({
        shareCardId: query.shareCardId,
        shareUserId: query.userId,
        pageType: query.pageType,
      });
      this.getCardDetail();
    } else {
      // 预览
      const cardResultInfo = storage.get("CARD_RESULT_INFO", {});

      this.setData({
        cardResultInfo,
        cardDialogShow: true,
      });
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    const userInfoDetail: any = storage.get("USER_INFO_DETAIL", {});

    const shareCardId = this.data.shareCardId;

    console.log(userInfoDetail, shareCardId, "-----onShow");
    if (!shareCardId) {
      // 预览模式
      if (userInfoDetail.nickName) {
        // 有缓存直接取缓存数据
        this.setData({
          userInfoDetail: userInfoDetail,
          shareUserInfo: {
            avatarUrl: userInfoDetail.avatarUrl,
            nickName: userInfoDetail.nickName,
          },
        });
        return;
      }
      // 预览 && 没有用户昵称
      this.getUserInfo();
    } else {
      // 分享模式
      if (!userInfoDetail.nickName) {
        // 领取者第一次打开领取页面 -  创建自己的用户信息
        this.getUserInfo();
      }
      // 获取分享者的用户信息
      this.getUserInfoByUserId();
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    this.setData({
      showRain: false,
      showRocket: false,
      showCake: false,
      showFireworks: false,
    });
  },

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
  goEditUser() {
    wx.navigateTo({
      url: "/pages/edit-user/edit-user",
    });
  },
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
          shareUserInfo: {
            avatarUrl: userInfoDetail.avatarUrl,
            nickName: userInfoDetail.nickName,
          },
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
  // 根据userId获取 - 分享者 - 的用户信息
  async getUserInfoByUserId() {
    console.log(this.data.shareUserId, "------this.data.shareUserId");
    try {
      wx.showLoading({ title: "加载中" });
      const { result } = await wx.cloud.callFunction({
        name: "user",
        data: {
          type: "getUserInfoByUserId",
          userId: this.data.shareUserId,
        },
      });

      // 数据预处理
      if (result.success) {
        const userInfoDetail = result.data;
        // storage.set("USER_INFO_DETAIL", userInfoDetail);
        this.setData({
          shareUserInfo: {
            avatarUrl: userInfoDetail.avatarUrl,
            nickName: userInfoDetail.nickName,
          },
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
  // 获取 - 贺卡正文 - 内容
  async getCardDetail() {
    try {
      wx.showLoading({ title: "加载中" });
      const { result } = await wx.cloud.callFunction({
        name: "cardUseSelect",
        data: {
          type: "queryUserCard",
          shareCardId: this.data.shareCardId,
        },
      });

      console.log(result, "---result");
      // 数据预处理
      if (result.success) {
        const detail = result.data;

        if (!detail.title) {
          // wx.showToast({
          //   title: "贺卡已删除！",
          //   icon: "error",
          // });
          wx.showModal({
            title: "提示",
            content: "贺卡已删除！",
          });
        }
        this.setData({
          cardResultInfo: detail,
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
        cardDialogShow: true,
        loading: false,
      });
    }
  },
  // 领取贺卡
  async receiveCard() {
    try {
      const { result } = await wx.cloud.callFunction({
        name: "cardReceive",
        data: {
          type: "receivedCard",
          cardId: this.data.shareCardId,
          shareUserId: this.data.shareUserId, // 分享者的 userId
          coverUrl: this.data.cardResultInfo.coverUrl || "",
          title: this.data.cardResultInfo.title || "",
          musicUrl: this.data.cardResultInfo.musicUrl || "",
          content: this.data.cardResultInfo.content || "",
          animations: this.data.cardResultInfo.animations || [],
        },
      });

      if (!result.success) {
        wx.showToast({
          title: result.message || "领取失败",
          icon: "none",
        });
      }
    } catch (err) {
      console.log(err, "----err");
      wx.showToast({
        title: err.message || "领取失败",
        icon: "error",
      });
    }
  },
  handleOpenCard() {
    if (!this.data.cardResultInfo.title) {
      wx.showModal({
        title: "提示",
        content: "贺卡已删除！",
      });
      return;
    }
    if (this.data.shareCardId) {
      // 分享 &&  点击拆，触发领取
      this.receiveCard();
    }
    // 播放音乐
    this.playMusic();
    if (this.data.isRotating) return; // 防止动画过程中重复点击

    this.setData({ isRotating: true });

    // 监听动画结束
    setTimeout(() => {
      this.setData({ isRotating: false });
      // 执行原有的打开卡片逻辑
      this.setData({
        cardDialogShow: false,
        showAnimation: true,
      });
      this.dynamicEffectPlay();
    }, 800); // 与动画时间匹配
  },

  handleColseDialog() {
    if (
      this.data.shareCardId &&
      this.data.pageType !== "sendCard" &&
      this.data.pageType !== "receivedList"
    ) {
      // 只有分享出去的页面，操作底部关闭才会 - 退出小程序
      wx.exitMiniProgram();
      // 退出小程序
      return;
    }
    // 返回到编辑页
    this.setData({
      cardDialogShow: false,
    });
    this.back();
  },
  dynamicEffectPlay() {
    const type =
      (this.data.cardResultInfo && this.data.cardResultInfo.animations[0]) ||
      "";
    switch (type) {
      case "hby":
        // 红包雨
        this.setData({
          rainParams: {
            imgUrl:
              "https://6772-greeting-card-7glxmbnm2fb7705b-1334247811.tcb.qcloud.la/icons/red-packet.png?sign=db95fa21ada6d21b90e257f59c25eb2c&t=1737428215",
            imageWith: "80",
            imageHeight: "80",
          },
        });
        this.handleEffect();
        break;
      case "gxfc":
        // 恭喜发财
        this.setData({
          rainParams: {
            imgUrl:
              "https://6772-greeting-card-7glxmbnm2fb7705b-1334247811.tcb.qcloud.la/icons/yuanbao.png?sign=cc2ed284fd8eda88c972d8b04bfce194&t=1737428702",
            imageWith: "80",
            imageHeight: "56",
          },
        });
        this.handleEffect();
        break;
      case "xcdj":
        // 新春大吉
        this.setData({
          rainParams: {
            imgUrl:
              "https://6772-greeting-card-7glxmbnm2fb7705b-1334247811.tcb.qcloud.la/icons/xinchun.png?sign=6d818687730700caaebc594aaac73ada&t=1737428883",
            imageWith: "80",
            imageHeight: "73",
          },
        });
        this.handleEffect();
        break;
      case "xnsf":
        // 新年送福
        this.setData({
          rainParams: {
            imgUrl:
              "https://6772-greeting-card-7glxmbnm2fb7705b-1334247811.tcb.qcloud.la/icons/fu-02.png?sign=32754002a65563c9ae7c8193e4717d65&t=1737428842",
            imageWith: "80",
            imageHeight: "80",
          },
        });
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
  // 开始蛋糕动画
  startCake() {
    this.setData({ showCake: true });
    setTimeout(() => {
      this.setData({ showCake: false });
    }, 7500); // 5秒后自动隐藏
  },
  // 开始火箭动画
  startRocket() {
    this.setData({ showRocket: true });
    setTimeout(() => {
      this.setData({ showRocket: false });
    }, 4000); // 3.5秒动画 + 0.5秒缓冲
  },
  // 开始烟花效果
  startFireworks() {
    this.setData({
      showFireworks: true,
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
      },
      success: (err) => {},
    });
  },
  playMusic() {
    const bgMusic = this.selectComponent("#bgMusic");
    if (bgMusic) {
      bgMusic.togglePlay();
    }
  },
});
