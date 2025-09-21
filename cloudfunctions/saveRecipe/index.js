// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'cloud1-0gb51bqmd479e34c'
})

const db = cloud.database()
const recipesCollection = db.collection('recipes')

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  // 检查是否为批量保存
  if (event.recipes && Array.isArray(event.recipes)) {
    return await batchSaveRecipes(event.recipes, openid, event.isAdmin);
  }
  
  // 单个菜谱保存逻辑（保持原有功能）
  const recipeData = event.recipe || {}
  
  if (!recipeData.name) {
    return {
      success: false,
      message: '食谱名称不能为空'
    }
  }
  
  // 准备食谱数据
  const recipe = {
    name: recipeData.name,
    image: recipeData.image || '',
    time: recipeData.time || '',
    calories: recipeData.calories || '',
    tag: recipeData.tag || '',
    ingredients: recipeData.ingredients || [],
    steps: recipeData.steps || [],
    benefits: recipeData.benefits || '',
    categories: recipeData.categories || [],
    tags: recipeData.tags || [],
    isRecommended: recipeData.isRecommended || false,
    rating: recipeData.rating || 0,
    createdBy: openid,
    updateTime: db.serverDate()
  }
  
  try {
    // 如果有ID，更新现有食谱
    if (recipeData._id) {
      // 检查是否是创建者
      const recipeResult = await recipesCollection.doc(recipeData._id).get()
      
      if (!recipeResult.data) {
        return {
          success: false,
          message: '食谱不存在'
        }
      }
      
      // 只有创建者或管理员可以更新
      if (recipeResult.data.createdBy !== openid && !event.isAdmin) {
        return {
          success: false,
          message: '无权限更新此食谱'
        }
      }
      
      // 更新食谱
      await recipesCollection.doc(recipeData._id).update({
        data: recipe
      })
      
      return {
        success: true,
        message: '食谱更新成功',
        recipeId: recipeData._id
      }
    } else {
      // 创建新食谱
      recipe.createTime = db.serverDate()
      
      const result = await recipesCollection.add({
        data: recipe
      })
      
      return {
        success: true,
        message: '食谱创建成功',
        recipeId: result._id
      }
    }
  } catch (error) {
    console.error('保存食谱失败', error)
    return {
      success: false,
      message: '保存食谱失败',
      error: error
    }
  }
}

/**
 * 批量保存多个食谱
 * @param {Array} recipes - 食谱数组
 * @param {String} openid - 用户openid
 * @param {Boolean} isAdmin - 是否为管理员
 * @returns {Object} - 保存结果
 */
async function batchSaveRecipes(recipes, openid, isAdmin) {
  if (!recipes || recipes.length === 0) {
    return {
      success: false,
      message: '没有提供食谱数据'
    }
  }
  
  try {
    const results = [];
    const errors = [];
    
    // 处理每个食谱
    for (const recipeData of recipes) {
      if (!recipeData.name) {
        errors.push({
          recipe: recipeData,
          error: '食谱名称不能为空'
        });
        continue;
      }
      
      // 准备食谱数据
      const recipe = {
        name: recipeData.name,
        image: recipeData.image || '',
        time: recipeData.time || '',
        calories: recipeData.calories || '',
        tag: recipeData.tag || '',
        ingredients: recipeData.ingredients || [],
        steps: recipeData.steps || [],
        benefits: recipeData.benefits || '',
        categories: recipeData.categories || [],
        tags: recipeData.tags || [],
        isRecommended: recipeData.isRecommended || false,
        rating: recipeData.rating || 0,
        createdBy: openid,
        updateTime: db.serverDate(),
        createTime: db.serverDate()
      }
      
      try {
        // 添加新食谱
        const result = await recipesCollection.add({
          data: recipe
        });
        
        results.push({
          success: true,
          recipeId: result._id,
          name: recipe.name
        });
      } catch (error) {
        console.error('保存食谱失败', error);
        errors.push({
          recipe: recipeData,
          error: error
        });
      }
    }
    
    return {
      success: true,
      message: `成功保存${results.length}个食谱，失败${errors.length}个`,
      results: results,
      errors: errors
    }
  } catch (error) {
    console.error('批量保存食谱失败', error);
    return {
      success: false,
      message: '批量保存食谱失败',
      error: error
    }
  }
} 