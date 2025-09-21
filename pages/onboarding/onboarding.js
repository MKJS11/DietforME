// pages/onboarding/onboarding.js
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    currentStep: 0,
    totalSteps: 4,
    buttonPressedPrimary: false,
    buttonPressedSecondary: false,
    userInfo: {
      age: '',
      gender: '',
      height: '',
      weight: '',
      diseases: [],
      healthStatus: [],
      dietPreferences: []
    },
    diseaseOptions: [
      { name: '糖尿病', value: 'diabetes', checked: false },
      { name: '高血压', value: 'hypertension', checked: false },
      { name: '心脏病', value: 'heartDisease', checked: false },
      { name: '肾病', value: 'kidneyDisease', checked: false },
      { name: '无', value: 'none', checked: false }
    ],
    healthStatusOptions: [
      { name: '体重过重', value: 'overweight', checked: false },
      { name: '体重过轻', value: 'underweight', checked: false },
      { name: '经常运动', value: 'activeLifestyle', checked: false },
      { name: '久坐生活', value: 'sedentaryLifestyle', checked: false },
      { name: '睡眠不足', value: 'lackOfSleep', checked: false },
      { name: '压力大', value: 'highStress', checked: false }
    ],
    dietPreferenceOptions: [
      { name: '素食', value: 'vegetarian', checked: false },
      { name: '低碳水', value: 'lowCarb', checked: false },
      { name: '高蛋白', value: 'highProtein', checked: false },
      { name: '低脂肪', value: 'lowFat', checked: false },
      { name: '无麸质', value: 'glutenFree', checked: false },
      { name: '无乳糖', value: 'lactoseFree', checked: false }
    ],
    genderOptions: [
      { name: '男', value: 'male' },
      { name: '女', value: 'female' },
      { name: '其他', value: 'other' }
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log('引导页面加载');
    
    // 清除可能存在的请求标记，确保新的请求可以正常进行
    wx.setStorageSync('isRequestingRecipes', false);
    wx.removeStorageSync('recipeRequestTime');
    
    // 检查是否已完成首次记录
    const hasCompletedFirstRecord = wx.getStorageSync('hasCompletedFirstRecord');
    if (hasCompletedFirstRecord) {
      console.log('用户已完成首次记录，跳转到首页');
      wx.switchTab({
        url: '/pages/index/index'
      });
      return;
    }
    
    // 尝试从本地存储或全局数据获取用户信息
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');
    
    if (userInfo) {
      // 如果有用户信息，预填充表单
      this.setData({
        userInfo: userInfo
      });
      
      // 更新复选框状态
      this.updateCheckboxStates();
    }
  },

  // 更新复选框状态
  updateCheckboxStates: function() {
    const { userInfo } = this.data;
    
    // 更新疾病选项
    if (userInfo.diseases && userInfo.diseases.length > 0) {
      const diseaseOptions = this.data.diseaseOptions.map(function(option) {
        return Object.assign({}, option, {
          checked: userInfo.diseases.includes(option.value)
        });
      });
      
      this.setData({
        diseaseOptions: diseaseOptions
      });
    }
    
    // 更新健康状态选项
    if (userInfo.healthStatus && userInfo.healthStatus.length > 0) {
      const healthStatusOptions = this.data.healthStatusOptions.map(function(option) {
        return Object.assign({}, option, {
          checked: userInfo.healthStatus.includes(option.value)
        });
      });
      
      this.setData({
        healthStatusOptions: healthStatusOptions
      });
    }
    
    // 更新饮食偏好选项
    if (userInfo.dietPreferences && userInfo.dietPreferences.length > 0) {
      const dietPreferenceOptions = this.data.dietPreferenceOptions.map(function(option) {
        return Object.assign({}, option, {
          checked: userInfo.dietPreferences.includes(option.value)
        });
      });
      
      this.setData({
        dietPreferenceOptions: dietPreferenceOptions
      });
    }
  },

  // 处理按钮触摸开始事件
  handleButtonTouchStart: function(e) {
    const buttonType = e.currentTarget.dataset.button;
    if (buttonType === 'primary') {
      this.setData({
        buttonPressedPrimary: true
      });
    } else if (buttonType === 'secondary') {
      this.setData({
        buttonPressedSecondary: true
      });
    }
  },

  // 处理按钮触摸结束事件
  handleButtonTouchEnd: function(e) {
    const buttonType = e.currentTarget.dataset.button;
    if (buttonType === 'primary') {
      this.setData({
        buttonPressedPrimary: false
      });
    } else if (buttonType === 'secondary') {
      this.setData({
        buttonPressedSecondary: false
      });
    }
  },

  // 处理输入框变化
  handleInputChange: function(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    this.setData({
      [`userInfo.${field}`]: value
    });
  },

  // 处理单选框变化
  handleRadioChange: function(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    this.setData({
      [`userInfo.${field}`]: value
    });
  },

  // 处理分段控件点击
  handleSegmentTap: function(e) {
    const { field, value } = e.currentTarget.dataset;
    
    // 添加轻触反馈
    if (wx.vibrateShort) {
      wx.vibrateShort({
        type: 'light'
      });
    }
    
    this.setData({
      [`userInfo.${field}`]: value
    });
  },

  // 处理复选框变化
  handleCheckboxChange: function(e) {
    const { field } = e.currentTarget.dataset;
    const values = e.detail.value;
    
    this.setData({
      [`userInfo.${field}`]: values
    });
  },

  // 切换复选框状态
  toggleCheckbox: function(e) {
    const { field, index } = e.currentTarget.dataset;
    
    // 根据field确定正确的options字段名
    let fieldOptions;
    if (field === 'diseases') {
      fieldOptions = 'diseaseOptions';
    } else if (field === 'healthStatus') {
      fieldOptions = 'healthStatusOptions';
    } else if (field === 'dietPreferences') {
      fieldOptions = 'dietPreferenceOptions';
    } else {
      console.error(`未知字段: ${field}`);
      return;
    }
    
    // 检查fieldOptions是否存在
    if (!this.data[fieldOptions] || !this.data[fieldOptions][index]) {
      console.error(`字段 ${fieldOptions} 或索引 ${index} 不存在`);
      return;
    }
    
    const option = this.data[fieldOptions][index];
    const checked = !option.checked;
    
    // 更新选项的checked状态
    this.setData({
      [`${fieldOptions}[${index}].checked`]: checked
    });
    
    // 更新userInfo中的数组，使用slice()代替扩展运算符
    let values = Array.isArray(this.data.userInfo[field]) ? this.data.userInfo[field].slice(0) : [];
    if (checked) {
      // 如果选中，添加到数组
      if (!values.includes(option.value)) {
        values.push(option.value);
      }
    } else {
      // 如果取消选中，从数组中移除
      values = values.filter(v => v !== option.value);
    }
    
    this.setData({
      [`userInfo.${field}`]: values
    });
  },

  // 下一步
  nextStep: function() {
    const { currentStep, totalSteps } = this.data;
    
    if (currentStep < totalSteps - 1) {
      this.setData({
        currentStep: currentStep + 1
      });
    } else {
      this.completeOnboarding();
    }
  },

  // 上一步
  prevStep: function() {
    const { currentStep } = this.data;
    
    if (currentStep > 0) {
      this.setData({
        currentStep: currentStep - 1
      });
    }
  },

  // 完成引导流程
  completeOnboarding: function() {
    // 保存用户信息到本地存储
    const userInfo = this.data.userInfo;
    
    // 确保数值类型正确
    userInfo.age = parseInt(userInfo.age) || 25;
    userInfo.height = parseFloat(userInfo.height) || 170;
    userInfo.weight = parseFloat(userInfo.weight) || 65;
    
    console.log('保存用户信息到本地存储:', userInfo);
    
    // 保存到本地存储
    wx.setStorageSync('userInfo', userInfo);
    wx.setStorageSync('hasCompletedOnboarding', true);
    
    // 更新全局数据
    app.globalData.userInfo = userInfo;
    app.globalData.isLoggedIn = true;
    
    // 在后台处理数据上传
    this.backgroundProcessing(userInfo);
    
    // 直接跳转到主页
    wx.reLaunch({
      url: '/pages/index/index'
    });
  },
  
  // 后台异步处理
  backgroundProcessing: function(userInfo) {
    // 先确保登录并获取openid，然后再上传用户信息
    this.ensureLogin()
      .then(openid => {
        console.log('已获取openid:', openid);
        
        // 添加openid到userInfo
        userInfo.openid = openid;
        
        // 上传用户信息到云数据库
        this.callUpdateUserInfoCloud(userInfo);
      })
      .catch(err => {
        console.error('登录失败:', err);
      });
  },
  
  // 确保登录并获取openid
  ensureLogin: function() {
    return new Promise((resolve, reject) => {
      // 检查是否已有openid
      if (app.globalData.openid) {
        console.log('已有openid:', app.globalData.openid);
        resolve(app.globalData.openid);
        return;
      }
      
      // 从本地存储获取
      const storedOpenid = wx.getStorageSync('openid');
      if (storedOpenid) {
        console.log('从本地存储获取openid:', storedOpenid);
        app.globalData.openid = storedOpenid;
        resolve(storedOpenid);
        return;
      }
      
      // 调用登录方法获取
      console.log('调用登录方法获取openid');
      app.login()
        .then(openid => {
          console.log('登录成功，获取到openid:', openid);
          resolve(openid);
        })
        .catch(err => {
          console.error('登录失败:', err);
          reject(err);
        });
    });
  },

  // 上传用户信息到云数据库
  uploadUserInfoToCloud: function(userInfo) {
    // 确保已登录
    if (!app.globalData.openid) {
      // 如果未登录，先登录
      app.login()
        .then(openid => {
          // 登录成功后上传用户信息
          this.callUpdateUserInfoCloud(userInfo);
        })
        .catch(err => {
          console.error('登录失败，无法上传用户信息:', err);
        });
    } else {
      // 已登录，直接上传用户信息
      this.callUpdateUserInfoCloud(userInfo);
    }
  },

  // 调用更新用户信息云函数
  callUpdateUserInfoCloud: function(userInfo) {
    wx.cloud.callFunction({
      name: 'updateUserInfo',
      data: {
        userInfo: userInfo
      },
      success: res => {
        console.log('上传用户信息成功:', res.result);
      },
      fail: err => {
        console.error('上传用户信息失败:', err);
      }
    });
  }
}) 