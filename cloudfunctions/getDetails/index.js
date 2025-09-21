// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'cloud1-0gb51bqmd479e34c'  // 使用实际的环境ID
})

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  try {
    console.log('云函数开始执行，原始参数:', event)
    console.log('用户openid:', openid)
    
    // 获取菜谱ID（支持多种参数名）
    const recipeId = event.recipeId || event.id || event._id
    
    if (!recipeId) {
      console.log('菜谱ID为空')
      return {
        success: false,
        message: '菜谱ID不能为空'
      }
    }
    
    console.log('开始获取菜谱详情，使用ID:', recipeId)
    
    // 获取菜谱详情
    try {
      // 先尝试直接通过_id查询
      let recipeResult = null
      try {
        recipeResult = await db.collection('recipes').doc(recipeId).get()
        console.log('通过doc()查询结果:', recipeResult)
      } catch (docErr) {
        console.log('doc()查询失败，尝试where查询:', docErr)
        // 如果直接查询失败，尝试使用where查询
        recipeResult = await db.collection('recipes').where({
          _id: recipeId
        }).get()
        console.log('通过where查询结果:', recipeResult)
      }
      
      if (!recipeResult || !recipeResult.data || (Array.isArray(recipeResult.data) && recipeResult.data.length === 0)) {
        console.log('菜谱不存在，查询结果:', recipeResult)
        return {
          success: false,
          message: '菜谱不存在'
        }
      }
      
      // 处理查询结果
      const recipe = Array.isArray(recipeResult.data) ? recipeResult.data[0] : recipeResult.data
      console.log('获取到的菜谱数据:', recipe)
      
      // 检查是否已收藏
      const favoriteResult = await db.collection('favorites')
        .where({
          _openid: openid,
          recipeId: recipeId
        })
        .get()
      
      const isFavorite = favoriteResult.data.length > 0
      console.log('收藏状态:', isFavorite)
      
      // 更新菜谱的浏览次数
      try {
        await db.collection('recipes').doc(recipe._id).update({
          data: {
            viewCount: _.inc(1)
          }
        })
        console.log('浏览次数更新成功')
      } catch (err) {
        console.error('更新浏览次数失败:', err)
      }
      
      // 获取评论列表
      let comments = []
      try {
        const commentsResult = await db.collection('comments')
          .where({
            recipeId: recipeId
          })
          .orderBy('createTime', 'desc')
          .limit(10)
          .get()
        
        comments = commentsResult.data || []
        console.log('获取到的评论数:', comments.length)
      } catch (err) {
        console.error('获取评论列表失败:', err)
      }
      
      // 返回处理后的数据
      const result = {
        success: true,
        message: '获取菜谱详情成功',
        data: {
          ...recipe,
          isFavorite,
          comments
        }
      }
      
      console.log('返回数据:', result)
      return result
      
    } catch (err) {
      console.error('查询菜谱详情失败:', err)
      return {
        success: false,
        message: '查询菜谱详情失败',
        error: err
      }
    }
    
  } catch (error) {
    console.error('云函数执行失败:', error)
    return {
      success: false,
      message: '云函数执行失败',
      error: error
    }
  }
} 