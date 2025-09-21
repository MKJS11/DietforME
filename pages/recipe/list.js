// pages/recipe/list.js
const volcanoAPI = require('../../utils/volcanoAPI');

// 添加日志记录函数
function logRecipeData(recipes, title) {
  console.log(`===== ${title} =====`);
  console.log(`总数量: ${recipes ? recipes.length : 0}`);
  
  if (recipes && recipes.length > 0) {
    // 记录前3个食谱的详细信息
    const sampleSize = Math.min(3, recipes.length);
    for (let i = 0; i < sampleSize; i++) {
      const recipe = recipes[i];
      console.log(`食谱 #${i+1}:`);
      console.log(`- 名称: "${recipe.name}" (${typeof recipe.name})`);
      console.log(`- 食材数量: ${recipe.ingredients ? recipe.ingredients.length : 0}`);
      console.log(`- 步骤数量: ${recipe.steps ? recipe.steps.length : 0}`);
      console.log(`- 分类: ${recipe.categories ? recipe.categories.join(', ') : '无'}`);
      console.log(`- 标签: ${recipe.tags ? recipe.tags.join(', ') : '无'}`);
    }
    
    // 检查是否有食谱没有名称
    const noNameRecipes = recipes.filter(r => !r || !r.name);
    if (noNameRecipes.length > 0) {
      console.warn(`警告: 有${noNameRecipes.length}个食谱没有名称`);
      console.log('无名称食谱示例:', noNameRecipes[0]);
    }
  }
}

Page({
  /**
   * 页面的初始数据
   */
  data: {
    recipes: [],
    filteredRecipes: [],
    isLoading: true,
    isLoadingMore: false,
    isRefreshing: false,
    isLoadingAPI: false,
    loadingError: '',
    currentCategory: 'all',
    showSearchBar: false,
    searchKeyword: '',
    lastUpdated: '',
    page: 1,
    hasMore: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log('食谱列表页面加载', options);
    
    // 获取最后更新时间
    try {
      const lastUpdated = wx.getStorageSync('recipesLastUpdated');
      if (lastUpdated) {
        // 格式化日期时间
        const date = new Date(lastUpdated);
        const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        this.setData({
          lastUpdated: formattedDate
        });
        console.log('最后更新时间:', formattedDate);
      }
    } catch (e) {
      console.error('获取最后更新时间失败:', e);
    }
    
    // 处理从主页传递过来的参数
    if (options && options.source === 'home' && options.type === 'recommended') {
      // 从主页的"食谱推荐"功能进入，设置标题
      wx.setNavigationBarTitle({
        title: '为您推荐的食谱'
      });
      
      // 设置当前分类为"推荐"
      this.setData({
        currentCategory: 'recommended'
      });
      
      console.log('从主页进入食谱推荐页面，设置分类为:', 'recommended');
      
      // 显示欢迎提示
      wx.showToast({
        title: '为您精选推荐食谱',
        icon: 'none',
        duration: 1500
      });
    }
    // 如果从其他页面传入了分类参数，则设置当前分类
    else if (options && options.category) {
      this.setData({
        currentCategory: options.category
      });
      console.log('设置初始分类:', options.category);
    }
    
    // 加载食谱数据
    this.loadRecipesFromDatabase();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    console.log('触发下拉刷新');
    this.refreshRecipes();
    wx.stopPullDownRefresh();
  },

  /**
   * 从数据库加载食谱列表
   */
  loadRecipesFromDatabase: function () {
    console.log('从数据库加载食谱数据');
    
    this.setData({
      isLoading: true,
      loadingError: ''
    });
    
    // 从数据库获取所有食谱数据
    wx.cloud.callFunction({
      name: 'getRecipes',
      data: {
        getAllRecipes: true,
        pageSize: 100,  // 设置更大的页面大小
        category: this.data.currentCategory !== 'all' ? this.data.currentCategory : null,
        keyword: this.data.searchKeyword || null,
        recommended: this.data.currentCategory === 'recommended'
      },
      success: res => {
        console.log('从数据库获取食谱成功:', res);
        
        if (res.result && res.result.success && res.result.data) {
          const recipes = res.result.data;
          console.log('数据库返回食谱数量:', recipes.length);
          
          if (recipes.length > 0) {
            // 添加收藏状态
            const favorites = wx.getStorageSync('favorites') || [];
            const recipesWithFavorites = recipes.map(recipe => ({
              ...recipe,
              isFavorite: recipe && recipe._id ? favorites.includes(recipe._id.toString()) : false
            }));
            
            this.setData({
              recipes: recipesWithFavorites,
              isLoading: false,
              hasMore: false,
              loadingError: ''
            });
            
            this.filterRecipes();
            
            // 记录最后更新时间
            this.updateLastUpdatedTime();
          } else {
            console.log('数据库中没有食谱数据');
            this.setData({
              recipes: [],
              filteredRecipes: [],
              isLoading: false,
              loadingError: '暂无食谱数据，请点击刷新按钮从API获取'
            });
          }
        } else {
          console.error('获取食谱失败或数据为空');
          this.setData({
            isLoading: false,
            loadingError: '获取食谱失败，请重试'
          });
        }
      },
      fail: err => {
        console.error('调用云函数获取食谱失败:', err);
        this.setData({
          isLoading: false,
          loadingError: '获取食谱失败，请重试'
        });
        
        wx.showToast({
          title: '获取食谱失败',
          icon: 'none',
          duration: 1500
        });
      }
    });
  },

  /**
   * 记录最后更新时间
   */
  updateLastUpdatedTime: function() {
    const updateTime = new Date().toISOString();
    wx.setStorageSync('recipesLastUpdated', updateTime);
    
    // 格式化日期时间用于显示
    const date = new Date(updateTime);
    const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    
    this.setData({
      lastUpdated: formattedDate
    });
    
    console.log('记录更新时间:', formattedDate);
  },

  /**
   * 从API刷新食谱列表
   */
  refreshFromAPI: function() {
    console.log('从API刷新食谱列表');
    
    // 防止重复点击
    if (this.data.isLoadingAPI) {
      console.log('正在加载中，请稍候...');
      wx.showToast({
        title: '正在加载中，请稍候...',
        icon: 'none',
        duration: 1500
      });
      return;
    }
    
    // 记录本次请求时间，防止频繁请求
    const lastAPIRequestTime = wx.getStorageSync('lastAPIRequestTime');
    const now = Date.now();
    
    // 如果距离上次请求不足30秒，则拒绝请求
    if (lastAPIRequestTime && (now - lastAPIRequestTime < 30 * 1000)) {
      console.log('请求过于频繁，请稍后再试');
      wx.showToast({
        title: '请求过于频繁，请稍后再试',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    
    // 记录本次请求时间
    wx.setStorageSync('lastAPIRequestTime', now);
    
    this.setData({
      isLoadingAPI: true,
      loadingError: ''
    });
    
    // 获取用户信息
    const userInfo = {
      gender: wx.getStorageSync('gender') || '男',
      age: wx.getStorageSync('age') || 30,
      height: wx.getStorageSync('height') || 170,
      weight: wx.getStorageSync('weight') || 65,
      activity: wx.getStorageSync('activity') || '轻度活动',
      goal: wx.getStorageSync('goal') || '保持健康',
      preferences: wx.getStorageSync('preferences') || [],
      restrictions: wx.getStorageSync('restrictions') || []
    };
    
    // 记录用户信息和提示词
    console.log('用户信息:', userInfo);
    const prompt = volcanoAPI.generatePrompt(userInfo);
    console.log('生成的提示词:', prompt.substring(0, 200) + '...');
    
    // 设置请求超时
    const requestTimeout = setTimeout(() => {
      if (this.data.isLoadingAPI) {
        console.log('API请求超时');
        
        this.setData({
          isLoadingAPI: false,
          loadingError: '请求超时'
        });
        
        // 尝试从数据库加载现有食谱
        this.loadRecipesFromDatabase();
      }
    }, 70000); // 70秒后自动超时
    
    // 调用火山大模型API获取食谱推荐
    volcanoAPI.getRecipeRecommendations(userInfo)
      .then(recipes => {
        // 清除超时定时器
        clearTimeout(requestTimeout);
        
        // 记录API返回的原始食谱数据
        logRecipeData(recipes, 'API返回的原始食谱数据');
        
        if (recipes && recipes.length > 0) {
          // 验证食谱数据，确保每个食谱都有名称
          const validRecipes = recipes.filter(recipe => {
            if (!recipe || typeof recipe !== 'object') {
              console.warn('跳过无效的食谱对象');
              return false;
            }
            
            if (!recipe.name || typeof recipe.name !== 'string' || recipe.name.trim() === '') {
              console.warn('跳过没有名称的食谱:', recipe);
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
          
          // 记录过滤后的有效食谱数据
          logRecipeData(validRecipes, '过滤后的有效食谱数据');
          
          if (validRecipes.length === 0) {
            console.warn('没有有效的食谱可显示');
            
            wx.showToast({
              title: '获取的食谱数据无效',
              icon: 'none',
              duration: 1500
            });
            
            this.setData({
              isLoadingAPI: false
            });
            
            return Promise.resolve();
          }
          
          // 显示成功提示
          wx.showToast({
            title: `已获取${validRecipes.length}个新食谱`,
            icon: 'success',
            duration: 1500
          });
          
          // 将食谱数据添加到页面数据中，但不上传到数据库
          this.setData({
            recipes: validRecipes.map(recipe => ({
              ...recipe,
              isFavorite: false
            })),
            isLoadingAPI: false
          });
          
          // 过滤食谱
          this.filterRecipes();
          
          // 记录最后更新时间
          this.updateLastUpdatedTime();
          
          return Promise.resolve();
        } else {
          console.warn('未获取到食谱数据');
          
          wx.showToast({
            title: '未获取到食谱',
            icon: 'none',
            duration: 1500
          });
          
          this.setData({
            isLoadingAPI: false
          });
          
          // 尝试从数据库加载现有食谱
          return this.loadRecipesFromDatabase();
        }
      })
      .catch(err => {
        // 清除超时定时器
        clearTimeout(requestTimeout);
        
        console.error('获取食谱失败:', err);
        
        this.setData({
          isLoadingAPI: false
        });
        
        // 显示错误提示
        wx.showToast({
          title: err.message || '获取食谱失败',
          icon: 'none',
          duration: 1500
        });
        
        // 尝试从数据库加载现有食谱
        this.loadRecipesFromDatabase();
      });
  },

  /**
   * 刷新食谱列表（从数据库重新加载）
   */
  refreshRecipes: function() {
    console.log('刷新食谱列表');
    
    this.setData({
      isRefreshing: true,
      loadingError: ''
    });
    
    this.loadRecipesFromDatabase();
    
    setTimeout(() => {
      if (this.data.isRefreshing) {
        this.setData({
          isRefreshing: false
        });
      }
    }, 5000); // 5秒后自动重置刷新状态
  },

  /**
   * 过滤食谱
   */
  filterRecipes: function () {
    console.log('过滤食谱 - 分类:', this.data.currentCategory, '关键词:', this.data.searchKeyword);
    const { recipes, currentCategory, searchKeyword } = this.data;
    
    // 检查是否有食谱数据
    if (!recipes || recipes.length === 0) {
      console.log('没有食谱数据可供过滤');
      this.setData({
        filteredRecipes: [],
        loadingError: '暂无食谱数据，请点击刷新按钮获取'
      });
      return;
    }
    
    // 创建过滤器数组的副本
    let filtered = recipes.slice(0);
    
    // 按分类过滤
    if (currentCategory !== 'all') {
      if (currentCategory === 'recommended') {
        // 处理推荐分类
        // 1. 优先显示标记为推荐的食谱
        const recommendedRecipes = filtered.filter(recipe => 
          recipe.isRecommended || (recipe.tags && recipe.tags.includes('recommended'))
        );
        
        // 2. 如果推荐食谱不足5个，则添加评分最高的食谱
        if (recommendedRecipes.length < 5) {
          // 获取非推荐的食谱并按评分排序
          const otherRecipes = filtered
            .filter(recipe => 
              !(recipe.isRecommended || (recipe.tags && recipe.tags.includes('recommended')))
            )
            .sort((a, b) => (b.rating || 0) - (a.rating || 0));
          
          // 添加评分最高的食谱，直到达到5个或没有更多食谱
          const neededCount = Math.min(5 - recommendedRecipes.length, otherRecipes.length);
          for (let i = 0; i < neededCount; i++) {
            recommendedRecipes.push(otherRecipes[i]);
          }
        }
        
        filtered = recommendedRecipes;
        console.log('推荐食谱过滤后剩余:', filtered.length);
      } else {
        // 常规分类过滤
        filtered = filtered.filter(recipe => 
          recipe.categories && recipe.categories.includes(currentCategory)
        );
        console.log('分类过滤后剩余:', filtered.length);
      }
    }
    
    // 按关键词搜索
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(recipe => 
        recipe.name.toLowerCase().includes(keyword) || 
        (recipe.ingredients && recipe.ingredients.some(i => i.toLowerCase().includes(keyword)))
      );
      console.log('关键词过滤后剩余:', filtered.length);
    }
    
    // 检查过滤后是否有结果
    if (filtered.length === 0) {
      console.log('过滤后没有匹配的食谱');
      this.setData({
        filteredRecipes: [],
        loadingError: '没有匹配的食谱，请尝试其他筛选条件'
      });
    } else {
      console.log('过滤后有匹配的食谱:', filtered.length);
      this.setData({
        filteredRecipes: filtered,
        loadingError: '',
        hasMore: false
      });
    }
  },

  /**
   * 选择分类
   */
  selectCategory: function (e) {
    const category = e.currentTarget.dataset.category;
    
    this.setData({
      currentCategory: category
    });
    
    // 添加触感反馈
    wx.vibrateShort({
      type: 'light'
    });
    
    this.filterRecipes();
  },

  /**
   * 显示搜索栏
   */
  showSearch: function () {
    this.setData({
      showSearchBar: true
    });
  },

  /**
   * 隐藏搜索栏
   */
  hideSearch: function () {
    this.setData({
      showSearchBar: false,
      searchKeyword: ''
    });
    
    this.filterRecipes();
  },

  /**
   * 搜索输入变化
   */
  onSearchInput: function (e) {
    this.setData({
      searchKeyword: e.detail.value
    });
    
    this.filterRecipes();
  },

  /**
   * 执行搜索
   */
  searchRecipes: function () {
    // 收起键盘
    wx.hideKeyboard();
  },

  /**
   * 重置筛选条件
   */
  resetFilters: function () {
    console.log('重置筛选条件');
    this.setData({
      currentCategory: 'all',
      searchKeyword: '',
      showSearchBar: false
    });
    
    this.filterRecipes();
  },

  /**
   * 切换收藏状态
   */
  toggleFavorite: function(e) {
    // 阻止事件冒泡
    e.stopPropagation();
    
    const id = e.currentTarget.dataset.id;
    console.log('切换收藏状态:', id);
    
    if (id) {
      // 查找食谱在数组中的索引
      const recipeIndex = this.data.recipes.findIndex(r => r && r._id === id);
      const filteredIndex = this.data.filteredRecipes.findIndex(r => r && r._id === id);
      
      if (recipeIndex === -1) {
        console.error('未找到对应的食谱:', id);
        return;
      }
      
      // 获取当前收藏状态并切换
      const { recipes, filteredRecipes } = this.data;
      const isFavorite = !recipes[recipeIndex].isFavorite;
      
      // 调用云函数更新收藏状态
      const functionName = isFavorite ? 'addFavorite' : 'removeFavorite';
      
      wx.cloud.callFunction({
        name: functionName,
        data: {
          recipeId: id
        },
        success: res => {
          console.log(`${isFavorite ? '添加' : '取消'}收藏成功:`, res);
          
          // 更新本地数据
          this.updateFavoriteStatus(id, isFavorite, recipeIndex, filteredIndex);
        },
        fail: err => {
          console.error(`${isFavorite ? '添加' : '取消'}收藏失败:`, err);
          
          wx.showToast({
            title: '操作失败，请重试',
            icon: 'none'
          });
        }
      });
    }
  },
  
  /**
   * 更新收藏状态
   */
  updateFavoriteStatus: function(id, isFavorite, recipeIndex, filteredIndex) {
    const { recipes, filteredRecipes } = this.data;
    
    // 更新数据，使用slice创建副本
    const updatedRecipes = recipes.slice(0);
    updatedRecipes[recipeIndex].isFavorite = isFavorite;
    
    const updatedFiltered = filteredRecipes.slice(0);
    if (filteredIndex !== -1) {
      updatedFiltered[filteredIndex].isFavorite = isFavorite;
    }
    
    this.setData({
      recipes: updatedRecipes,
      filteredRecipes: updatedFiltered
    });
    
    // 更新本地存储
    const favorites = wx.getStorageSync('favorites') || [];
    let newFavorites = [];
    
    if (isFavorite) {
      // 使用concat代替扩展运算符
      newFavorites = favorites.concat([id.toString()]);
      wx.showToast({
        title: '已添加到收藏',
        icon: 'success',
        duration: 1500
      });
    } else {
      newFavorites = favorites.filter(fid => fid.toString() !== id.toString());
      wx.showToast({
        title: '已取消收藏',
        icon: 'none',
        duration: 1500
      });
    }
    
    wx.setStorageSync('favorites', newFavorites);
    console.log('更新后的收藏列表:', newFavorites);
    
    // 添加触感反馈
    wx.vibrateShort({
      type: 'light'
    });
  },

  /**
   * 查看食谱详情
   */
  viewRecipeDetail: function (e) {
    const id = e.currentTarget.dataset.id;
    console.log('查看食谱详情:', id);
    
    if (!id) {
      console.error('无效的食谱ID');
      wx.showToast({
        title: '无法查看详情',
        icon: 'none'
      });
      return;
    }
    
    // 添加触感反馈
    wx.vibrateShort({
      type: 'light'
    });
    
    // 使用正确的ID字段，可能是_id而不是id
    const recipeId = id;
    
    wx.navigateTo({
      url: `/pages/details/detail?id=${recipeId}`
    });
  },

  /**
   * 返回上一页
   */
  goBack: function () {
    // 获取页面栈
    const pages = getCurrentPages();
    
    console.log("当前页面栈数量:", pages.length);
    
    // 如果页面栈大于1，说明有上一页，直接返回
    if (pages.length > 1) {
      wx.navigateBack({
        delta: 1,
        fail: function(err) {
          console.error("返回上一页失败:", err);
          // 如果返回失败，尝试跳转到首页
          wx.switchTab({
            url: '/pages/index/index'
          });
        }
      });
    } else {
      // 如果没有上一页，则跳转到首页
      wx.switchTab({
        url: '/pages/index/index'
      });
    }
  }
}) 