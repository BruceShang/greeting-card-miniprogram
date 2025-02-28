// pages/problem-feedback/problem-feedback.ts
import { storage } from "../../utils/storage";

Page({
  /**
   * 页面的初始数据
   */
  data: {
    type: "",
    content: "",
    submitting: false,
    isValid: false,
    images: [] as string[], // 存储图片临时路径
    userInfoDetail: {},
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
  onPullDownRefresh() {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {},

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {},

  // 选择问题类型
  // onTypeChange(event: any) {
  //   console.log(event.detail, "----event.detail");
  //   this.setData({
  //     type: event.detail,
  //   });
  //   this.checkValidity();
  // },
  // 选择问题类型
  onTypeHandle(event: any) {
    const type = event.currentTarget.dataset.type;
    this.setData({
      type: type,
    });
    this.checkValidity();
  },

  // 问题描述变化
  onContentChange(event: any) {
    this.setData({
      content: event.detail,
    });
    this.checkValidity();
  },

  // 检查表单有效性
  checkValidity() {
    const { type, content, images } = this.data;
    console.log(type, content, images, "-----content");
    if (!type) return;
    const isValid = type !== "" && content.trim().length >= 5;
    // const isValid =
    //   type === "cooperation"
    //     ? true
    //     : type !== "cooperation" && content.trim().length >= 5;
    this.setData({ isValid });
  },

  // 选择图片
  async chooseImage() {
    try {
      const { tempFiles } = await wx.chooseMedia({
        count: 3 - this.data.images.length,
        mediaType: ["image"],
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
      });

      this.setData({
        images: [
          ...this.data.images,
          ...tempFiles.map((file) => file.tempFilePath),
        ],
      });
      this.checkValidity();
    } catch (err) {
      console.error("选择图片失败：", err);
    }
  },

  // 预览图片
  previewImage(e: any) {
    const { url } = e.currentTarget.dataset;
    wx.previewImage({
      current: url,
      urls: this.data.images,
    });
  },

  // 删除图片
  deleteImage(e: any) {
    const { index } = e.currentTarget.dataset;
    const images = [...this.data.images];
    images.splice(index, 1);
    this.setData({ images });
    this.checkValidity();
  },

  // 上传图片到云存储并获取https链接
  async uploadImages() {
    try {
      // 1. 上传图片到云存储
      const uploadTasks = this.data.images.map((filePath) =>
        wx.cloud.uploadFile({
          cloudPath: `feedback/${Date.now()}-${Math.random()
            .toString(36)
            .slice(-6)}.jpg`,
          filePath,
        })
      );

      const uploadResults = await Promise.all(uploadTasks);
      const fileIds = uploadResults.map((res) => res.fileID);

      // 2. 获取https链接
      const { fileList } = await wx.cloud.getTempFileURL({
        fileList: fileIds,
      });

      // 3. 返回https链接数组
      return fileList.map((file) => file.tempFileURL);
    } catch (err) {
      console.error("上传图片失败：", err);
      throw err;
    }
  },

  // 重置页面数据
  resetData() {
    this.setData({
      type: "",
      content: "",
      images: [],
      isValid: false,
      submitting: false,
    });
  },

  // 提交反馈
  async onSubmit() {
    if (!this.data.isValid) return;
    this.setData({ submitting: true });

    try {
      // 上传图片并获取https链接（如果有）
      const imageUrls =
        this.data.images.length > 0 ? await this.uploadImages() : [];

      const { result } = await wx.cloud.callFunction({
        name: "feedback",
        data: {
          type: "submit",
          feedback: {
            userNo: this.data.userInfoDetail.userNo || "",
            type: this.data.type,
            content: this.data.content,
            images: imageUrls,
          },
        },
      });

      if (result.success) {
        // 重置页面数据
        this.resetData();

        wx.showToast({
          title: "提交成功",
          icon: "success",
        });

        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    } catch (err) {
      console.error("提交反馈失败：", err);
      wx.showToast({
        title: "提交失败",
        icon: "error",
      });
    } finally {
      this.setData({ submitting: false });
    }
  },
});
