const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

exports.main = async (event, context) => {
  const db = cloud.database();
  // 复用数据库连接
  const _ = db.command;

  const { pageNum = 1, pageSize = 10, categoryId, isHot } = event;
  const skip = (pageNum - 1) * pageSize;

  try {
    // 构建查询条件
    const query = {
      categoryId: categoryId,
      isHot: isHot,
      isPublish: true,
    };
    // 并行执行列表查询和总数查询
    const [cardRes, totalRes] = await Promise.all([
      db
        .collection("Template")
        .where(query)
        .orderBy("sort", "asc")
        .orderBy("useCount", "desc")
        .orderBy("createAt", "desc")
        .skip(skip)
        .limit(pageSize)
        .get(),
      db.collection("Template").where(query).count(),
    ]);
    // // 1. 获取列表
    // const cardRes = await db
    //   .collection("Template")
    //   .where({
    //     categoryId: categoryId,
    //     isHot: isHot,
    //   })
    //   .skip(skip)
    //   .limit(pageSize)
    //   .get();

    // // 2. 获取总数
    // const totalRes = await db
    //   .collection("Template")
    //   .where({
    //     categoryId: categoryId,
    //     isHot: isHot,
    //   })
    //   .count();

    return {
      success: true,
      data: {
        list: cardRes.data,
        total: totalRes.total,
        pageNum,
        pageSize,
      },
    };
  } catch (err) {
    console.error("[云函数] [getCardListById] 调用失败：", err);
    return {
      success: false,
      error: err,
    };
  }
};
