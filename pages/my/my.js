const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    userInfo: null,
    isLoggedIn: false,
    activeTab: 'my',
    isLoading: false,
    avatarUrl: '/images/default-avatar.png', // 默认头像
    healthData: {
      age: '--',
      gender: '--',
      height: '--',
      weight: '--',
      bmi: '--',
      bmiStatus: '--'
    },
    diseaseLabels: {
      'diabetes': '糖尿病',
      'hypertension': '高血压',
      'heartDisease': '心脏病',
      'kidneyDisease': '肾病',
      'none': '无'
    },
    healthStatusLabels: {
      'overweight': '体重过重',
      'underweight': '体重过轻',
      'activeLifestyle': '经常运动',
      'sedentaryLifestyle': '久坐生活',
      'lackOfSleep': '睡眠不足',
      'highStress': '压力大'
    },
    dietPreferenceLabels: {
      'vegetarian': '素食',
      'lowCarb': '低碳水',
      'highProtein': '高蛋白',
      'lowFat': '低脂肪',
      'glutenFree': '无麸质',
      'lactoseFree': '无乳糖'
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.checkLoginStatus();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.checkLoginStatus();
  },

  /**
   * 检查登录状态
   */
  checkLoginStatus: function () {
    // 从全局数据获取登录状态
    const isLoggedIn = app.globalData.isLoggedIn;
    const userInfo = app.globalData.userInfo;
    
    this.setData({
      isLoggedIn: isLoggedIn,
      userInfo: userInfo
    });
    
    if (isLoggedIn && userInfo) {
      this.updateHealthData(userInfo);
    }
  },

  /**
   * 更新健康数据
   */
  updateHealthData: function (userInfo) {
    // 计算BMI
    let bmi = '--';
    let bmiStatus = '--';
    
    if (userInfo.height && userInfo.weight) {
      const height = userInfo.height / 100; // 转换为米
      const weight = userInfo.weight;
      bmi = (weight / (height * height)).toFixed(1);
      
      if (bmi < 18.5) {
        bmiStatus = '偏瘦';
      } else if (bmi >= 18.5 && bmi < 24) {
        bmiStatus = '正常';
      } else if (bmi >= 24 && bmi < 28) {
        bmiStatus = '超重';
      } else if (bmi >= 28) {
        bmiStatus = '肥胖';
      }
    }
    
    this.setData({
      'healthData.age': userInfo.age || '--',
      'healthData.gender': this.formatGender(userInfo.gender),
      'healthData.height': userInfo.height ? userInfo.height + 'cm' : '--',
      'healthData.weight': userInfo.weight ? userInfo.weight + 'kg' : '--',
      'healthData.bmi': bmi,
      'healthData.bmiStatus': bmiStatus
    });
  },

  /**
   * 格式化性别
   */
  formatGender: function (gender) {
    if (gender === 'male') return '男';
    if (gender === 'female') return '女';
    if (gender === 'other') return '其他';
    return '--';
  },

  /**
   * 处理用户登录
   */
  handleLogin: function () {
    if (this.data.isLoading) return;
    
    this.setData({ isLoading: true });
    
    // 调用全局登录方法
    app.login()
      .then(openid => {
        console.log('登录成功，获取到openid:', openid);
        
        // 调用云函数获取用户信息
        wx.cloud.callFunction({
          name: 'getUserInfo',
          success: res => {
            console.log('获取用户信息成功:', res.result);
            
            if (res.result.success) {
              // 从云数据库获取到用户信息
              const cloudUserInfo = res.result.data;
              
              // 更新全局用户信息
              app.globalData.userInfo = cloudUserInfo;
              app.globalData.isLoggedIn = true;
              
              // 更新本地存储
              wx.setStorageSync('userInfo', cloudUserInfo);
              
              this.setData({
                isLoggedIn: true,
                userInfo: cloudUserInfo,
                isLoading: false
              });
              
              this.updateHealthData(cloudUserInfo);
              
              wx.showToast({
                title: '登录成功',
                icon: 'success',
                duration: 1500
              });
            } else {
              // 云数据库中没有用户信息，尝试从本地获取
              const localUserInfo = wx.getStorageSync('userInfo');
              
              if (localUserInfo) {
                // 如果本地有用户信息，上传到云数据库
                this.uploadUserInfoToCloud(localUserInfo, openid);
              } else {
                // 如果没有用户信息，跳转到引导页面
                this.setData({ isLoading: false });
                
                wx.showModal({
                  title: '提示',
                  content: '您尚未完善个人信息，是否前往设置？',
                  success: (res) => {
                    if (res.confirm) {
                      wx.navigateTo({
                        url: '/pages/onboarding/onboarding'
                      });
                    }
                  }
                });
              }
            }
          },
          fail: err => {
            console.error('获取用户信息失败:', err);
            this.setData({ isLoading: false });
            
            // 尝试从本地获取用户信息
            const userInfo = wx.getStorageSync('userInfo');
            
            if (userInfo) {
              // 如果本地有用户信息，使用本地信息
              app.globalData.userInfo = userInfo;
              app.globalData.isLoggedIn = true;
              
              this.setData({
                isLoggedIn: true,
                userInfo: userInfo,
                isLoading: false
              });
              
              this.updateHealthData(userInfo);
              
              // 尝试上传到云数据库
              this.uploadUserInfoToCloud(userInfo, openid);
            } else {
              wx.showToast({
                title: '登录失败，请重试',
                icon: 'none',
                duration: 1500
              });
            }
          }
        });
      })
      .catch(err => {
        console.error('登录失败:', err);
        this.setData({ isLoading: false });
        
        wx.showToast({
          title: '登录失败，请重试',
          icon: 'none',
          duration: 1500
        });
      });
  },

  /**
   * 上传用户信息到云数据库
   */
  uploadUserInfoToCloud: function (userInfo, openid) {
    wx.cloud.callFunction({
      name: 'updateUserInfo',
      data: {
        userInfo: userInfo
      },
      success: res => {
        console.log('上传用户信息成功:', res.result);
        
        // 更新全局用户信息
        app.globalData.userInfo = userInfo;
        app.globalData.isLoggedIn = true;
        
        this.setData({
          isLoggedIn: true,
          userInfo: userInfo,
          isLoading: false
        });
        
        this.updateHealthData(userInfo);
        
        wx.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 1500
        });
      },
      fail: err => {
        console.error('上传用户信息失败:', err);
        this.setData({ isLoading: false });
        
        wx.showToast({
          title: '同步信息失败',
          icon: 'none',
          duration: 1500
        });
      }
    });
  },

  /**
   * 退出登录
   */
  handleLogout: function () {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除登录状态
          app.globalData.isLoggedIn = false;
          app.globalData.userInfo = null;
          app.globalData.openid = null;
          
          // 清除本地存储中的openid
          wx.removeStorageSync('openid');
          
          this.setData({
            isLoggedIn: false,
            userInfo: null
          });
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success',
            duration: 1500
          });
        }
      }
    });
  },

  /**
   * 编辑个人信息
   */
  editUserInfo: function () {
    wx.navigateTo({
      url: '/pages/onboarding/onboarding'
    });
  },

  /**
   * 跳转到购物车页面
   */
  goToCart: function() {
    wx.navigateTo({
      url: '/pages/cart/cart'
    })
  }
})