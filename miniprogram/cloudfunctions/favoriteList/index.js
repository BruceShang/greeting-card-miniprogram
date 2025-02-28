const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()
  const _ = db.command
  
  const { pageNum = 1, pageSize = 10 } = event
  const skip = (pageNum - 1) * pageSize
  
  try {
    // 并行执行收藏列表查询和总数查询
    const [favoritesRes, totalRes] = await Promise.all([
      db.collection('Favorite')
        .where({
          userId: wxContext.OPENID
        })
        .orderBy("createTime", "desc")
        .skip(skip)
        .limit(pageSize)
        .get(),
      
      db.collection('Favorite')
        .where({
          userId: wxContext.OPENID
        })
        .count()
    ])
    
    // 如果没有收藏数据，直接返回空列表
    if (!favoritesRes.data.length) {
      return {
        success: true,
        data: {
          list: [],
          total: totalRes.total,
          pageNum,
          pageSize
        }
      }
    }
    
    // 获取模板详情
    const templateIds = favoritesRes.data.map(item => item.templateId)
    const templatesRes = await db.collection('Template')
      .where({
        _id: _.in(templateIds)
      })
      .get()
    
    // 使用 Map 优化数据组装和排序
    const templatesMap = new Map(
      templatesRes.data.map(template => [template._id, template])
    )
    
    // 按照收藏时间排序组装数据
    const templates = favoritesRes.data
      .map(favorite => ({
        ...templatesMap.get(favorite.templateId),
        isLiked: true,
        createTime: favorite.createTime // 保留收藏时间用于排序
      }))
      .sort((a, b) => b.createTime - a.createTime) // 按收藏时间降序排序
      .map(({ createTime, ...rest }) => rest) // 移除 createTime 字段
    
    return {
      success: true,
      data: {
        list: templates,
        total: totalRes.total,
        pageNum,
        pageSize
      }
    }
    
  } catch (err) {
    console.error('[云函数] [getFavorites] 调用失败：', err)
    return {
      success: false,
      error: err
    }
  }
}