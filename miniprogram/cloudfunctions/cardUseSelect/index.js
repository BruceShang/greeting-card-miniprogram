// 云函数入口文件
const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }); // 使用当前云环境

// 获取贺卡分类和祝福语
async function getCardTitleSelect(event, context) {
  const { categoryId } = event;

  const db = cloud.database();
  try {
    // 1. 获取分类列表
    // const categoriesRes = await db
    //   .collection("Category")
    //   .orderBy("sort", "asc")
    //   .get();

    // 2. 获取祝福短语
    // const greetingTitles = {};
    // for (const category of categoriesRes.data) {
    //   const cardsRes = await db
    //     .collection("GreetingTitle")
    //     .where({
    //       categoryId: category._id,
    //     })
    //     .orderBy("createdAt", "desc")
    //     .limit(6)
    //     .get();
    //   greetingTitles[category.name] = cardsRes.data;
    // }
    console.log(categoryId, "---categoryId----99");
    const greetingTitles = await db
      .collection("GreetingTitle")
      .where({
        categoryId: categoryId,
      })
      .orderBy("createdAt", "desc")
      .get();
    console.log(greetingTitles, "---greetingTitles----99");
    return {
      success: true,
      data: {
        greetingTitles: greetingTitles.data || [],
      },
    };
  } catch (err) {
    console.error("[云函数] [getHomeData] 调用失败：", err);
    return {
      success: false,
      error: err,
    };
  }
}
// 获取贺卡内容下拉
async function getCardContentSelect(event, context) {
  const { categoryId } = event;

  const db = cloud.database();
  try {
    const greetingContents = await db
      .collection("GreetingContent")
      .where({
        categoryId: categoryId,
      })
      .orderBy("createdAt", "desc")
      .get();
    return {
      success: true,
      data: {
        greetingContents: greetingContents.data || [],
      },
    };
  } catch (err) {
    console.error("[云函数] [getHomeData] 调用失败：", err);
    return {
      success: false,
      error: err,
    };
  }
}

// 格式化日期为 'YYYY-MM-DD HH:mm:ss' 格式
// function formatDateTime() {
//   const date = new Date()
//   const year = date.getFullYear()
//   const month = String(date.getMonth() + 1).padStart(2, '0')
//   const day = String(date.getDate()).padStart(2, '0')
//   const hour = String(date.getHours()).padStart(2, '0')
//   const minute = String(date.getMinutes()).padStart(2, '0')
//   const second = String(date.getSeconds()).padStart(2, '0')

//   return `${year}-${month}-${day} ${hour}:${minute}:${second}`
// }

// 保存用户编辑的贺卡
async function saveUserCard(event, context) {
  const { cardData } = event;
  const wxContext = cloud.getWXContext();
  const db = cloud.database();

  try {
    // 1. 获取模板信息
    // const template = await db
    //   .collection("templates")
    //   .doc(cardData.templateId)
    //   .get();
    // const currentTime = formatDateTime();

    // 2. 保存用户贺卡
    const result = await db.collection("UserCard").add({
      data: {
        userId: wxContext.OPENID, // 用户ID
        templateId: cardData.templateId, // 模板ID
        coverUrl: cardData.coverUrl, // 封面图片
        title: cardData.title, // 贺卡标题
        musicUrl: cardData.musicUrl, // 贺卡标题
        content: cardData.content, // 贺卡正文
        animations: cardData.animations, // 动画特效
        // createTime: currentTime, // 创建时间
        // updateTime: currentTime, // 更新时间
        createdAt: db.serverDate(), // 创建时间
        updatedAt: db.serverDate(), // 更新时间
      },
    });

    return {
      success: true,
      data: {
        cardId: result._id,
      },
    };
  } catch (err) {
    console.error("[saveUserCard] 调用失败：", err);
    return {
      success: false,
      error: err,
    };
  }
}

// 查询用户编辑的贺卡
async function queryUserCard(event, context) {
  const wxContext = cloud.getWXContext();
  const { shareCardId } = event;
  const db = cloud.database();

  try {
    // 1. 检查是否已经领取过，如果领取过，则返回领取记录
    const receivedData = await db
      .collection("CardReceive")
      .where({
        cardId: shareCardId,
        userId: wxContext.OPENID,
      })
      .get();

    if (receivedData.data.length > 0) {
      return {
        success: true,
        data: (receivedData.data && receivedData.data[0]) || {},
      };
    }

    // 2. 查询未领取的贺卡信息
    const result = await db
      .collection("UserCard")
      .where({
        _id: shareCardId,
      })
      .get();

    return {
      success: true,
      data: (result.data && result.data[0]) || {},
    };
  } catch (err) {
    console.error("[queryUserCard] 调用失败：", err);
    return {
      success: false,
      error: err,
    };
  }
}
// 云函数入口函数
exports.main = async (event, context) => {
  const { type } = event;

  // 根据type参数调用对应的处理函数
  switch (type) {
    case "getCardTitleSelect":
      return await getCardTitleSelect(event, context);

    case "getCardContentSelect":
      return await getCardContentSelect(event, context);

    case "saveUserCard":
      return await saveUserCard(event, context);

    case "queryUserCard":
      return await queryUserCard(event, context);

    default:
      return {
        success: false,
        error: "未知的操作类型",
      };
  }
};
