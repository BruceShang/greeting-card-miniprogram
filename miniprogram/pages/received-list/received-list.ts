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
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    this.loadReceivedList();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {},

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

    await this.loadReceivedList();
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    if (this.data.hasMore) {
      this.loadReceivedList();
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {},
  // 格式化日期
  formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  },
  // 加载收藏数据
  async loadReceivedList() {
    if (!this.data.hasMore || this.data.loading) return;

    this.setData({ loading: true });

    try {
      const { result } = await wx.cloud.callFunction({
        name: "cardReceive",
        data: {
          type: "getList",
          pageNum: this.data.pageNum,
          pageSize: this.data.pageSize,
        },
      });

      if (result.success) {
        const { list, total } = result.data;
        // 格式化时间
        const formattedList = list.map((item) => ({
          ...item,
          receiveTime: this.formatDate(item.createdAt),
        }));

        const newCards = [...this.data.popularCards, ...formattedList];

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
  handleDelete(e) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: "提示",
      content: "确定要删除这张领取的贺卡吗？",
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: "删除中..." });
          try {
            const result = await wx.cloud.callFunction({
              name: "deleteReceivedCard",
              data: { cardId: id },
            });

            console.log(result.result, "----result.result");
            if (result.result.success) {
              wx.showToast({ title: "删除成功" });
              // 从列表中移除已删除的贺卡
              const popularCards = this.data.popularCards.filter(
                (card: any) => card._id !== id
              );
              this.setData({
                popularCards,
                total: this.data.total - 1,
              });
            } else {
              wx.showToast({
                title: "删除失败",
                icon: "error",
              });
            }
          } catch (err) {
            console.error("删除失败：", err);
            wx.showToast({
              title: "删除失败",
              icon: "error",
            });
          } finally {
            wx.hideLoading();
          }
        }
      },
    });
  },
  goCardResult(e: any) {
    const item = e.currentTarget.dataset.item;
    wx.navigateTo({
      url: `/pages/card-result/card-result?shareCardId=${item.cardId}&userId=${item.shareUserId}&pageType=receivedList`,
    });
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
});
