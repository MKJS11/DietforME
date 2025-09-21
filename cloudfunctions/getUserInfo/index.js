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

  try {
    // 查询用户信息
    const userResult = await userCollection.where({
      _openid: openid
    }).get()

    // 如果用户存在，返回用户信息
    if (userResult.data && userResult.data.length > 0) {
      return {
        success: true,
        data: userResult.data[0],
        openid: openid
      }
    } else {
      // 用户不存在，返回空数据
      return {
        success: false,
        message: '用户不存在',
        openid: openid
      }
    }
  } catch (error) {
    console.error('获取用户信息失败', error)
    return {
      success: false,
      message: '获取用户信息失败',
      error: error
    }
  }
} 