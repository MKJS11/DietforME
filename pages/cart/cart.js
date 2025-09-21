// 购物车页面
const app = getApp()

Page({
  /**
   * 页面的初始数据
   */
  data: {
    cartItems: [],
    emptyCart: true,
    editMode: false,
    allSelected: false,
    selectedCount: 0,
    checkedCount: 0,
    allChecked: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function() {
    this.loadCartData()
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    this.loadCartData()
  },

  /**
   * 从本地存储加载购物车数据
   */
  loadCartData: function() {
    const shoppingList = wx.getStorageSync('shoppingList') || []
    
    // 对购物车项目进行排序 - 按添加时间降序
    shoppingList.sort((a, b) => b.addTime - a.addTime)
    
    // 为每个项目添加selected属性和唯一ID
    const cartItems = shoppingList.map((item, index) => {
      return {
        ...item,
        selected: false,
        uniqueId: `item-${item.name}-${index}-${item.addTime || Date.now()}` // 确保唯一性
      }
    })
    
    // 计算已勾选的数量
    const checkedCount = cartItems.filter(item => item.checked).length
    const allChecked = cartItems.length > 0 && checkedCount === cartItems.length
    
    this.setData({
      cartItems: cartItems,
      emptyCart: cartItems.length === 0,
      allSelected: false,
      selectedCount: 0,
      checkedCount: checkedCount,
      allChecked: allChecked
    })
  },

  /**
   * 保存购物车数据到本地存储
   */
  saveCartData: function() {
    const cartItems = this.data.cartItems.map(item => {
      // 只移除selected属性再保存，因为这是UI状态
      // 保留uniqueId以确保数据一致性
      const { selected, ...rest } = item
      return rest
    })
    
    wx.setStorageSync('shoppingList', cartItems)
  },

  /**
   * 切换食材选中状态
   */
  toggleItemSelect: function(e) {
    if (!this.data.editMode) return
    
    const index = e.currentTarget.dataset.index
    const cartItems = this.data.cartItems
    
    cartItems[index].selected = !cartItems[index].selected
    
    // 计算选中数量
    const selectedCount = cartItems.filter(item => item.selected).length
    const allSelected = selectedCount === cartItems.length
    
    this.setData({
      cartItems: cartItems,
      selectedCount: selectedCount,
      allSelected: allSelected
    })
  },

  /**
   * 切换全选状态
   */
  toggleSelectAll: function() {
    if (!this.data.editMode) return
    
    const allSelected = !this.data.allSelected
    const cartItems = this.data.cartItems.map(item => {
      return {
        ...item,
        selected: allSelected
      }
    })
    
    this.setData({
      cartItems: cartItems,
      allSelected: allSelected,
      selectedCount: allSelected ? cartItems.length : 0
    })
  },

  /**
   * 切换编辑模式
   */
  toggleEditMode: function() {
    this.setData({
      editMode: !this.data.editMode,
      allSelected: false,
      cartItems: this.data.cartItems.map(item => {
        return {
          ...item,
          selected: false
        }
      }),
      selectedCount: 0
    })
  },

  /**
   * 删除选中食材
   */
  deleteSelected: function() {
    if (this.data.selectedCount === 0) {
      wx.showToast({
        title: '请先选择要删除的食材',
        icon: 'none'
      })
      return
    }
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除选中的${this.data.selectedCount}个食材吗？`,
      success: res => {
        if (res.confirm) {
          const cartItems = this.data.cartItems.filter(item => !item.selected)
          
          this.setData({
            cartItems: cartItems,
            emptyCart: cartItems.length === 0,
            allSelected: false,
            selectedCount: 0,
            editMode: cartItems.length > 0 ? this.data.editMode : false
          })
          
          this.saveCartData()
          
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          })
        }
      }
    })
  },

  /**
   * 清空购物车
   */
  clearCart: function() {
    if (this.data.cartItems.length === 0) return
    
    wx.showModal({
      title: '确认清空',
      content: '确定要清空购物车吗？',
      success: res => {
        if (res.confirm) {
          this.setData({
            cartItems: [],
            emptyCart: true,
            editMode: false,
            allSelected: false,
            selectedCount: 0
          })
          
          this.saveCartData()
          
          wx.showToast({
            title: '购物车已清空',
            icon: 'success'
          })
        }
      }
    })
  },

  /**
   * 切换食材完成状态
   */
  toggleItemCheck: function(e) {
    if (this.data.editMode) return
    
    const index = e.currentTarget.dataset.index
    const cartItems = this.data.cartItems
    
    cartItems[index].checked = !cartItems[index].checked
    
    // 计算已勾选的数量
    const checkedCount = cartItems.filter(item => item.checked).length
    const allChecked = cartItems.length > 0 && checkedCount === cartItems.length
    
    this.setData({
      cartItems: cartItems,
      checkedCount: checkedCount,
      allChecked: allChecked
    })
    
    this.saveCartData()
  },

  /**
   * 切换所有食材的勾选状态（非编辑模式）
   */
  toggleAllChecked: function() {
    if (this.data.editMode) return
    
    const allChecked = !this.data.allChecked
    const cartItems = this.data.cartItems.map(item => {
      return {
        ...item,
        checked: allChecked
      }
    })
    
    this.setData({
      cartItems: cartItems,
      allChecked: allChecked,
      checkedCount: allChecked ? cartItems.length : 0
    })
    
    this.saveCartData()
  },
  
  /**
   * 跳转到菜谱详情
   */
  goToRecipe: function(e) {
    const recipeName = e.currentTarget.dataset.recipe
    if (!recipeName) return
    
    // 需要查询数据库获取菜谱ID
    wx.showLoading({
      title: '查找菜谱...',
      mask: true
    })
    
    wx.cloud.callFunction({
      name: 'searchRecipes',
      data: {
        searchText: recipeName,
        exact: true
      },
      success: res => {
        wx.hideLoading()
        
        if (res.result && res.result.success && res.result.data && res.result.data.length > 0) {
          const recipeId = res.result.data[0]._id
          
          wx.navigateTo({
            url: `/pages/details/detail?id=${recipeId}`
          })
        } else {
          wx.showToast({
            title: '未找到相关菜谱',
            icon: 'none'
          })
        }
      },
      fail: err => {
        wx.hideLoading()
        wx.showToast({
          title: '查找菜谱失败',
          icon: 'none'
        })
      }
    })
  },

  /**
   * 结算功能
   */
  checkout: function() {
    if (this.data.cartItems.length === 0) {
      wx.showToast({
        title: '购物车为空',
        icon: 'none'
      })
      return
    }
    
    wx.showModal({
      title: '购物完成',
      content: '确认已经购买所有食材？',
      success: res => {
        if (res.confirm) {
          // 标记所有食材为已购买（已勾选）
          const cartItems = this.data.cartItems.map(item => {
            return {
              ...item,
              checked: true
            }
          })
          
          this.setData({
            cartItems: cartItems,
            checkedCount: cartItems.length,
            allChecked: true
          })
          
          this.saveCartData()
          
          wx.showToast({
            title: '已完成结算',
            icon: 'success'
          })
        }
      }
    })
  },

  // 返回上一页
  goBack() {
    wx.navigateBack({
      delta: 1
    })
  }
}) 