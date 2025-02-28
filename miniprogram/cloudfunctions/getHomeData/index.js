const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const db = cloud.database();
  const _ = db.command;

  try {
    // 1. 并行获取分类列表和热门贺卡
    const [categoriesRes, hotCardsRes] = await Promise.all([
      db
        .collection("Category")
        .where({
          isPublish: true,
        })
        .orderBy("sort", "asc")
        .get(),
      db
        .collection("Template")
        .where({
          isHot: true,
          isPublish: true,
        })
        .orderBy("sort", "asc") // 首先按 sort 升序排序
        .orderBy("useCount", "desc") // 然后按 useCount 降序排序
        .limit(6)
        .get(),
    ]);

    // 2. 构建分类贺卡的查询任务数组
    const categoryQueries = categoriesRes.data.map((category) =>
      db
        .collection("Template")
        .where({
          categoryId: category._id,
          isPublish: true,
        })
        .orderBy("sort", "asc") // 首先按 sort 升序排序
        .orderBy("createdAt", "desc")
        .limit(6)
        .get()
    );

    // 3. 并行执行所有分类贺卡查询
    const categoryResults = await Promise.all(categoryQueries);

    // 获取用户收藏列表
    const favoriteRes = await db
      .collection("Favorite")
      .where({
        userId: wxContext.OPENID,
      })
      .get();

    // 创建收藏模板ID的Set，用于快速查找
    const favoriteSet = new Set(
      favoriteRes.data.map((item) => item.templateId)
    );

    // 4. 组装分类贺卡数据，并添加收藏状态
    const categoryCards = {};
    categoriesRes.data.forEach((category, index) => {
      categoryCards[category.name] = categoryResults[index].data.map(
        (template) => ({
          ...template,
          isLiked: favoriteSet.has(template._id),
        })
      );
    });

    return {
      success: true,
      data: {
        categories: categoriesRes.data,
        hotCards: hotCardsRes.data.map((template) => ({
          ...template,
          isLiked: favoriteSet.has(template._id),
        })),
        categoryCards,
      },
    };
  } catch (err) {
    console.error("[云函数] [getHomeData] 调用失败：", err);
    return {
      success: false,
      error: err,
    };
  }
};
