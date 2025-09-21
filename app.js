// app.js
// 加载Babel运行时helpers
require('./utils/babel-runtime/index');

App({
  globalData: {
    userInfo: null,
    isLoggedIn: false,
    openid: null
  },
  
  onLaunch: function() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'cloud1-0gb51bqmd479e34c',
        traceUser: true
      });
      console.log('云开发初始化成功');
      
      // 获取用户登录状态
      this.checkLoginStatus();
    }
  },
  
  // 检查用户登录状态
  checkLoginStatus: function() {
    // 从本地存储获取用户信息
    const userInfo = wx.getStorageSync('userInfo');
    const openid = wx.getStorageSync('openid');
    
    if (userInfo && openid) {
      this.globalData.userInfo = userInfo;
      this.globalData.isLoggedIn = true;
      this.globalData.openid = openid;
      console.log('用户已登录', openid);
    } else {
      console.log('用户未登录');
    }
  },
  
  // 用户登录
  login: function() {
    return new Promise((resolve, reject) => {
      // 调用云函数获取openid
      wx.cloud.callFunction({
        name: 'login',
        success: res => {
          console.log('云函数调用成功', res);
          const openid = res.result.openid;
          this.globalData.openid = openid;
          wx.setStorageSync('openid', openid);
          resolve(openid);
        },
        fail: err => {
          console.error('云函数调用失败', err);
          reject(err);
        }
      });
    });
  }
})
