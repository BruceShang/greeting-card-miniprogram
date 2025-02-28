// pages/edit-user/edit-user.ts
import { storage } from "../../utils/storage";

const defaultAvatarUrl =
  "https://6772-greeting-card-7glxmbnm2fb7705b-1334247811.tcb.qcloud.la/icons/logo.png?sign=1c8453501aabeef219df20e0d716c7d2&t=1736416492";

Page({
  /**
   * 页面的初始数据
   */
  data: {
    avatarUrl: defaultAvatarUrl,
    nickName: "",
    userInfoDetail: {},
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    // 获取用户现有信息
    const userInfo: any = storage.get("USER_INFO_DETAIL", {});

    if (userInfo && userInfo.nickName) {
      this.setData({
        avatarUrl: userInfo.avatarUrl || defaultAvatarUrl,
        nickName: userInfo.nickName || "",
        userInfoDetail: userInfo,
      });
    }
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
  onPullDownRefresh() {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {},

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {},
  // bindKeyInput(e) {
  //   console.log(e.detail.value, "---e.detail.value");
  //   this.setData({
  //     nickName: e.detail.value,
  //   });
  // },

  // 选择头像
  async onChooseAvatar(e: any) {
    try {
      const { avatarUrl: tempFilePath } = e.detail;

      // 1. 上传图片到云存储
      const { fileID } = await wx.cloud.uploadFile({
        cloudPath: `avatars/${Date.now()}.jpg`, // 云存储路径
        filePath: tempFilePath, // 临时文件路径
      });

      // 2. 获取永久访问地址
      const { fileList } = await wx.cloud.getTempFileURL({
        fileList: [fileID],
      });

      const avatarUrl = fileList[0].tempFileURL;
      this.setData({ avatarUrl });
    } catch (err) {
      console.error("上传头像失败：", err);
      wx.showToast({
        title: "上传头像失败",
        icon: "error",
      });
    }
  },

  // 提交表单
  async onSubmit(e: any) {
    const { nickname } = e.detail.value;

    console.log(e.detail, "----e.detail");

    if (!nickname.trim()) {
      wx.showToast({
        title: "请输入昵称",
        icon: "none",
      });
      return;
    }

    try {
      // 保存用户信息
      const userInfo = {
        avatarUrl: this.data.avatarUrl,
        nickName: nickname,
      };

      // 调用云函数更新用户信息
      const { result } = await wx.cloud.callFunction({
        name: "user",
        data: {
          type: "updateUserInfo",
          userInfo,
        },
      });

      if (result.success) {
        // 更新本地存储
        // wx.setStorageSync("EDIT_USER_INFO", userInfo);
        this.data.userInfoDetail.avatarUrl = this.data.avatarUrl;
        this.data.userInfoDetail.nickName = nickname;
        storage.set("USER_INFO_DETAIL", this.data.userInfoDetail);
        // storage.remove("USER_INFO_DETAIL");
        wx.showToast({
          title: "保存成功",
          icon: "success",
        });

        // 返回上一页
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    } catch (err) {
      console.error("保存失败：", err);
      wx.showToast({
        title: "保存失败",
        icon: "error",
      });
    }
  },
});
