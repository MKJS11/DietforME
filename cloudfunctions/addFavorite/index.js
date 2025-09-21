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
    // 检查是否已收藏
    const favoriteResult = await favoritesCollection.where({
      _openid: openid,
      recipeId: recipeId
    }).get()
    
    if (favoriteResult.data && favoriteResult.data.length > 0) {
      // 已收藏，返回成功
      return {
        success: true,
        message: '该食谱已收藏',
        favorite: favoriteResult.data[0]
      }
    }
    
    // 添加收藏
    const result = await favoritesCollection.add({
      data: {
        _openid: openid,
        recipeId: recipeId,
        createTime: db.serverDate()
      }
    })
    
    return {
      success: true,
      message: '收藏成功',
      favoriteId: result._id
    }
  } catch (error) {
    console.error('添加收藏失败', error)
    return {
      success: false,
      message: '添加收藏失败',
      error: error
    }
  }
} 