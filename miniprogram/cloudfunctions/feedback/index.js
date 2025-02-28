const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { type, feedback } = event;
  const wxContext = cloud.getWXContext();
  const db = cloud.database();

  if (type === "submit") {
    try {
      await db.collection("Feedback").add({
        data: {
          ...feedback,
          userId: wxContext.OPENID,
          status: "pending",
          createTime: db.serverDate(),
          createdAt: db.serverDate(),
        },
      });

      return { success: true };
    } catch (err) {
      console.error("[feedback] 提交失败：", err);
      return { success: false, error: err };
    }
  }
};
