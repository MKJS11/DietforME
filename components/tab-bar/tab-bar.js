Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 当前激活的标签页
    activeTab: {
      type: String,
      value: 'home'
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    // 页面路径映射
    pagePaths: {
      'home': '/pages/index/index',
      'recipe': '/pages/recipe/list',
      'my': '/pages/my/my',
      'history': '/pages/history/history',
      'cart': '/pages/cart/cart'
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 切换底部标签页
    switchTab: function(e) {
      const tab = e.currentTarget.dataset.tab;
      
      // 如果点击的是当前页面，不做任何操作
      if (tab === this.data.activeTab) {
        return;
      }
      
      // 获取对应的页面路径
      const pagePath = this.data.pagePaths[tab];
      
      if (pagePath) {
        // 判断是否是购物车页面
        if (tab === 'cart') {
          // 使用navigateTo而不是switchTab，因为购物车页面不在tabBar列表中
          wx.navigateTo({
            url: pagePath,
            fail: (err) => {
              console.error('打开购物车页面失败:', err);
              wx.showToast({
                title: '打开购物车失败',
                icon: 'none',
                duration: 1500
              });
            }
          });
        } else {
          // 使用wx.switchTab进行页面切换
          wx.switchTab({
            url: pagePath,
            fail: (err) => {
              console.error('切换页面失败:', err);
              // 如果页面不存在或其他原因导致切换失败，显示提示
              if (tab === 'data') {
                wx.showToast({
                  title: '功能开发中',
                  icon: 'none',
                  duration: 1500
                });
              }
            }
          });
        }
      } else {
        console.error('未找到对应的页面路径:', tab);
      }
    }
  },

  // 组件生命周期
  lifetimes: {
    attached: function() {
      // 组件加载时，根据当前页面路径设置激活的标签
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const route = currentPage.route;
      
      // 根据当前路径设置激活的标签
      if (route.includes('index')) {
        this.setData({ activeTab: 'home' });
      } else if (route.includes('recipe')) {
        this.setData({ activeTab: 'recipe' });
      } else if (route.includes('my')) {
        this.setData({ activeTab: 'my' });
      } else if (route.includes('history')) {
        this.setData({ activeTab: 'history' });
      } else if (route.includes('cart')) {
        this.setData({ activeTab: 'cart' });
      }
    }
  }
}) 