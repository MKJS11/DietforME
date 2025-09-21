/**
 * 火山引擎大模型API模块 - 今日食谱推荐
 * 用于获取今日食谱推荐，包括早餐、午餐、晚餐、零食和饮料
 */

// API配置
const API_CONFIG = {
  url: 'https://ark.cn-beijing.volces.com/api/v3/bots/chat/completions',
  model: 'bot-20250303153853-pt5lg',
  token: '85548f3b-11af-4c08-a078-86c1865e4513',
  timeout: 30000,
  enableHttp2: false,
  enableQuic: false,
  enableCache: true,
  maxRetries: 3,
  retryDelay: 3000
};

/**
 * 根据用户信息生成提示词
 * @param {Object} userInfo - 用户信息对象
 * @returns {String} - 生成的提示词
 */
function generatePrompt(userInfo) {
  console.log('开始生成提示词，用户信息:', JSON.stringify(userInfo));
  // 提取用户信息中的关键数据
  const {
    gender = '未知',
    age = 30,
    height = 170,
    weight = 60,
    activityLevel = '中等',
    goal = '保持健康',
    dietaryRestrictions = [],
    allergies = [],
    preferences = [],
    dislikedFoods = []
  } = userInfo;
  
  // 计算BMI
  const bmi = weight / ((height / 100) * (height / 100));
  const bmiRounded = Math.round(bmi * 10) / 10;
  
  // 确定体重状态
  let weightStatus = '正常';
  if (bmi < 18.5) {
    weightStatus = '偏瘦';
  } else if (bmi >= 25) {
    weightStatus = '超重';
  }
  
  // 构建提示词
  let prompt = `我是一位${gender}，${age}岁，身高${height}厘米，体重${weight}公斤，BMI指数为${bmiRounded}，属于${weightStatus}体型。`;
  
  prompt += `我的日常活动水平为${activityLevel}。我的健康目标是${goal}。`;
  
  if (dietaryRestrictions.length > 0) {
    prompt += `我有以下饮食限制：${dietaryRestrictions.join('、')}。`;
  }
  
  if (allergies.length > 0) {
    prompt += `我对以下食物过敏：${allergies.join('、')}。`;
  }
  
  if (preferences.length > 0) {
    prompt += `我喜欢的食物包括：${preferences.join('、')}。`;
  }
  
  if (dislikedFoods.length > 0) {
    prompt += `我不喜欢的食物包括：${dislikedFoods.join('、')}。`;
  }
  
  // 添加今日食谱请求
  prompt += `请根据我的情况，为我推荐今日的饮食计划，包括：早餐、午餐、晚餐、零食和饮料。每个食谱都需要包含名称、准备时间、卡路里、食材清单、制作步骤和健康益处。请以JSON格式返回，确保每个食谱都有合适的分类标签。`;
  
  console.log('生成的提示词:', prompt);
  return prompt;
}

/**
 * 解析API响应数据
 * @param {Object} response - API响应对象
 * @returns {Array|null} - 处理后的食谱数组或null
 */
function parseRecipeResponse(response) {
  console.log('开始解析API响应数据');
  try {
    if (!response || !response.choices || !response.choices[0] || !response.choices[0].message) {
      console.error('API响应格式不正确:', JSON.stringify(response));
      return null;
    }
    
    const content = response.choices[0].message.content;
    if (!content) {
      console.error('API响应内容为空');
      return null;
    }
    
    console.log('API原始响应内容:', content);
    
    // 提取JSON部分
    let jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\[\s*\{[\s\S]*\}\s*\]/);
    let jsonText = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
    
    // 清理JSON文本
    jsonText = jsonText.trim().replace(/^[^[{]*/, '').replace(/[^}\]]*$/, '');
    
    try {
      const recipes = JSON.parse(jsonText);
      
      // 如果是数组，直接处理
      if (Array.isArray(recipes)) {
        return processRecipes(recipes);
      }
      
      // 如果是对象，检查是否包含食谱数组
      if (recipes && typeof recipes === 'object') {
        const recipeArray = recipes.饮食计划 || recipes.今日饮食计划 || recipes.diet_plan;
        if (Array.isArray(recipeArray)) {
          return processRecipes(recipeArray);
        }
        
        // 检查是否按餐点类型组织
        if (recipes.breakfast || recipes.lunch || recipes.dinner || recipes.snack || recipes.beverage) {
          return processRecipes(convertMealTypeToArray(recipes));
        }
      }
      
      console.error('未找到有效的食谱数据结构');
      return null;
      
    } catch (error) {
      console.error('JSON解析失败:', error.message);
      return null;
    }
  } catch (error) {
    console.error('解析API响应失败:', error.message);
    return null;
  }
}

/**
 * 将按餐点类型组织的数据转换为数组
 * @param {Object} mealsData - 包含餐点类型键的对象
 * @returns {Array} - 食谱数组
 */
function convertMealTypeToArray(mealsData) {
  const mealTypeMap = {
    'breakfast': '早餐',
    'lunch': '午餐',
    'dinner': '晚餐',
    'snack': '零食',
    'beverage': '饮料'
  };
  
  return Object.entries(mealsData)
    .filter(([key, value]) => value && typeof value === 'object')
    .map(([key, mealData]) => ({
      ...mealData,
      category: mealTypeMap[key] || key
    }));
}

/**
 * 处理食谱数据，确保格式正确
 * @param {Array} recipes - 原始食谱数据
 * @returns {Array} - 处理后的食谱数据
 */
function processRecipes(recipes) {
  if (!Array.isArray(recipes)) {
    console.error('食谱数据不是数组:', typeof recipes);
    return [];
  }
  
  return recipes.map(recipe => ({
    name: recipe.name || recipe.title || '未命名食谱',
    image: recipe.image || '',
    time: recipe.time || recipe.preparation_time || recipe.prepTime || '30分钟',
    calories: recipe.calories ? `${recipe.calories} kcal` : '300千卡',
    ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients.map(ingredient => {
      if (typeof ingredient === 'string') {
        return {
          name: ingredient,
          amount: '适量',
          unit: ''
        };
      }
      return ingredient;
    }) : [],
    steps: Array.isArray(recipe.steps) ? recipe.steps.filter(Boolean) : [],
    benefits: recipe.benefits || recipe.health_benefits || recipe.healthBenefits || '',
    categories: Array.isArray(recipe.categories) ? recipe.categories : 
               (recipe.category ? [recipe.category] : ['其他']),
    tags: Array.isArray(recipe.tags) ? recipe.tags : [],
    nutrition: recipe.nutrition || {
      protein: { name: '蛋白质', value: '0g' },
      fat: { name: '脂肪', value: '0g' },
      carbs: { name: '碳水化合物', value: '0g' },
      fiber: { name: '膳食纤维', value: '0g' },
      sodium: { name: '钠', value: '0mg' },
      vitaminC: { name: '维生素C', value: '0mg' },
      calcium: { name: '钙', value: '0mg' },
      iron: { name: '铁', value: '0mg' }
    },
    tips: recipe.tips || [],
    difficulty: recipe.difficulty || '普通',
    servings: recipe.servings || '2人份',
    isRecommended: true,
    rating: recipe.rating || 5,
    ratingCount: recipe.ratingCount || 0,
    comments: Array.isArray(recipe.comments) ? recipe.comments : [],
    createdAt: recipe.createdAt || new Date().toISOString(),
    updatedAt: recipe.updatedAt || new Date().toISOString()
  })).filter(recipe => recipe.name && recipe.ingredients.length > 0 && recipe.steps.length > 0);
}

/**
 * 获取今日食谱推荐
 * @param {Object} userInfo - 用户信息对象
 * @returns {Promise} - 食谱数组
 */
function getTodayRecipes(userInfo) {
  console.log('开始获取今日食谱推荐，用户信息:', JSON.stringify(userInfo));
  if (!userInfo || typeof userInfo !== 'object') {
    console.error('无效的用户信息:', userInfo);
    return Promise.reject(new Error('无效的用户信息'));
  }
  
  const prompt = generatePrompt(userInfo);
  
  return new Promise((resolve, reject) => {
    console.log('发送API请求...');
    wx.request({
      url: API_CONFIG.url,
      method: 'POST',
      timeout: API_CONFIG.timeout,
      enableHttp2: API_CONFIG.enableHttp2,
      enableQuic: API_CONFIG.enableQuic,
      enableCache: API_CONFIG.enableCache,
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_CONFIG.token}`
      },
      data: {
        model: API_CONFIG.model,
        stream: false,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的营养师和健康饮食顾问。你的任务是根据用户的健康信息提供今日食谱推荐，包括早餐、午餐、晚餐、零食和饮料。\n\n请严格按照以下JSON格式返回数据，不要添加任何额外的解释或文本：\n\n```json\n[\n  {\n    "name": "食谱名称",\n    "image": "图片URL（可选）",\n    "time": "准备时间（例如：30分钟）",\n    "calories": "卡路里（例如：300千卡）",\n    "ingredients": ["食材1", "食材2", "食材3", ...],\n    "steps": ["步骤1", "步骤2", "步骤3", ...],\n    "benefits": "健康益处描述",\n    "categories": ["分类1", "分类2", ...],\n    "tags": ["标签1", "标签2", ...]\n  },\n  ...\n]\n```\n\n每个食谱必须包含以下字段：\n- name: 食谱名称（必填）\n- ingredients: 食材列表（必填，至少3项）\n- steps: 制作步骤（必填，至少3项）\n- categories: 分类（必填，至少包含以下之一：早餐、午餐、晚餐、零食、饮料）\n- time: 准备时间\n- calories: 卡路里含量\n- benefits: 健康益处\n\n请确保：\n1. 返回的是有效的JSON数组，不包含任何额外的文本或注释\n2. 每个食谱都有明确的分类（早餐、午餐、晚餐、零食或饮料）\n3. 食材和步骤详细且实用\n4. 卡路里信息准确且符合用户的健康目标\n5. 考虑用户的饮食限制、过敏原和偏好\n6. 提供至少5个不同的食谱，覆盖不同的餐点类型\n\n请记住，你的建议将直接影响用户的健康，所以请提供科学、均衡且适合用户情况的饮食计划。'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      },
      success: res => {
        console.log('API请求成功，状态码:', res.statusCode);
        if (res.statusCode === 200 && res.data) {
          console.log('开始解析API响应...');
          const recipes = parseRecipeResponse(res.data);
          if (recipes && recipes.length > 0) {
            console.log('成功解析出食谱数据，数量:', recipes.length);
            resolve(recipes);
          } else {
            console.error('未能解析出有效的食谱数据');
            reject(new Error('未能解析出有效的食谱数据'));
          }
        } else {
          console.error('API返回数据格式不正确，状态码:', res.statusCode);
          reject(new Error('API返回数据格式不正确'));
        }
      },
      fail: err => {
        console.error('API请求失败:', err);
        reject(err);
      }
    });
  });
}

module.exports = {
  getTodayRecipes,
  parseRecipeResponse,
  processRecipes
};