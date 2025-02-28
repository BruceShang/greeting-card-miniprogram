const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const db = cloud.database();

  const { cardId } = event;

  try {
    // 验证权限
    const card = await db
      .collection("CardReceive")
      .where({
        _id: cardId,
        userId: wxContext.OPENID,
      })
      .get();

    if (!card.data.length) {
      return {
        success: false,
        error: "无权限删除该贺卡",
      };
    }

    // 执行删除
    await db.collection("CardReceive").doc(cardId).remove();

    return {
      success: true,
    };
  } catch (err) {
    console.error("[云函数] [deleteCardReceive] 调用失败：", err);
    return {
      success: false,
      error: err,
    };
  }
};
