// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'cloud1-0gb51bqmd479e34c'
})

const db = cloud.database()
const recipesCollection = db.collection('recipes')
const favoritesCollection = db.collection('favorites')
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  // 检查是否请求获取单个菜谱详情
  if (event.recipeId && event.getDetail) {
    return await getRecipeDetail(event.recipeId, openid)
  }
  
  // 检查是否请求获取所有菜单
  const getAllRecipes = event.getAllRecipes || false
  
  // 分页参数
  const page = event.page || 1
  const pageSize = event.pageSize || 50
  const skip = (page - 1) * pageSize
  
  // 筛选参数
  const category = event.category || null
  const keyword = event.keyword || null
  const recommended = event.recommended || false
  
  try {
    // 构建查询条件
    let query = {}
    
    if (category && category !== 'all') {
      query.categories = _.all([category])
    }
    
    if (keyword) {
      query = _.or([
        {
          name: db.RegExp({
            regexp: keyword,
            options: 'i'
          })
        },
        {
          ingredients: db.RegExp({
            regexp: keyword,
            options: 'i'
          })
        }
      ])
    }
    
    if (recommended) {
      query.isRecommended = true
    }
    
    // 获取用户收藏的食谱ID列表
    const favoritesResult = await favoritesCollection
      .where({
        _openid: openid
      })
      .get()
    
    const favoriteRecipeIds = favoritesResult.data.map(favorite => favorite.recipeId)
    
    // 如果请求获取所有菜单，则不进行分页
    if (getAllRecipes) {
      console.log('获取用户所有菜单，不进行分页')
      
      // 获取所有食谱
      const allRecipesResult = await recipesCollection
        .where(query)
        .orderBy('createTime', 'desc')
        .get()
      
      const allRecipes = allRecipesResult.data
      
      // 将收藏状态添加到食谱中
      const recipesWithFavorite = allRecipes.map(recipe => ({
        ...recipe,
        isFavorite: favoriteRecipeIds.includes(recipe._id)
      }))
      
      return {
        success: true,
        message: '获取所有食谱成功',
        data: recipesWithFavorite,
        total: allRecipes.length,
        hasMore: false
      }
    }
    
    // 正常分页获取食谱列表
    const recipesResult = await recipesCollection
      .where(query)
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get()
    
    // 获取食谱总数
    const countResult = await recipesCollection
      .where(query)
      .count()
    
    const total = countResult.total
    const recipes = recipesResult.data
    
    // 将收藏状态添加到食谱中
    const recipesWithFavorite = recipes.map(recipe => ({
      ...recipe,
      isFavorite: favoriteRecipeIds.includes(recipe._id)
    }))
    
    return {
      success: true,
      message: '获取食谱列表成功',
      data: recipesWithFavorite,
      page,
      pageSize,
      total,
      hasMore: skip + recipes.length < total
    }
  } catch (error) {
    console.error('获取食谱列表失败', error)
    return {
      success: false,
      message: '获取食谱列表失败',
      error: error
    }
  }
}

/**
 * 获取单个菜谱详情
 * @param {string} recipeId - 菜谱ID
 * @param {string} openid - 用户openid
 * @returns {object} - 菜谱详情
 */
async function getRecipeDetail(recipeId, openid) {
  try {
    console.log(`获取菜谱详情，ID: ${recipeId}`)
    
    // 获取菜谱详情
    const recipeResult = await recipesCollection.doc(recipeId).get()
    
    if (!recipeResult || !recipeResult.data) {
      return {
        success: false,
        message: '菜谱不存在'
      }
    }
    
    const recipe = recipeResult.data
    
    // 检查是否已收藏
    const favoriteResult = await favoritesCollection
      .where({
        _openid: openid,
        recipeId: recipeId
      })
      .get()
    
    const isFavorite = favoriteResult.data.length > 0
    
    // 更新菜谱的浏览次数
    await recipesCollection.doc(recipeId).update({
      data: {
        viewCount: _.inc(1)
      }
    }).catch(err => {
      console.error('更新浏览次数失败', err)
    })
    
    return {
      success: true,
      message: '获取菜谱详情成功',
      data: {
        ...recipe,
        isFavorite
      }
    }
  } catch (error) {
    console.error('获取菜谱详情失败', error)
    return {
      success: false,
      message: '获取菜谱详情失败',
      error: error
    }
  }
} 