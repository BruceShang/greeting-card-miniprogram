const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

exports.main = async (event, context) => {
  const { templateId } = event;
  const wxContext = cloud.getWXContext();
  const db = cloud.database();
  const _ = db.command;

  try {
    // 1. 直接开启事务，在事务中进行所有操作
    const transaction = await db.startTransaction();
    try {
      // 2. 在事务中尝试删除收藏记录
      const removeRes = await transaction
        .collection("Favorite")
        .where({
          userId: wxContext.OPENID,
          templateId: templateId,
        })
        .remove();

      // 3. 根据删除结果判断操作类型
      const isFavorited = removeRes.stats.removed > 0;

      // 4. 更新模板收藏状态
      await transaction
        .collection("Template")
        .doc(templateId)
        .update({
          data: {
            likeCount: _.inc(isFavorited ? -1 : 1),
            // isLiked: !isFavorited, // 是否收藏，需要根据 Favorite 集合数据查询
            updateTime: db.serverDate(),
          },
        });

      // 5. 如果是新增收藏，添加收藏记录
      if (!isFavorited) {
        await transaction.collection("Favorite").add({
          data: {
            userId: wxContext.OPENID,
            templateId: templateId,
            createTime: db.serverDate(),
          },
        });
      }

      // 6. 提交事务
      await transaction.commit();

      return {
        success: true,
        isLiked: !isFavorited,
      };
    } catch (err) {
      // 事务回滚
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error("[云函数] [toggleFavorite] 调用失败：", err);
    return {
      success: false,
      error: err,
    };
  }
};
