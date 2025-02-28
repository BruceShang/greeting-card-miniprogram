// 云函数入口文件
const cloud = require("wx-server-sdk");
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

// 云函数入口函数
exports.main = async (event, context) => {
  const db = cloud.database();
  const collection = db.collection("Template"); // 替换为你的集合名称
  const fieldToUpdate = event.fieldToUpdate; // 要更新的字段名
  const newValue = event.newValue; // 新的字段值
  const queryCondition = event.queryCondition; // 查询条件

  try {
    // 查询符合条件的记录
    const res = await collection.where(queryCondition).get();

    // 批量更新
    const updatePromises = res.data.map(async (item) => {
      return await collection.doc(item._id).update({
        data: {
          [fieldToUpdate]: newValue,
        },
      });
    });

    // 等待所有更新操作完成
    await Promise.all(updatePromises);

    return {
      success: true,
      updatedCount: res.data.length,
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      error: err,
    };
  }
};
