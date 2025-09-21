/**
 * API模块索引文件
 * 导出所有API相关功能
 */

// 导入火山引擎API模块
const volcanoAPI = require('./volcanoAPI');

// 导出所有API功能
module.exports = {
  // 火山引擎API功能
  getRecipeRecommendations: volcanoAPI.getRecipeRecommendations,
  uploadRecipesOneByOne: volcanoAPI.uploadRecipesOneByOne,
  getRecipesFromDatabase: volcanoAPI.getRecipesFromDatabase,
  getRecipeDetail: volcanoAPI.getRecipeDetail,
  
  // 辅助函数
  generatePrompt: volcanoAPI.generatePrompt,
  parseRecipeResponse: volcanoAPI.parseRecipeResponse,
  processRecipes: volcanoAPI.processRecipes
}; 