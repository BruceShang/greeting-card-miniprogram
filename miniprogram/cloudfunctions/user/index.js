const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

// 获取用户信息
async function getUserInfo(event, context) {
  const wxContext = cloud.getWXContext();
  const db = cloud.database();
  const _ = db.command;

  const defaultData = {
    nickName: "往来",
    avatarUrl:
      "https://6772-greeting-card-7glxmbnm2fb7705b-1334247811.tcb.qcloud.la/icons/logo.png?sign=1c8453501aabeef219df20e0d716c7d2&t=1736416492",
    isVIP: false,
    shareCount: 0,
    vipCount: 0,
  };
  try {
    // 1. 只需查询一次用户数据
    const userRes = await db
      .collection("User")
      .where({
        userId: wxContext.OPENID,
      })
      .get();

    let result = {};

    if (userRes.data.length > 0) {
      // 直接使用查询结果
      result = userRes.data[0];

      // 检查VIP是否过期
      const now = new Date();
      const vipExpireTime = new Date(result.vipExpireTime);
      const isVIPExpired = now > vipExpireTime;

      // 如果VIP已过期，更新状态
      if (result.isVIP && isVIPExpired) {
        await db
          .collection("User")
          .where({ userId: wxContext.OPENID })
          .update({
            data: {
              isVIP: false,
              updateTime: db.serverDate(),
            },
          });
        result.isVIP = false;
      }
    } else {
      // 创建用户数据
      const date = db.serverDate();
      const datas = {
        ...defaultData,
        userId: wxContext.OPENID,
        userNo: Date.now().toString(),
        vipExpireTime: date,
        createTime: date,
        updateTime: date,
      };

      await db.collection("User").add({
        data: datas,
      });
      result = datas;
    }

    return {
      success: true,
      data: result,
    };
  } catch (err) {
    console.error("[云函数] [getUserInfo] 调用失败：", err);
    return {
      success: false,
      error: err,
    };
  }
}

// 更新用户信息
async function updateUserInfo(event, context) {
  const { userInfo } = event;
  const wxContext = cloud.getWXContext();
  const db = cloud.database();

  try {
    // 更新用户信息
    await db
      .collection("User")
      .where({
        userId: wxContext.OPENID,
      })
      .update({
        data: {
          avatarUrl: userInfo.avatarUrl,
          nickName: userInfo.nickName,
          updateTime: db.serverDate(),
        },
      });

    return {
      success: true,
    };
  } catch (err) {
    console.error("[updateUserInfo] 调用失败：", err);
    return {
      success: false,
      error: err,
    };
  }
}

// 根据userId获取用户信息
async function getUserInfoByUserId(event, context) {
  const { userId } = event;
  const db = cloud.database();

  try {
    if (!userId) {
      return {
        success: false,
        error: "缺少必要参数：userId",
      };
    }

    const res = await db
      .collection("User")
      .where({
        userId,
      })
      .get();

    if (!res.data || res.data.length === 0) {
      return {
        success: false,
        error: "未找到该用户信息",
      };
    }

    return {
      success: true,
      data: res.data[0],
    };
  } catch (err) {
    console.error("[getUserInfoByUserId] 调用失败：", err);
    return {
      success: false,
      error: err,
    };
  }
}

// 添加新的处理函数
async function updateShareCount(event, context) {
  const wxContext = cloud.getWXContext();
  const db = cloud.database();
  const _ = db.command;

  try {
    // 1. 获取用户当前信息
    const userRes = await db
      .collection("User")
      .where({ userId: wxContext.OPENID })
      .get();

    if (!userRes.data.length) {
      return { success: false, error: "用户不存在" };
    }

    const user = userRes.data[0];

    // 检查是否是有效会员
    const now = new Date();
    const vipExpireTime = new Date(user.vipExpireTime);
    const isVIPValid = now < vipExpireTime;

    // 如果是有效会员，不进行计数
    if (user.isVIP && isVIPValid) {
      return {
        success: true,
        data: {
          isVIP: true,
          shareCount: user.shareCount || 0,
        },
      };
    }

    // 非会员或会员已过期，进行分享计数
    const shareCount = (user.shareCount || 0) + 1;
    const updateData = { shareCount };

    // 判断是否达到VIP条件
    if (shareCount >= 3) {
      Object.assign(updateData, {
        isVIP: true,
        vipExpireTime: db.serverDate({ offset: 30 * 24 * 60 * 60 * 1000 }), // 一个月
        shareCount: 0, // 重置分享次数
        vipCount: _.inc(1), // 累计VIP次数
        updateTime: db.serverDate(),
      });
    }

    // 更新用户信息
    await db
      .collection("User")
      .where({ userId: wxContext.OPENID })
      .update({ data: updateData });

    return {
      success: true,
      data: {
        isVIP: updateData.isVIP || false,
        shareCount: updateData.shareCount || shareCount,
      },
    };
  } catch (err) {
    console.error("[updateShareCount] 调用失败：", err);
    return { success: false, error: err };
  }
}

exports.main = async (event, context) => {
  const { type } = event;

  // 根据type参数调用对应的处理函数
  switch (type) {
    case "getUserInfo":
      return await getUserInfo(event, context);

    case "updateUserInfo":
      return await updateUserInfo(event, context);

    case "getUserInfoByUserId":
      return await getUserInfoByUserId(event, context);

    case "updateShareCount":
      return await updateShareCount(event, context);

    default:
      return {
        success: false,
        error: "未知的操作类型",
      };
  }
};
