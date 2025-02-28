const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const db = cloud.database();
  const _ = db.command;

  const { pageNum = 1, pageSize = 10 } = event;
  const skip = (pageNum - 1) * pageSize;

  try {
    // 1. 获取用户收藏的模板ID列表
    // .orderBy("createdAt", "desc")

    const userCardRes = await db
      .collection("UserCard")
      .where({
        userId: wxContext.OPENID,
      })
      .orderBy("createdAt", "desc")
      .skip(skip)
      .limit(pageSize)
      .get();

    // 2. 获取收藏总数
    const totalRes = await db
      .collection("UserCard")
      .where({
        userId: wxContext.OPENID,
      })
      .count();

    return {
      success: true,
      data: {
        list: userCardRes.data || [],
        total: totalRes.total,
        pageNum,
        pageSize,
      },
    };
  } catch (err) {
    console.error("[云函数] [sendCard] 调用失败：", err);
    return {
      success: false,
      error: err,
    };
  }
};
