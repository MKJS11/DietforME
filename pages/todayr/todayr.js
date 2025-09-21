const { getTodayRecipes } = require('../../utils/reapi');

// 星期几的中文名称
const DAY_NAMES = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

Page({
  data: {
    recipes: [],
    loading: true,
    error: null,
    categories: ['早餐', '午餐', '晚餐', '零食', '饮料'],
    selectedCategory: '早餐',
    saving: false,
    // 日期和天气数据
    currentDate: '',
    dayName: '',
    weather: {
      temperature: '--',
      description: '未知',
      location: '当前位置'
    },
    featuredRecipes: [
      {
        id: 1,
        name: 'Pancake',
        image: '/images/pancake.jpg',
        rating: 5
      },
      {
        id: 2,
        name: 'Mie Ijo',
        image: '/images/mie.jpg',
        rating: 5
      },
      {
        id: 3,
        name: 'Salad telur',
        image: '/images/salad.jpg',
        rating: 3
      }
    ],
    otherRecipes: [
      {
        id: 4,
        name: 'Omelete nasi goreng',
        image: '/images/omelete.jpg'
      }
    ]
  },

  onLoad() {
    this.updateDateTime();
    this.loadWeather();
    this.loadTodayRecipes();
  },

  // 更新日期时间
  updateDateTime() {
    const now = new Date();
    const date = now.getDate();
    const month = now.getMonth() + 1;
    const dayIndex = now.getDay();
    
    this.setData({
      currentDate: `${month}月${date}日`,
      dayName: DAY_NAMES[dayIndex]
    });
  },

  // 加载天气信息
  loadWeather() {
    const self = this;
    // 获取位置信息
    wx.getLocation({
      type: 'wgs84',
      success(res) {
        const latitude = res.latitude;
        const longitude = res.longitude;
        
        // 获取天气信息（可以用自己的天气API替换）
        wx.request({
          url: `https://devapi.qweather.com/v7/weather/now`,
          data: {
            key: 'YOUR_WEATHER_API_KEY', // 需要替换为实际的API密钥
            location: `${longitude},${latitude}`
          },
          success(res) {
            if (res.statusCode === 200 && res.data && res.data.now) {
              self.setData({
                'weather.temperature': res.data.now.temp,
                'weather.description': res.data.now.text
              });
            }
          },
          fail() {
            // 如果API调用失败，设置默认天气
            self.setMockWeather();
          }
        });
        
        // 获取位置名称
        wx.reverseGeocoder({
          location: {
            latitude,
            longitude
          },
          success(res) {
            if (res.status === 0 && res.result) {
              self.setData({
                'weather.location': res.result.address_component.district
              });
            }
          }
        });
      },
      fail() {
        // 如果无法获取位置，设置默认天气
        self.setMockWeather();
      }
    });
  },
  
  // 设置模拟天气（当无法获取实际天气时）
  setMockWeather() {
    const temperatures = [18, 20, 22, 24, 25, 26, 28];
    const descriptions = ['晴', '多云', '小雨', '阴'];
    
    const temp = temperatures[Math.floor(Math.random() * temperatures.length)];
    const desc = descriptions[Math.floor(Math.random() * descriptions.length)];
    
    this.setData({
      'weather.temperature': temp,
      'weather.description': desc
    });
  },

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  },

  onRecipeTap(e) {
    const recipe = e.currentTarget.dataset.recipe;
    wx.navigateTo({
      url: `/pages/recipe-detail/recipe-detail?id=${encodeURIComponent(JSON.stringify(recipe))}`
    });
  },

  async loadTodayRecipes() {
    try {
      this.setData({ loading: true, error: null });
      const userInfo = wx.getStorageSync('userInfo');
      
      if (!userInfo) {
        throw new Error('请先完善个人信息');
      }

      // 从API获取今日推荐食谱
      const recipes = await getTodayRecipes(userInfo);
      
      // 保存到本地存储
      wx.setStorageSync('recipes', recipes);
      wx.setStorageSync('lastUpdated', new Date().toISOString());
      
      this.setData({
        recipes,
        loading: false
      });
    } catch (error) {
      this.setData({
        error: error.message || '获取食谱失败',
        loading: false
      });
    }
  },

  // 刷新按钮点击事件
  async onRefreshTap() {
    // 添加loading效果
    const refreshBtn = this.selectComponent('.refresh-btn');
    if (refreshBtn) {
      refreshBtn.addClass('loading');
    }
    
    try {
      await this.loadTodayRecipes();
      wx.showToast({
        title: '刷新成功',
        icon: 'success',
        duration: 1500
      });
    } catch (error) {
      wx.showToast({
        title: error.message || '刷新失败',
        icon: 'error',
        duration: 1500
      });
    } finally {
      // 移除loading效果
      if (refreshBtn) {
        refreshBtn.removeClass('loading');
      }
    }
  },

  onCategoryChange(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({ selectedCategory: category });
  },

  getFilteredRecipes() {
    return this.data.recipes.filter(recipe => 
      recipe.categories.includes(this.data.selectedCategory));
  },

  async saveRecipe(e) {
    const { recipe } = e.currentTarget.dataset;
    
    try {
      this.setData({ saving: true });
      const openid = wx.getStorageSync('openid');
      
      if (!openid) {
        throw new Error('请先登录');
      }

      await wx.cloud.callFunction({
        name: 'saveRecipe',
        data: {
          recipe,
          openid
        }
      });

      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });
    } catch (error) {
      wx.showToast({
        title: error.message || '保存失败',
        icon: 'none'
      });
    } finally {
      this.setData({ saving: false });
    }
  },

  onPullDownRefresh() {
    this.updateDateTime();
    this.loadWeather();
    this.loadTodayRecipes().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  onShareAppMessage() {
    return {
      title: '今日食谱推荐',
      path: '/pages/todayr/todayr'
    };
  }
});