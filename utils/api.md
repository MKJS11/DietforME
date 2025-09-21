# 健康饮食推荐API接口文档

## 概述
本文档描述了如何使用火山引擎大模型API获取个性化食谱推荐，并确保返回的数据格式与数据库字段匹配。

## API请求

### 请求地址
```
https://ark.cn-beijing.volces.com/api/v3/bots/chat/completions
```

### 请求方法
```
POST
```

### 请求头
```javascript
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer 85548f3b-11af-4c08-a078-86c1865e4513'
}
```

### 请求参数
```javascript
const requestData = {
  model: 'bot-20250303153853-pt5lg',
  stream: false,
  messages: [
    {
      role: 'system',
      content: '你是一个专业的营养师和健康饮食顾问。根据用户的健康信息提供个性化的食谱推荐。请以JSON格式返回5个食谱，每个食谱必须包含以下字段：name(名称)、time(准备时间)、calories(卡路里)、ingredients(食材数组)、steps(步骤数组)、benefits(健康益处)、categories(分类数组)、tags(标签数组)。确保所有字段都有值，特别是name字段不能为空。'
    },
    {
      role: 'user',
      content: generatePrompt(userInfo)
    }
  ]
```


## 完整请求示例
```javascript
// 获取用户信息
const userInfo = wx.getStorageSync('userInfo');

// 生成提示词
const prompt = generatePrompt(userInfo);

// 构建请求数据
const requestData = {
  model: 'bot-20250303153853-pt5lg',
  stream: false,
  messages: [
    {
      role: 'system',
      content: '你是一个专业的营养师和健康饮食顾问。根据用户的健康信息提供个性化的食谱推荐。请以JSON格式返回5个食谱，每个食谱必须包含以下字段：name(名称)、time(准备时间)、calories(卡路里)、ingredients(食材数组)、steps(步骤数组)、benefits(健康益处)、categories(分类数组)、tags(标签数组)。确保所有字段都有值，特别是name字段不能为空。'
    },
    {
      role: 'user',
      content: prompt
    }
  ]
};

// 发送请求
wx.request({
  url: 'https://ark.cn-beijing.volces.com/api/v3/bots/chat/completions',
  method: 'POST',
  timeout: 60000,
  enableHttp2: true,
  enableQuic: true,
  enableCache: true,
  header: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer 85548f3b-11af-4c08-a078-86c1865e4513'
  },
 
