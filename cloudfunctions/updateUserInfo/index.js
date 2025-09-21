// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'cloud1-0gb51bqmd479e34c'
})

const db = cloud.database()
const userCollection = db.collection('users')

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  // 获取用户信息参数
  const userInfo = event.userInfo || {}
  
  // 确保必要的字段存在
  const userData = {
    // 基本信息
    nickname: userInfo.nickname || '健康饮食用户',
    age: userInfo.age || 25,
    gender: userInfo.gender || 'male',
    height: userInfo.height || 170,
    weight: userInfo.weight || 65,
    
    // 健康信息
    diseases: userInfo.diseases || [],
    healthStatus: userInfo.healthStatus || [],
    dietPreferences: userInfo.dietPreferences || [],
    
    // 其他信息
    avatarUrl: userInfo.avatarUrl || '',
    updateTime: db.serverDate()
  }
  
  try {
    // 查询用户是否已存在
    const userResult = await userCollection.where({
      _openid: openid
    }).get()
    
    if (userResult.data && userResult.data.length > 0) {
      // 用户已存在，更新用户信息
      await userCollection.where({
        _openid: openid
      }).update({
        data: userData
      })
      
      return {
        success: true,
        message: '用户信息更新成功',
        openid: openid
      }
    } else {
      // 用户不存在，创建新用户
      await userCollection.add({
        data: {
          _openid: openid,
          ...userData,
          createTime: db.serverDate()
        }
      })
      
      return {
        success: true,
        message: '用户信息创建成功',
        openid: openid
      }
    }
  } catch (error) {
    console.error('更新用户信息失败', error)
    return {
      success: false,
      message: '更新用户信息失败',
      error: error
    }
  }
} 