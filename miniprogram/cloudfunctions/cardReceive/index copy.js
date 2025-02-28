const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

async function receivedCard(event, wxContext) {
  const { cardId, shareUserId, title, coverUrl, content, animations } = event;
  const db = cloud.database();

  try {
    // 1. 检查是否已经领取过
    const hasReceived = await db
      .collection("CardReceive")
      .where({
        cardId,
        userId: wxContext.OPENID,
      })
      .count();

    if (hasReceived.total > 0) {
      return {
        success: true,
        message: "已经领取过了",
      };
    }

    // 2. 添加领取记录
    await db.collection("CardReceive").add({
      data: {
        cardId,
        shareUserId,
        title,
        coverUrl,
        content,
        animations,
        userId: wxContext.OPENID,
        createdAt: db.serverDate(),
      },
    });

    // 3. 更新贺卡领取数量
    const _ = db.command;
    await db
      .collection("UserCard")
      .doc(cardId)
      .update({
        data: {
          receiveCount: _.inc(1), // 递增1
        },
      });

    return {
      success: true,
      message: "领取成功",
    };
  } catch (err) {
    console.error("[receivedCard] 调用失败：", err);
    return {
      success: false,
      error: err,
    };
  }
}
async function getList(event, wxContext) {
  const { pageNum = 1, pageSize = 10 } = event;
  const db = cloud.database();
  const skip = (pageNum - 1) * pageSize;

  try {
    // 1. 先查询CardReceive表获取基础数据
    const receiveRes = await db
      .collection("CardReceive")
      .where({
        userId: wxContext.OPENID,
      })
      .skip(skip)
      .limit(pageSize)
      .orderBy("createdAt", "desc")
      .get();

    // 2. 获取所有cardId
    const cardIds = receiveRes.data.map((item) => item.cardId);

    // 3. 批量查询UserCard表获取卡片详情
    const cardRes =
      cardIds.length > 0
        ? await db
            .collection("UserCard")
            .where({
              _id: db.command.in(cardIds),
            })
            .get()
        : { data: [] };

    // 4. 组装数据
    const cardMap = new Map(cardRes.data.map((card) => [card._id, card]));
    const list = receiveRes.data.map((receive) => ({
      ...cardMap.get(receive.cardId),
      receiveTime: receive.createdAt,
      _id: receive.cardId,
      shareUserId: receive.shareUserId,
      title: cardMap.get(receive.cardId)?.title,
      coverUrl: cardMap.get(receive.cardId)?.coverUrl,
      content: cardMap.get(receive.cardId)?.content,
      receiveCount: cardMap.get(receive.cardId)?.receiveCount,
      animations: cardMap.get(receive.cardId)?.animations,
      isVIP: cardMap.get(receive.cardId)?.isVIP,
      userId: cardMap.get(receive.cardId)?.userId,
    }));

    // 5. 获取总数
    const totalRes = await db
      .collection("CardReceive")
      .where({
        userId: wxContext.OPENID,
      })
      .count();

    return {
      success: true,
      data: {
        list,
        total: totalRes.total,
        pageNum,
        pageSize,
      },
    };
  } catch (err) {
    console.error("[getReceivedCards] 调用失败：", err);
    return {
      success: false,
      error: err,
    };
  }
}

exports.main = async (event, context) => {
  const { type = "receivedCard" } = event;
  const wxContext = cloud.getWXContext();

  // 根据type执行不同操作
  switch (type) {
    case "receivedCard":
      return await receivedCard(event, wxContext);
    case "getList":
      return await getList(event, wxContext);
    default:
      return {
        success: false,
        message: "未知的操作类型",
      };
  }
};
