// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'cloud1-0gb51bqmd479e34c'
})

const db = cloud.database()
const foodHistoryCollection = db.collection('foodhistory')

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  // 获取食物识别结果
  const foodData = event.foodData || {}
  
  if (!foodData.name || foodData.name === '未知食物') {
    return {
      success: false,
      message: '食物信息不完整或未识别'
    }
  }
  
  // 准备食物历史数据
  const foodHistory = {
    name: foodData.name,
    calories: foodData.calories || 0,
    protein: foodData.protein || '未知',
    carbs: foodData.carbs || '未知',
    fat: foodData.fat || '未知',
    GI: foodData.GI || '未知',
    GI_level: foodData.GI_level || '未知',
    GL: foodData.GL || '未知',
    GL_level: foodData.GL_level || '未知',
    energy: foodData.energy || '未知',
    suggestion: foodData.suggestion || '暂无建议',
    imageUrl: event.imageUrl || '',
    userId: openid,
    createTime: db.serverDate()
  }
  
  try {
    // 创建新的食物历史记录
    const result = await foodHistoryCollection.add({
      data: foodHistory
    })
    
    return {
      success: true,
      message: '食物历史记录保存成功',
      recordId: result._id
    }
  } catch (error) {
    console.error('保存食物历史记录失败', error)
    return {
      success: false,
      message: '保存食物历史记录失败',
      error: error
    }
  }
} 