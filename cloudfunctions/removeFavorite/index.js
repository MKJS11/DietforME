// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'cloud1-0gb51bqmd479e34c'
})

const db = cloud.database()
const favoritesCollection = db.collection('favorites')

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  // 获取食谱ID
  const recipeId = event.recipeId
  
  if (!recipeId) {
    return {
      success: false,
      message: '缺少食谱ID参数'
    }
  }
  
  try {
    // 查找并删除收藏
    const result = await favoritesCollection.where({
      _openid: openid,
      recipeId: recipeId
    }).remove()
    
    if (result.stats.removed > 0) {
      return {
        success: true,
        message: '取消收藏成功',
        removed: result.stats.removed
      }
    } else {
      return {
        success: false,
        message: '未找到该收藏记录',
        removed: 0
      }
    }
  } catch (error) {
    console.error('取消收藏失败', error)
    return {
      success: false,
      message: '取消收藏失败',
      error: error
    }
  }
} 