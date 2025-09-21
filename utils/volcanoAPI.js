/**
 * 火山引擎大模型API模块
 * 用于获取个性化食谱推荐
 */

// API配置
const API_CONFIG = {
  url: 'https://ark.cn-beijing.volces.com/api/v3/bots/chat/completions',
  model: 'bot-20250303153853-pt5lg',
  token: '85548f3b-11af-4c08-a078-86c1865e4513',
  timeout: 30000, // 降低超时时间为30秒
  enableHttp2: false, // 禁用HTTP2，可能导致连接问题
  enableQuic: false, // 禁用QUIC，可能导致连接问题
  enableCache: true,
  maxRetries: 3, // 增加最大重试次数
  retryDelay: 3000 // 增加重试延迟时间
};

/**
 * 根据用户信息生成提示词
 * @param {Object} userInfo - 用户信息对象
 * @returns {String} - 生成的提示词
 */
function generatePrompt(userInfo) {
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
  
  // 确定性别显示
  let genderText = '未知性别';
  if (gender === '男' || gender === 'male' || gender === '男性') {
    genderText = '男性';
  } else if (gender === '女' || gender === 'female' || gender === '女性') {
    genderText = '女性';
  }
  
  // 构建提示词
  let prompt = `我是一位${genderText}，${age}岁，身高${height}厘米，体重${weight}公斤，BMI指数为${bmiRounded}，属于${weightStatus}体型。`;
  
  // 添加活动水平
  prompt += `我的日常活动水平为${activityLevel}。`;
  
  // 添加健康目标
  prompt += `我的健康目标是${goal}。`;
  
  // 添加饮食限制
  if (dietaryRestrictions && dietaryRestrictions.length > 0) {
    prompt += `我有以下饮食限制：${dietaryRestrictions.join('、')}。`;
  }
  
  // 添加过敏信息
  if (allergies && allergies.length > 0) {
    prompt += `我对以下食物过敏：${allergies.join('、')}。`;
  }
  
  // 添加食物偏好
  if (preferences && preferences.length > 0) {
    prompt += `我喜欢的食物包括：${preferences.join('、')}。`;
  }
  
  // 添加不喜欢的食物
  if (dislikedFoods && dislikedFoods.length > 0) {
    prompt += `我不喜欢的食物包括：${dislikedFoods.join('、')}。`;
  }
  
  // 添加请求
  prompt += `请根据我的情况，推荐5个适合我的健康食谱，每个食谱包括名称、准备时间、卡路里、食材清单、制作步骤和健康益处。请以JSON格式返回，确保每个食谱都有合适的分类标签（如"早餐"、"午餐"、"晚餐"、"零食"、"减脂"、"增肌"等）。`;
  
  return prompt;
}

/**
 * 解析API响应数据
 * @param {Object} response - API响应对象
 * @returns {Array|null} - 处理后的食谱数组或null
 */
function parseRecipeResponse(response) {
  try {
    console.log('===== 开始解析API响应 =====');
    
    // 检查响应是否包含必要的字段
    if (!response || !response.choices || !response.choices[0] || !response.choices[0].message) {
      console.error('API响应格式不正确:', response);
      return null;
    }
    
    // 获取消息内容
    const content = response.choices[0].message.content;
    if (!content) {
      console.error('API响应内容为空');
      return null;
    }
    
    // 记录原始响应内容（截取前500个字符，避免日志过长）
    console.log('API原始响应内容（前500字符）:', content.substring(0, 500) + (content.length > 500 ? '...' : ''));
    
    // 尝试提取JSON部分
    let jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      console.log('找到JSON代码块');
    } else {
      // 尝试查找没有标记的JSON
      jsonMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        console.log('找到未标记的JSON数组');
      } else {
        console.log('未找到JSON格式数据，尝试直接解析内容');
      }
    }
    
    let jsonText = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
    
    // 清理可能的非JSON字符
    jsonText = jsonText.replace(/^[^[{]*/, '').replace(/[^}\]]*$/, '');
    
    // 记录处理后的JSON文本（截取前500个字符）
    console.log('处理后的JSON文本（前500字符）:', jsonText.substring(0, 500) + (jsonText.length > 500 ? '...' : ''));
    
    // 解析JSON
    const recipes = JSON.parse(jsonText);
    
    // 记录解析后的食谱数量
    console.log(`成功解析JSON，获取到${recipes.length}个食谱`);
    
    // 验证并格式化食谱数据
    return processRecipes(recipes);
  } catch (error) {
    console.error('解析API响应失败:', error);
    return null;
  }
}

/**
 * 处理食谱数据，确保格式正确
 * @param {Array} recipes - 原始食谱数据
 * @returns {Array} - 处理后的食谱数据
 */
function processRecipes(recipes) {
  console.log('===== 开始处理食谱数据 =====');
  
  if (!Array.isArray(recipes)) {
    console.error('食谱数据不是数组:', recipes);
    return [];
  }
  
  console.log(`原始食谱数量: ${recipes.length}`);
  
  // 检查是否有食谱没有名称
  const noNameRecipes = recipes.filter(recipe => !recipe || !recipe.name);
  if (noNameRecipes.length > 0) {
    console.warn(`警告: 有${noNameRecipes.length}个食谱没有名称`);
    if (noNameRecipes.length > 0) {
      console.log('无名称食谱示例:', JSON.stringify(noNameRecipes[0]).substring(0, 200));
    }
  }
  
  const processedRecipes = recipes.map((recipe, index) => {
    // 记录处理前的食谱信息
    console.log(`处理食谱 #${index+1}:`);
    console.log(`- 原始名称: "${recipe.name || recipe.title || '无'}" (${typeof (recipe.name || recipe.title)})`);
    
    // 确保每个食谱都有名称
    if (!recipe.name && recipe.title) {
      console.log(`- 使用title字段作为名称: "${recipe.title}"`);
      recipe.name = recipe.title;
    } else if (!recipe.name) {
      console.log(`- 分配默认名称: "未命名食谱"`);
      recipe.name = '未命名食谱';
    }
    
    // 确保名称是字符串并去除前后空格
    if (typeof recipe.name !== 'string') {
      console.warn(`- 警告: 名称不是字符串类型，而是 ${typeof recipe.name}`);
      recipe.name = String(recipe.name);
    }
    
    recipe.name = recipe.name.trim();
    console.log(`- 处理后名称: "${recipe.name}"`);
    
    // 标准化其他字段
    const processedRecipe = {
      name: recipe.name,
      image: recipe.image || '',
      time: recipe.time || recipe.prepTime || '30分钟',
      calories: recipe.calories || recipe.calorieCount || '300千卡',
      ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients.filter(i => i && String(i).trim() !== '') : [],
      steps: Array.isArray(recipe.steps) ? recipe.steps.filter(s => s && String(s).trim() !== '') : [],
      benefits: recipe.benefits || recipe.healthBenefits || '',
      categories: Array.isArray(recipe.categories) ? recipe.categories.filter(c => c && String(c).trim() !== '') : 
                 (recipe.category ? [recipe.category] : ['其他']),
      tags: Array.isArray(recipe.tags) ? recipe.tags.filter(t => t && String(t).trim() !== '') : [],
      isRecommended: true, // 默认设为推荐
      rating: 5, // 默认评分
      createdAt: new Date().toISOString() // 添加创建时间
    };
    
    // 记录处理后的关键信息
    console.log(`- 食材数量: ${processedRecipe.ingredients.length}`);
    console.log(`- 步骤数量: ${processedRecipe.steps.length}`);
    console.log(`- 分类: ${processedRecipe.categories.join(', ')}`);
    
    return processedRecipe;
  });
  
  // 过滤掉没有名称、食材或步骤的食谱
  const validRecipes = processedRecipes.filter(recipe => {
    const isValid = recipe.name && recipe.ingredients.length > 0 && recipe.steps.length > 0;
    if (!isValid) {
      console.warn(`警告: 过滤掉无效食谱 "${recipe.name}"`);
      if (!recipe.name) console.warn('- 原因: 没有名称');
      if (!recipe.ingredients.length) console.warn('- 原因: 没有食材');
      if (!recipe.steps.length) console.warn('- 原因: 没有步骤');
    }
    return isValid;
  });
  
  console.log(`处理后有效食谱数量: ${validRecipes.length}/${recipes.length}`);
  
  return validRecipes;
}

/**
 * 获取个性化食谱推荐
 * @param {Object} userInfo - 用户信息对象
 * @param {Number} retryCount - 重试次数
 * @returns {Promise} - 食谱数组
 */
function getRecipeRecommendations(userInfo, retryCount = 0) {
  console.log('开始获取食谱推荐', retryCount > 0 ? `(第${retryCount}次重试)` : '');
  
  // 检查用户信息是否有效
  if (!userInfo || typeof userInfo !== 'object') {
    console.error('无效的用户信息:', userInfo);
    return Promise.reject(new Error('无效的用户信息'));
  }
  
  // 检查是否有正在进行的请求
  const isRequesting = wx.getStorageSync('isRequestingRecipes');
  const lastRequestTime = wx.getStorageSync('recipeRequestTime');
  const now = Date.now();
  
  // 如果上次请求时间超过2分钟，认为是过期的请求标记，自动清除
  if (isRequesting && lastRequestTime && (now - lastRequestTime > 2 * 60 * 1000)) {
    console.log('发现过期的请求标记，已超过2分钟，自动清除');
    wx.setStorageSync('isRequestingRecipes', false);
    wx.removeStorageSync('recipeRequestTime');
  } else if (isRequesting && retryCount === 0) {
    console.log('已有正在进行的食谱请求，避免重复请求');
    return Promise.reject(new Error('已有正在进行的请求，请稍后再试'));
  }
  
  // 标记开始请求并记录时间
  wx.setStorageSync('isRequestingRecipes', true);
  wx.setStorageSync('recipeRequestTime', now);
  
  // 设置自动清除标记的定时器（5分钟后）
  setTimeout(() => {
    console.log('请求超时自动清除标记');
    wx.setStorageSync('isRequestingRecipes', false);
    wx.removeStorageSync('recipeRequestTime');
  }, 5 * 60 * 1000);
  
  return new Promise((resolve, reject) => {
    // 设置请求超时定时器
    let requestTimeoutId = setTimeout(() => {
      console.log('API请求超时，自动中断');
      
      // 如果未超过最大重试次数，则重试
      if (retryCount < API_CONFIG.maxRetries) {
        console.log(`请求超时，准备第${retryCount + 1}次重试...`);
        
        // 显示重试提示
        wx.showToast({
          title: `请求超时，正在重试(${retryCount + 1}/${API_CONFIG.maxRetries})`,
          icon: 'none',
          duration: 2000
        });
        
        // 清除请求标记
        wx.setStorageSync('isRequestingRecipes', false);
        wx.removeStorageSync('recipeRequestTime');
        
        // 延迟一段时间后重试
        setTimeout(() => {
          getRecipeRecommendations(userInfo, retryCount + 1)
            .then(recipes => resolve(recipes))
            .catch(err => reject(err));
        }, API_CONFIG.retryDelay);
      } else {
        // 已达到最大重试次数，使用备用食谱
        console.log('已达到最大重试次数，使用备用食谱数据');
        wx.setStorageSync('isRequestingRecipes', false);
        wx.removeStorageSync('recipeRequestTime');
        
        // 处理备用食谱数据
        const processedRecipes = processRecipes(FALLBACK_RECIPES);
        
        // 显示提示
        wx.showToast({
          title: '网络连接问题，使用备用食谱',
          icon: 'none',
          duration: 2000
        });
        
        // 返回备用食谱
        resolve(processedRecipes);
      }
    }, API_CONFIG.timeout + 5000); // 比wx.request的超时稍长
    
    // 生成提示词
    const prompt = generatePrompt(userInfo);
    console.log('===== 发送API请求 =====');
    console.log('使用模型:', API_CONFIG.model);

    // 构建请求数据
    const requestData = {
      model: API_CONFIG.model,
      stream: false,
      messages: [
        {
          role: 'system',
          content: '你是一个专业的营养师和健康饮食顾问。根据用户的健康信息提供个性化的食谱推荐。请以JSON格式返回5个食谱，每个食谱必须包含以下字段：name(名称)、time(准备时间)、calories(卡路里)、ingredients(食材数组)、steps(步骤数组)、benefits(健康益处)、categories(分类数组)、tags(标签数组)。确保所有字段都有值，特别是name字段不能为空。'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    };
    
    console.log('系统提示词:', requestData.messages[0].content);

    try {
      // 发送请求
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
        data: requestData,
        success: res => {
          // 清除超时定时器
          clearTimeout(requestTimeoutId);
          
          // 清除请求标记
          wx.setStorageSync('isRequestingRecipes', false);
          wx.removeStorageSync('recipeRequestTime');
          
          console.log('API请求成功，状态码:', res.statusCode);
          
          if (res.statusCode === 200 && res.data) {
            // 解析返回的食谱数据
            const recipes = parseRecipeResponse(res.data);
            
            if (recipes && recipes.length > 0) {
              // 处理成功获取的食谱
              console.log('成功获取食谱:', recipes.length);
              
              // 上传到数据库
              uploadRecipesOneByOne(recipes, userInfo.openid)
                .then(() => {
                  console.log('食谱已上传到数据库');
                  resolve(recipes);
                })
                .catch(err => {
                  console.error('上传食谱到数据库失败:', err);
                  // 即使上传失败，也返回解析的食谱
                  resolve(recipes);
                });
            } else {
              const error = new Error('未能解析出有效的食谱数据');
              console.error(error);
              
              // 如果未超过最大重试次数，则重试
              if (retryCount < API_CONFIG.maxRetries) {
                console.log(`解析失败，准备第${retryCount + 1}次重试...`);
                
                // 延迟一段时间后重试
                setTimeout(() => {
                  getRecipeRecommendations(userInfo, retryCount + 1)
                    .then(recipes => resolve(recipes))
                    .catch(err => reject(err));
                }, API_CONFIG.retryDelay);
              } else {
                // 使用备用食谱
                console.log('解析失败且已达到最大重试次数，使用备用食谱数据');
                
                // 处理备用食谱数据
                const processedRecipes = processRecipes(FALLBACK_RECIPES);
                
                // 显示提示
                wx.showToast({
                  title: '解析失败，使用备用食谱',
                  icon: 'none',
                  duration: 2000
                });
                
                // 返回备用食谱
                resolve(processedRecipes);
              }
            }
          } else {
            const error = new Error('API返回数据格式不正确');
            console.error(error, res);
            
            // 如果未超过最大重试次数，则重试
            if (retryCount < API_CONFIG.maxRetries) {
              console.log(`API返回错误，准备第${retryCount + 1}次重试...`);
              
              // 延迟一段时间后重试
              setTimeout(() => {
                getRecipeRecommendations(userInfo, retryCount + 1)
                  .then(recipes => resolve(recipes))
                  .catch(err => reject(err));
              }, API_CONFIG.retryDelay);
            } else {
              // 使用备用食谱
              console.log('API返回错误且已达到最大重试次数，使用备用食谱数据');
              
              // 处理备用食谱数据
              const processedRecipes = processRecipes(FALLBACK_RECIPES);
              
              // 显示提示
              wx.showToast({
                title: 'API返回错误，使用备用食谱',
                icon: 'none',
                duration: 2000
              });
              
              // 返回备用食谱
              resolve(processedRecipes);
            }
          }
        },
        fail: err => {
          // 清除超时定时器
          clearTimeout(requestTimeoutId);
          
          // 清除请求标记
          wx.setStorageSync('isRequestingRecipes', false);
          wx.removeStorageSync('recipeRequestTime');
          
          console.error('API请求失败:', err);
          
          // 如果未超过最大重试次数，则重试
          if (retryCount < API_CONFIG.maxRetries) {
            console.log(`网络请求失败，准备第${retryCount + 1}次重试...`);
            
            // 显示重试提示
            wx.showToast({
              title: `网络请求失败，正在重试(${retryCount + 1}/${API_CONFIG.maxRetries})`,
              icon: 'none',
              duration: 2000
            });
            
            // 延迟一段时间后重试
            setTimeout(() => {
              getRecipeRecommendations(userInfo, retryCount + 1)
                .then(recipes => resolve(recipes))
                .catch(retryErr => reject(retryErr));
            }, API_CONFIG.retryDelay);
          } else {
            // 使用备用食谱
            console.log('网络请求失败且已达到最大重试次数，使用备用食谱数据');
            
            // 处理备用食谱数据
            const processedRecipes = processRecipes(FALLBACK_RECIPES);
            
            // 显示提示
            wx.showToast({
              title: '网络连接问题，使用备用食谱',
              icon: 'none',
              duration: 2000
            });
            
            // 返回备用食谱
            resolve(processedRecipes);
          }
        }
      });
    } catch (error) {
      // 捕获请求过程中的异常
      console.error('API请求过程中发生异常:', error);
      
      // 清除超时定时器
      clearTimeout(requestTimeoutId);
      
      // 清除请求标记
      wx.setStorageSync('isRequestingRecipes', false);
      wx.removeStorageSync('recipeRequestTime');
      
      // 使用备用食谱
      console.log('API请求异常，使用备用食谱数据');
      
      // 处理备用食谱数据
      const processedRecipes = processRecipes(FALLBACK_RECIPES);
      
      // 显示提示
      wx.showToast({
        title: '请求异常，使用备用食谱',
        icon: 'none',
        duration: 2000
      });
      
      // 返回备用食谱
      resolve(processedRecipes);
    }
  });
}

/**
 * 逐个上传食谱到数据库
 * @param {Array} recipes - 食谱数组
 * @param {String} openid - 用户openid
 * @returns {Promise} - 上传结果
 */
function uploadRecipesOneByOne(recipes, openid) {
  console.log('开始逐个上传食谱，数量:', recipes.length);
  
  // 验证参数
  if (!recipes || !Array.isArray(recipes) || recipes.length === 0) {
    console.error('无效的食谱数据:', recipes);
    return Promise.reject(new Error('无效的食谱数据'));
  }
  
  // 过滤有效的食谱（必须有名称）
  const validRecipes = recipes.filter(recipe => {
    if (!recipe || typeof recipe !== 'object') {
      console.warn('跳过无效的食谱对象');
      return false;
    }
    
    if (!recipe.name || typeof recipe.name !== 'string' || recipe.name.trim() === '') {
      console.warn('跳过没有名称的食谱');
      return false;
    }
    
    // 确保名称被去除前后空格
    recipe.name = recipe.name.trim();
    
    // 确保食谱有食材和步骤
    if (!recipe.ingredients || !Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
      console.warn('跳过没有食材的食谱:', recipe.name);
      return false;
    }
    
    if (!recipe.steps || !Array.isArray(recipe.steps) || recipe.steps.length === 0) {
      console.warn('跳过没有步骤的食谱:', recipe.name);
      return false;
    }
    
    return true;
  });
  
  console.log(`有效食谱数量: ${validRecipes.length}/${recipes.length}`);
  
  if (validRecipes.length === 0) {
    return Promise.reject(new Error('没有有效的食谱可上传'));
  }
  
  // 获取openid
  if (!openid) {
    openid = wx.getStorageSync('openid');
    if (!openid) {
      console.error('未找到openid，无法上传食谱');
      return Promise.reject(new Error('未找到用户ID，请先登录'));
    }
  }
  
  return new Promise((resolve, reject) => {
    const results = [];
    const errors = [];
    
    // 递归上传每个食谱
    function uploadNext(index) {
      // 所有食谱都已处理完毕
      if (index >= validRecipes.length) {
        console.log('逐个上传完成，成功:', results.length, '失败:', errors.length);
        
        // 即使有部分失败，也返回成功结果
        resolve({
          success: results.length > 0,
          message: `成功上传${results.length}个食谱，失败${errors.length}个`,
          results: results,
          errors: errors
        });
        return;
      }
      
      const recipe = validRecipes[index];
      console.log(`上传食谱 #${index+1}: ${recipe.name}`);
      
      // 调用云函数保存食谱
      wx.cloud.callFunction({
        name: 'saveRecipe',
        data: {
          recipe: recipe,
          openid: openid
        },
        success: res => {
          console.log(`食谱 #${index+1} 上传成功:`, res);
          
          if (res.result && res.result.success) {
            results.push({
              index: index,
              name: recipe.name,
              id: res.result.recipeId
            });
          } else {
            console.error(`食谱 #${index+1} 上传失败，服务器返回错误:`, res.result);
            errors.push({
              index: index,
              name: recipe.name,
              error: res.result && res.result.message ? res.result.message : '保存食谱失败'
            });
          }
          
          // 处理下一个食谱
          uploadNext(index + 1);
        },
        fail: err => {
          console.error(`食谱 #${index+1} 上传失败:`, err);
          errors.push({
            index: index,
            name: recipe.name,
            error: err.message || '未知错误'
          });
          // 处理下一个食谱
          uploadNext(index + 1);
        }
      });
    }
    
    // 开始上传第一个食谱
    uploadNext(0);
  });
}

/**
 * 从数据库获取食谱列表
 * @param {Object} options - 查询选项
 * @param {Boolean} options.getAllRecipes - 是否获取所有食谱
 * @param {String} options.category - 分类（可选）
 * @param {String} options.keyword - 关键词（可选）
 * @param {Boolean} options.recommended - 是否只获取推荐食谱（可选）
 * @param {Number} options.page - 页码，默认为1
 * @param {Number} options.pageSize - 每页数量，默认为50
 * @returns {Promise} - 食谱数组
 */
function getRecipesFromDatabase(options = {}) {
  console.log('开始从数据库获取食谱，参数:', options);
  
  const queryData = {
    getAllRecipes: options.getAllRecipes === true,
    page: options.page || 1,
    pageSize: options.pageSize || 50
  };
  
  // 添加可选参数
  if (options.category) {
    queryData.category = options.category;
  }
  
  if (options.keyword) {
    queryData.keyword = options.keyword;
  }
  
  if (options.recommended === true) {
    queryData.recommended = true;
  }
  
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'getRecipes',
      data: queryData,
      success: res => {
        console.log('从数据库获取食谱成功:', res);
        if (res.result && res.result.success) {
          const recipes = res.result.data || [];
          console.log('数据库返回食谱数量:', recipes.length);
          resolve(recipes);
        } else {
          console.error('获取食谱数据格式不正确或失败:', res.result);
          reject(new Error(res.result && res.result.message ? res.result.message : '获取食谱数据格式不正确'));
        }
      },
      fail: err => {
        console.error('从数据库获取食谱失败:', err);
        reject(err);
      }
    });
  });
}

/**
 * 获取食谱详情
 * @param {String} recipeId - 食谱ID
 * @returns {Promise} - 食谱详情
 */
function getRecipeDetail(recipeId) {
  if (!recipeId) {
    return Promise.reject(new Error('食谱ID不能为空'));
  }
  
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'getRecipeDetail',
      data: {
        recipeId: recipeId
      },
      success: res => {
        if (res.result && res.result.success) {
          resolve(res.result.data);
        } else {
          reject(new Error(res.result && res.result.message ? res.result.message : '获取食谱详情失败'));
        }
      },
      fail: err => {
        reject(err);
      }
    });
  });
}

module.exports = {
  getRecipeRecommendations,
  uploadRecipesOneByOne,
  getRecipesFromDatabase,
  getRecipeDetail,
  generatePrompt,
  parseRecipeResponse,
  processRecipes
}; 