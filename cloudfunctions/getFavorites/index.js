// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'cloud1-0gb51bqmd479e34c'
})

const db = cloud.database()
const favoritesCollection = db.collection('favorites')
const recipesCollection = db.collection('recipes')
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  // 分页参数
  const page = event.page || 1
  const pageSize = event.pageSize || 10
  const skip = (page - 1) * pageSize
  
  try {
    // 获取用户收藏列表
    const favoritesResult = await favoritesCollection
      .where({
        _openid: openid
      })
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get()
    
    // 获取收藏总数
    const countResult = await favoritesCollection
      .where({
        _openid: openid
      })
      .count()
    
    const total = countResult.total
    const favorites = favoritesResult.data
    
    // 如果没有收藏，直接返回空数组
    if (favorites.length === 0) {
      return {
        success: true,
        message: '获取收藏列表成功',
        data: [],
        page,
        pageSize,
        total,
        hasMore: skip + favorites.length < total
      }
    }
    
    // 获取收藏的食谱ID列表
    const recipeIds = favorites.map(favorite => favorite.recipeId)
    
    // 获取食谱详情
    const recipesResult = await recipesCollection
      .where({
        _id: _.in(recipeIds)
      })
      .get()
    
    const recipes = recipesResult.data
    
    // 将食谱详情与收藏信息合并
    const favoritesWithRecipes = favorites.map(favorite => {
      const recipe = recipes.find(recipe => recipe._id === favorite.recipeId) || {}
      return {
        ...favorite,
        recipe
      }
    })
    
    return {
      success: true,
      message: '获取收藏列表成功',
      data: favoritesWithRecipes,
      page,
      pageSize,
      total,
      hasMore: skip + favorites.length < total
    }
  } catch (error) {
    console.error('获取收藏列表失败', error)
    return {
      success: false,
      message: '获取收藏列表失败',
      error: error
    }
  }
} 