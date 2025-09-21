// pages/history/history.js
const app = getApp()
const db = wx.cloud.database()
const _ = db.command

Page({

  /**
   * 页面的初始数据
   */
  data: {
    currentDate: '',
    dayRecords: [],
    totalCalories: 0,
    selectedFoodIndex: -1
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.setToday()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.loadDayRecords()
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.loadDayRecords().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  // 设置当前日期为今天
  setToday() {
    const today = new Date()
    const dateStr = this.formatDate(today)
    this.setData({
      currentDate: dateStr
    })
  },

  // 格式化日期为 YYYY-MM-DD
  formatDate(date) {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  // 加载当日记录
  async loadDayRecords() {
    wx.showLoading({
      title: '加载中...',
    })

    try {
      const { currentDate } = this.data
      
      // 计算当天开始和结束时间
      const startDate = new Date(currentDate)
      startDate.setHours(0, 0, 0, 0)
      
      const endDate = new Date(currentDate)
      endDate.setHours(23, 59, 59, 999)
      
      // 获取用户ID
      const userId = wx.getStorageSync('openid') || app.globalData.openid || '{openid}'
      
      console.log('查询日期范围:', startDate, '至', endDate)
      console.log('当前用户ID:', userId)
      
      // 查询当天的食物历史记录
      const res = await db.collection('foodhistory')
        .where({
          userId: userId,
          createTime: _.gte(startDate).and(_.lte(endDate))
        })
        .orderBy('createTime', 'desc')
        .get()

      console.log('查询结果:', res.data)

      let totalCal = 0
      const records = res.data.map(item => {
        // 计算总卡路里
        const calories = typeof item.calories === 'number' ? item.calories : 
                        (typeof item.calories === 'string' && !isNaN(parseFloat(item.calories))) ? 
                        parseFloat(item.calories) : 0
        
        totalCal += calories
        
        // 格式化时间
        let formattedTime = '未知'
        if (item.createTime) {
          const date = new Date(item.createTime)
          const hours = date.getHours().toString().padStart(2, '0')
          const minutes = date.getMinutes().toString().padStart(2, '0')
          formattedTime = `${hours}:${minutes}`
        }
        
        return {
          ...item,
          foodName: item.name || '未知食物',
          calories: calories.toFixed(0),
          formattedTime: formattedTime
        }
      })

      // 如果有记录，标记已完成首次记录
      if (records.length > 0) {
        wx.setStorageSync('hasCompletedFirstRecord', true);
      }

      this.setData({
        dayRecords: records,
        totalCalories: totalCal.toFixed(0),
        selectedFoodIndex: -1
      })

      // 同步卡路里数据到全局和本地存储
      const calorieIntake = {
        current: parseFloat(totalCal.toFixed(0)),
        target: 2200  // 保持与首页相同的目标值
      };
      wx.setStorageSync('calorieIntake', calorieIntake);
      
      // 通知首页更新数据
      const pages = getCurrentPages();
      const indexPage = pages.find(page => page.route === 'pages/index/index');
      if (indexPage) {
        indexPage.setData({
          'calorieIntake': calorieIntake
        });
      }
    } catch (err) {
      console.error('加载记录失败：', err)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }

    wx.hideLoading()
  },

  // 切换到前一天
  prevDay() {
    const currentDate = new Date(this.data.currentDate)
    currentDate.setDate(currentDate.getDate() - 1)
    this.setData({
      currentDate: this.formatDate(currentDate)
    })
    this.loadDayRecords()
  },

  // 切换到后一天
  nextDay() {
    const currentDate = new Date(this.data.currentDate)
    currentDate.setDate(currentDate.getDate() + 1)
    this.setData({
      currentDate: this.formatDate(currentDate)
    })
    this.loadDayRecords()
  },

  // 触摸开始事件
  touchStart(e) {
    this.setData({
      touchStartX: e.touches[0].clientX
    })
  },

  // 触摸结束事件
  touchEnd(e) {
    const touchEndX = e.changedTouches[0].clientX
    const { touchStartX } = this.data
    const threshold = 50 // 滑动阈值

    if (touchStartX - touchEndX > threshold) {
      // 向左滑动，显示下一天
      this.nextDay()
    } else if (touchEndX - touchStartX > threshold) {
      // 向右滑动，显示前一天
      this.prevDay()
    }
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
  },
  
  // 查看食物详情
  viewFoodDetail(e) {
    const index = e.currentTarget.dataset.index
    
    // 如果点击的是已选中的项，则取消选中
    if (this.data.selectedFoodIndex === index) {
      this.setData({
        selectedFoodIndex: -1
      })
    } else {
      this.setData({
        selectedFoodIndex: index
      })
    }
  }
}) 