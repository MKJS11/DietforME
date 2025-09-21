// 菜谱详情页面
const utils = require('../../utils/util.js')
const app = getApp()

Page({
  /**
   * 页面的初始数据
   */
  data: {
    recipeId: null,
    recipe: null,
    isLoading: true,
    isFavorite: false,
    showNutrition: true,
    showSteps: true,
    showIngredients: true,
    showTips: true,
    showComments: true,
    userRating: 0,
    ratingModalVisible: false,
    commentContent: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    console.log('页面加载原始参数:', options)
    
    // 获取传递的食谱ID
    let recipeId = null
    
    // 检查所有可能的ID参数
    if (options.id) {
      recipeId = options.id
      console.log('从id参数获取:', recipeId)
    } else if (options._id) {
      recipeId = options._id
      console.log('从_id参数获取:', recipeId)
    } else if (options.recipeId) {
      recipeId = options.recipeId
      console.log('从recipeId参数获取:', recipeId)
    }
    
    // 检查ID格式
    if (!recipeId) {
      console.error('未找到有效的菜谱ID参数')
      wx.showToast({
        title: '参数错误',
        icon: 'error'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      return
    }
    
    // 打印最终使用的ID
    console.log('最终使用的菜谱ID:', recipeId)
    
    this.setData({
      recipeId: recipeId,
      isLoading: true
    })

    // 从本地存储中检查是否有预加载的数据
    const preloadedRecipe = wx.getStorageSync('selectedRecipe')
    if (preloadedRecipe && preloadedRecipe._id === recipeId) {
      console.log('使用预加载的菜谱数据')
      this.setData({
        recipe: preloadedRecipe,
        isLoading: false,
        isFavorite: preloadedRecipe.isFavorite || false
      })
      
      wx.setNavigationBarTitle({
        title: preloadedRecipe.name || '菜谱详情'
      })
    }

    // 无论是否有预加载数据，都重新加载以确保数据最新
    this.loadRecipeDetail(recipeId)
  },

  /**
   * 从数据库加载食谱详情
   */
  loadRecipeDetail: function(recipeId) {
    console.log('开始加载食谱详情，ID:', recipeId)
    
    if (!recipeId) {
      console.error('食谱ID为空')
      this.handleLoadError('参数错误：食谱ID为空')
      return
    }
    
    wx.showLoading({
      title: '加载中...',
      mask: true
    })
    
    const params = {
      recipeId: recipeId
    }
    console.log('调用云函数参数:', params)
    
    wx.cloud.callFunction({
      name: 'getDetails',
      data: params,
      success: res => {
        console.log('云函数调用成功，返回数据:', res)
        
        if (!res.result) {
          console.error('云函数返回结果为空:', res)
          this.handleLoadError('数据加载失败：返回结果为空')
          return
        }
        
        if (!res.result.success) {
          console.error('云函数执行失败:', res.result.message, res.result.error)
          this.handleLoadError(res.result.message || '数据加载失败')
          return
        }
        
        if (!res.result.data) {
          console.error('云函数返回数据为空:', res.result)
          this.handleLoadError('未找到菜谱数据')
          return
        }
        
        let recipe = res.result.data
        console.log('云函数返回的原始菜谱数据:', recipe)
        
        try {
          // 处理食谱数据，确保格式正确
          recipe = this.processRecipeData(recipe)
          console.log('处理后的菜谱数据:', recipe)
          
          this.setData({
            recipe: recipe,
            isLoading: false,
            isFavorite: recipe.isFavorite || false
          })
          
          // 更新页面标题
          wx.setNavigationBarTitle({
            title: recipe.name || '菜谱详情'
          })
          
          // 将选中的食谱保存到本地存储
          wx.setStorageSync('selectedRecipe', recipe)
          
          wx.hideLoading()
        } catch (err) {
          console.error('处理菜谱数据失败:', err)
          this.handleLoadError('数据处理失败')
        }
      },
      fail: err => {
        console.error('云函数调用失败:', err)
        this.handleLoadError(err.errMsg || '网络请求失败')
      }
    })
  },
  
  /**
   * 处理加载错误
   */
  handleLoadError: function(message) {
    this.setData({
      isLoading: false,
      recipe: null
    })
    
    wx.hideLoading()
    
    wx.showToast({
      title: message || '加载失败',
      icon: 'none',
      duration: 2000
    })
  },
  
  /**
   * 处理食谱数据，确保格式正确
   */
  processRecipeData: function(recipe) {
    if (!recipe) {
      return null;
    }
    
    if (typeof recipe !== 'object') {
      recipe = {};
    }
    
    // 处理食材数据
    if (recipe.ingredients) {
      if (Array.isArray(recipe.ingredients)) {
        recipe.ingredients = recipe.ingredients.map(ingredient => {
          if (typeof ingredient === 'string') {
            return {
              name: ingredient,
              amount: '适量',
              unit: ''
            }
          } else if (typeof ingredient === 'object' && ingredient !== null) {
            return {
              name: ingredient.name || '未知食材',
              amount: ingredient.amount || '适量',
              unit: ingredient.unit || ''
            }
          }
          return { name: '未知食材', amount: '适量', unit: '' }
        })
      } else {
        recipe.ingredients = []
      }
    } else {
      recipe.ingredients = []
    }
    
    // 基本字段处理
    recipe.id = recipe.id || ''
    recipe.name = recipe.name || '未命名菜谱'
    recipe.benefits = recipe.benefits || '暂无健康益处信息'
    recipe.calories = recipe.calories || '0千卡'
    recipe.categories = Array.isArray(recipe.categories) ? recipe.categories : []
    recipe.createTime = recipe.createTime || utils.formatTime(new Date())
    recipe.createdBy = recipe.createdBy || ''
    recipe.isRecommended = !!recipe.isRecommended
    recipe.rating = parseFloat(recipe.rating) || 5
    recipe.steps = Array.isArray(recipe.steps) ? recipe.steps : []
    recipe.tags = Array.isArray(recipe.tags) ? recipe.tags : []
    recipe.time = recipe.time || '30分钟'
    recipe.updateTime = recipe.updateTime || recipe.createTime || utils.formatTime(new Date())
    
    // 额外UI所需字段
    recipe.ratingCount = parseInt(recipe.ratingCount) || 0
    recipe.servings = recipe.servings || '2人份'
    recipe.difficulty = recipe.difficulty || '普通'
    
    // 处理评论数据
    if (recipe.comments) {
      if (Array.isArray(recipe.comments)) {
        recipe.comments = recipe.comments.map(comment => {
          if (typeof comment !== 'object' || comment === null) {
            comment = {}
          }
          return {
            id: comment.id || utils.generateUniqueId(),
            content: comment.content || '',
            rating: parseInt(comment.rating) || 5,
            createdAt: comment.createdAt ? utils.formatTime(new Date(comment.createdAt)) : utils.formatTime(new Date()),
            userName: comment.userName || '匿名用户',
            userAvatar: comment.userAvatar || ''
          }
        })
      } else {
        recipe.comments = []
      }
    } else {
      recipe.comments = []
    }
    
    return recipe
  },
  
  /**
   * 获取营养成分名称
   */
  getNutritionName: function(key) {
    const nameMap = {
      'protein': '蛋白质',
      'fat': '脂肪',
      'carbs': '碳水化合物',
      'fiber': '膳食纤维',
      'sodium': '钠',
      'vitaminC': '维生素C',
      'calcium': '钙',
      'iron': '铁'
    }
    return nameMap[key] || key
  },
  
  /**
   * 返回上一页
   */
  goBack: function() {
    wx.navigateBack()
  },
  
  /**
   * 切换收藏状态
   */
  toggleFavorite: function() {
    if (!this.data.recipe || !this.data.recipeId) return
    
    const isFavorite = this.data.isFavorite
    const recipeId = this.data.recipeId
    
    // 调用相应的云函数
    const functionName = isFavorite ? 'removeFavorite' : 'addFavorite'
    
    wx.showLoading({
      title: isFavorite ? '取消收藏中' : '收藏中',
      mask: true
    })
    
    wx.cloud.callFunction({
      name: functionName,
      data: {
        recipeId: recipeId
      },
      success: res => {
        if (res.result && res.result.success) {
          this.setData({
            isFavorite: !isFavorite
          })
          
          wx.showToast({
            title: isFavorite ? '已取消收藏' : '已收藏',
            icon: 'success'
          })
        } else {
          wx.showToast({
            title: '操作失败',
            icon: 'none'
          })
        }
      },
      fail: err => {
        console.error('收藏操作失败:', err)
        wx.showToast({
          title: '操作失败',
          icon: 'none'
        })
      },
      complete: () => {
        wx.hideLoading()
      }
    })
  },
  
  /**
   * 切换各个部分的显示状态
   */
  toggleNutrition: function() {
    this.setData({ showNutrition: !this.data.showNutrition })
  },
  
  toggleSteps: function() {
    this.setData({ showSteps: !this.data.showSteps })
  },
  
  toggleIngredients: function() {
    this.setData({ showIngredients: !this.data.showIngredients })
  },
  
  toggleTips: function() {
    this.setData({ showTips: !this.data.showTips })
  },
  
  toggleComments: function() {
    this.setData({ showComments: !this.data.showComments })
  },
  
  /**
   * 添加到购物清单
   */
  addToShoppingList: function(e) {
    // 阻止事件冒泡
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    
    if (!this.data.recipe || !this.data.recipe.ingredients || this.data.recipe.ingredients.length === 0) {
      wx.showToast({
        title: '无法添加，食材信息不完整',
        icon: 'none'
      })
      return
    }
    
    // 获取当前购物清单
    let shoppingList = wx.getStorageSync('shoppingList') || []
    
    // 添加食材到购物清单
    const newItems = []
    this.data.recipe.ingredients.forEach(ingredient => {
      // 检查是否已存在
      const existingIndex = shoppingList.findIndex(item => item.name === ingredient.name)
      
      if (existingIndex === -1) {
        // 如果不存在，添加新项
        const newItem = {
          name: ingredient.name,
          amount: ingredient.amount,
          unit: ingredient.unit,
          checked: false,
          recipe: this.data.recipe.name,
          addTime: new Date().getTime()
        }
        shoppingList.push(newItem)
        newItems.push(newItem)
      }
    })
    
    // 保存更新后的购物清单
    wx.setStorageSync('shoppingList', shoppingList)
    
    // 显示添加成功的提示，并提供进入购物车的选项
    wx.showModal({
      title: '添加成功',
      content: `已添加${newItems.length}个食材到购物车，是否立即查看？`,
      confirmText: '去购物车',
      cancelText: '继续浏览',
      success: (res) => {
        if (res.confirm) {
          // 用户点击"去购物车"，跳转到购物车页面
          wx.navigateTo({
            url: '/pages/cart/cart'
          })
        }
      }
    })
  },
  
  /**
   * 显示评分模态框
   */
  showRatingModal: function() {
    this.setData({
      ratingModalVisible: true,
      userRating: 0,
      commentContent: ''
    })
  },
  
  /**
   * 设置用户评分
   */
  setUserRating: function(e) {
    const rating = parseInt(e.currentTarget.dataset.rating)
    this.setData({ userRating: rating })
  },
  
  /**
   * 更新评论内容
   */
  onCommentInput: function(e) {
    this.setData({ commentContent: e.detail.value })
  },
  
  /**
   * 提交评价
   */
  submitRating: function() {
    if (this.data.userRating === 0) {
      wx.showToast({
        title: '请选择评分',
        icon: 'none'
      })
      return
    }
    
    // 检查用户是否登录
    if (!app.globalData.isLoggedIn) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再评价',
        showCancel: true,
        cancelText: '取消',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/login/login'
            })
          }
        }
      })
      return
    }
    
    const comment = {
      rating: this.data.userRating,
      content: this.data.commentContent.trim(),
      recipeId: this.data.recipeId,
      createdAt: new Date().toISOString()
    }
    
    wx.showLoading({
      title: '提交评价中',
      mask: true
    })
    
    wx.cloud.callFunction({
      name: 'addComment',
      data: comment,
      success: res => {
        if (res.result && res.result.success) {
          // 更新本地数据
          const recipe = this.data.recipe
          const userInfo = app.globalData.userInfo || {}
          const newComment = {
            id: utils.generateUniqueId(),
            ...comment,
            userName: userInfo.nickName || '匿名用户',
            userAvatar: '',
            createdAt: utils.formatTime(new Date())
          }
          
          recipe.comments = recipe.comments || []
          recipe.comments.unshift(newComment)
          recipe.ratingCount = (recipe.ratingCount || 0) + 1
          recipe.rating = ((recipe.rating || 0) * (recipe.ratingCount - 1) + comment.rating) / recipe.ratingCount
          
          this.setData({
            recipe: recipe,
            ratingModalVisible: false
          })
          
          wx.showToast({
            title: '评价成功',
            icon: 'success'
          })
        } else {
          wx.showToast({
            title: '评价失败',
            icon: 'none'
          })
        }
      },
      fail: err => {
        console.error('提交评价失败:', err)
        wx.showToast({
          title: '评价失败',
          icon: 'none'
        })
      },
      complete: () => {
        wx.hideLoading()
      }
    })
  },
  
  /**
   * 关闭评分模态框
   */
  closeRatingModal: function() {
    this.setData({ ratingModalVisible: false })
  },
  
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {
    const recipe = this.data.recipe
    return {
      title: `健康食谱: ${recipe ? recipe.name : '推荐食谱'}`,
      path: `/pages/details/detail?id=${this.data.recipeId}`,
      imageUrl: recipe && recipe.image ? recipe.image : ''
    }
  }
}) 