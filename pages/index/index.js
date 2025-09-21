// index.js
Page({
  data: {
    activeTab: 'home',
    isRefreshing: false,
    // 用户信息
    hasUserInfo: false,
    userInfo: {
      age: 28,
      height: 175,
      weight: 70
    },
    // BMI数据
    bmiValue: '22.9',
    bmiStatus: '正常',
    bmiClass: 'good',
    // 饮水数据
    waterIntake: {
      current: 0,
      target: 2000
    },
    // 是否正在喝水动画中
    isDrinking: false,
    // 卡路里数据
    calorieIntake: {
      current: 0,
      target: 2200
    },
    // 烟花数据
    fireworks: [],
    showingFireworks: false,
    // 饮食建议
    dietTips: [
      {
        title: '多吃水果',
        desc: '每天摄入2-3份新鲜水果有助于提供维生素和抗氧化物',
        iconClass: 'tip-icon-fruits',
        sfSymbol: 'icon-fruits'
      },
      {
        title: '优质蛋白质',
        desc: '选择瘦肉、鱼类和豆制品作为蛋白质来源',
        iconClass: 'tip-icon-protein',
        sfSymbol: 'icon-protein'
      },
      {
        title: '保持水分',
        desc: '每天至少饮用2000ml水，保持身体水分平衡',
        iconClass: 'tip-icon-water',
        sfSymbol: 'icon-hydration'
      }
    ]
  },

  onLoad: function() {
    // 从本地存储加载用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        userInfo: userInfo,
        hasUserInfo: true
      });
      console.log('从本地存储加载的用户信息:', userInfo);
    }
    
    // 从本地存储加载饮水记录
    const waterIntake = wx.getStorageSync('waterIntake') || { current: 0, target: 2000 };
    this.setData({
      waterIntake: waterIntake
    });

    // 从本地存储加载卡路里数据
    const calorieIntake = wx.getStorageSync('calorieIntake') || { current: 0, target: 2200 };
    this.setData({
      calorieIntake: calorieIntake
    });
    
    // 初始化数据
    this.calculateBMI();
    this.getDietTips();
  },

  /**
   * 生命周期函数--监听页面显示
   * 每次页面显示时都会执行，包括从其他页面返回时
   */
  onShow: function() {
    // 从本地存储刷新卡路里数据
    const calorieIntake = wx.getStorageSync('calorieIntake') || { current: 0, target: 2200 };
    this.setData({
      calorieIntake: calorieIntake
    });
    console.log('页面显示，已更新卡路里数据:', calorieIntake);
  },

  // 喝水动作
  drinkWater: function() {
    // 如果已经在喝水动画中，则不处理
    if (this.data.isDrinking) return;
    
    // 如果已经达到目标，提示用户
    if (this.data.waterIntake.current >= this.data.waterIntake.target) {
      this.showFireworks();
      return;
    }
    
    // 设置为正在喝水状态
    this.setData({
      isDrinking: true
    });
    
    // 增加喝水量
    const addAmount = 100; // 修改为100ml
    const currentAmount = this.data.waterIntake.current;
    const targetAmount = this.data.waterIntake.target;
    let newAmount = currentAmount + addAmount;
    
    // 防止超过目标
    if (newAmount > targetAmount) {
      newAmount = targetAmount;
    }
    
    // 更新数据
    this.setData({
      'waterIntake.current': newAmount
    });
    
    // 保存到本地存储
    wx.setStorageSync('waterIntake', this.data.waterIntake);
    
    // 显示提示
    wx.showToast({
      title: `+${addAmount}ml 水`,
      icon: 'success',
      duration: 1500
    });
    
    // 检查是否达到目标
    if (newAmount >= targetAmount) {
      setTimeout(() => {
        this.showFireworks();
      }, 1500);
    }
    
    // 重置喝水状态
    setTimeout(() => {
      this.setData({
        isDrinking: false
      });
    }, 500);
  },

  // 显示烟花特效
  showFireworks: function() {
    if (this.data.showingFireworks) return;
    
    this.setData({
      showingFireworks: true
    });

    const fireworks = [];
    const fireworksCount = 15; // 增加烟花数量
    const colors = [
      '#ff3333,#ff9933',
      '#ff33ff,#9933ff',
      '#33ff33,#33ff99',
      '#3333ff,#33ffff',
      '#ffff33,#ffcc33'
    ];
    
    // 创建多个烟花
    for (let i = 0; i < fireworksCount; i++) {
      setTimeout(() => {
        // 随机位置和颜色
        const left = 20 + Math.random() * 60; // 限制在屏幕中间区域
        const top = 30 + Math.random() * 40; // 限制在屏幕上半部分
        const colorPair = colors[Math.floor(Math.random() * colors.length)];
        const scale = 0.5 + Math.random() * 1.5; // 随机大小
        
        const newFirework = {
          id: Date.now() + i,
          left: left + '%',
          top: top + '%',
          delay: i * 200, // 减少延迟时间
          color: colorPair,
          scale: scale
        };
        
        fireworks.push(newFirework);
        this.setData({
          fireworks: fireworks
        });

        // 移除烟花
        setTimeout(() => {
          const updatedFireworks = this.data.fireworks.filter(f => f.id !== newFirework.id);
          this.setData({
            fireworks: updatedFireworks
          });
        }, 1500); // 延长烟花持续时间
      }, i * 200);
    }

    // 显示祝贺文本
    wx.showModal({
      title: '🎉 恭喜！',
      content: '您已完成今日饮水目标！继续保持健康的饮水习惯！',
      showCancel: false,
      confirmText: '太棒了',
      success: (res) => {
        if (res.confirm) {
          console.log('用户点击确定');
        }
      }
    });

    // 重置烟花状态
    setTimeout(() => {
      this.setData({
        showingFireworks: false,
        fireworks: []
      });
    }, fireworksCount * 200 + 1500);
  },

  // 处理下拉刷新
  onRefresh() {
    if (this.data.isRefreshing) {
      return;
    }
    
    this.setData({
      isRefreshing: true
    });
    
    setTimeout(() => {
      // 模拟刷新数据
      this.calculateBMI();
      
      // 更新水量
      const waterIntake = wx.getStorageSync('waterIntake') || { current: 0, target: 2000 };
      this.setData({
        waterIntake: waterIntake,
        isRefreshing: false
      });
      
      wx.showToast({
        title: '刷新成功',
        icon: 'success',
        duration: 1000
      });
    }, 1500);
  },

  // 计算BMI
  calculateBMI: function() {
    // 从用户信息中获取身高体重
    const height = this.data.userInfo.height / 100; // 转换为米
    const weight = this.data.userInfo.weight;
    
    // 计算BMI值
    let bmi = weight / (height * height);
    bmi = bmi.toFixed(1);
    
    // 判断BMI状态
    let status, bmiClass;
    if (bmi < 18.5) {
      status = '偏瘦';
      bmiClass = 'warning';
    } else if (bmi >= 18.5 && bmi < 24.9) {
      status = '正常';
      bmiClass = 'good';
    } else if (bmi >= 24.9 && bmi < 29.9) {
      status = '偏重';
      bmiClass = 'warning';
    } else {
      status = '肥胖';
      bmiClass = 'danger';
    }
    
    // 更新数据
    this.setData({
      bmiValue: bmi,
      bmiStatus: status,
      bmiClass: bmiClass
    });
    
    console.log('BMI计算结果:', bmi, status, bmiClass);
  },

  // 获取饮食建议
  getDietTips: function() {
    // 这里可以添加从服务器获取今日饮食建议的逻辑
    // 目前使用静态数据
  },

  // 添加水摄入量
  addWaterIntake: function() {
    const current = this.data.waterIntake.current;
    const target = this.data.waterIntake.target;
    
    if (current < target) {
      const newValue = Math.min(current + 100, target);
      
      this.setData({
        'waterIntake.current': newValue
      });
      
      // 保存到本地存储
      wx.setStorageSync('waterIntake', this.data.waterIntake);
      
      wx.showToast({
        title: '+200ml 水',
        icon: 'success',
        duration: 1500
      });
    } else {
      wx.showToast({
        title: '今日目标已完成',
        icon: 'success',
        duration: 1500
      });
    }
  },

  // 显示BMI详情
  showBmiDetails: function() {
    wx.showModal({
      title: 'BMI详情',
      content: `您的BMI指数为${this.data.bmiValue}，属于${this.data.bmiStatus}范围。\n\nBMI范围参考：\n低于18.5：偏瘦\n18.5-24.9：正常\n25-29.9：偏重\n30及以上：肥胖`,
      showCancel: false,
      confirmText: '我知道了'
    });
  },

  // 显示卡路里详情
  showCalorieDetails: function() {
    wx.showModal({
      title: '热量摄入详情',
      content: `今日已摄入${this.data.calorieIntake.current}千卡，目标${this.data.calorieIntake.target}千卡。\n\n根据您的身高、体重和活动水平，建议每日摄入${this.data.calorieIntake.target}千卡以维持健康体重。`,
      showCancel: false,
      confirmText: '我知道了'
    });
  },

  // 查看所有饮食建议
  viewAllTips: function() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none',
      duration: 1500
    });
  },

  // 前往设置页面
  goToSettings: function() {
    wx.navigateTo({
      url: '/pages/settings/settings'
    });
  },
  
  // 前往食谱推荐页面
  goToRecipes: function() {
    wx.navigateTo({
      url: '/pages/todayr/todayr',
      success: function() {
        console.log('成功跳转到食谱推荐页面');
      },
      fail: function(error) {
        console.error('跳转到食谱推荐页面失败:', error);
        wx.showToast({
          title: '跳转失败，请重试',
          icon: 'none',
          duration: 1500
        });
      }
    });
  },
  
  // 前往今日记录页面
  goToRecord: function() {
    wx.navigateTo({
      url: '/pages/record/record',
      success: function() {
        console.log('成功跳转到今日记录页面');
      },
      fail: function(error) {
        console.error('跳转到今日记录页面失败:', error);
        wx.showToast({
          title: '跳转失败，请重试',
          icon: 'none',
          duration: 1500
        });
      }
    });
  },

  // 重置水量
  resetWaterIntake: function() {
    wx.showModal({
      title: '确认重置',
      content: '确定要重置今日的饮水量吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            'waterIntake.current': 0
          });
          
          // 保存到本地存储
          wx.setStorageSync('waterIntake', this.data.waterIntake);
          
          wx.showToast({
            title: '已重置饮水量',
            icon: 'success',
            duration: 1500
          });
        }
      }
    });
  },

  // 刷新水量
  refreshWaterIntake: function() {
    const waterIntake = wx.getStorageSync('waterIntake') || { current: 0, target: 2000 };
    this.setData({
      waterIntake: waterIntake
    });
    
    wx.showToast({
      title: '已刷新数据',
      icon: 'success',
      duration: 1500
    });
  },
});
