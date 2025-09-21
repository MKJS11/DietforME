# DietForMe - 智能健康饮食小程序 🍎

<div align="center">

[![微信小程序](https://img.shields.io/badge/WeChat-Mini%20Program-07C160?style=flat-square&logo=wechat&logoColor=white)](https://developers.weixin.qq.com/miniprogram/dev/framework/)
[![云开发](https://img.shields.io/badge/WeChat-Cloud%20Development-07C160?style=flat-square)](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.0.0-green.svg?style=flat-square)](package.json)

一个基于微信小程序的智能健康饮食管理平台，集成AI食物识别、个性化营养规划、智能食谱推荐等功能

[功能特性](#功能特性) • [快速开始](#快速开始) • [项目结构](#项目结构) • [技术栈](#技术栈) • [贡献指南](#贡献指南)

</div>

## 📖 项目简介

DietForMe是一个旨在帮助人们更轻松、更智能地规划和管理饮食的健康饮食平台。通过结合人工智能、数据分析和营养学知识，DietForMe提供个性化的饮食建议和服务，帮助用户实现健康饮食目标。

### 🎯 目标用户

- **初期目标人群**：糖尿病患者
- **后期扩展市场**：高血压、肾病等医疗饮食需求者，以及追求健康生活的普通用户

## ✨ 功能特性

### 🏠 核心功能

- **📊 个性化营养规划**：基于用户健康数据、饮食喜好和健康目标提供个性化营养建议
- **🤖 智能食谱推荐**：AI驱动的食谱推荐系统，考虑用户的饮食限制和口味偏好
- **📸 AI食物识别**：拍照识别食物成分和营养信息，自动记录卡路里摄入
- **📈 饮食跟踪分析**：实时跟踪饮食摄入，提供营养数据分析和健康建议
- **🛒 智能购物清单**：根据食谱和饮食计划自动生成购物清单

### 📱 页面功能

| 页面 | 功能描述 |
|------|----------|
| **首页** | 健康数据概览、BMI计算、饮水记录、卡路里追踪、饮食建议 |
| **食谱** | 智能食谱推荐、分类浏览、搜索、收藏管理 |
| **记录** | 拍照识别食物、营养分析、饮食记录 |
| **数据** | 饮食历史记录、营养统计分析、健康趋势 |
| **个人中心** | 用户信息管理、健康档案、设置偏好 |

### 🎨 特色功能

- **🌈 精美UI设计**：现代化毛玻璃效果界面，支持动画交互
- **☁️ 云端数据同步**：基于微信云开发，数据安全可靠
- **🔍 智能搜索**：支持食谱名称、食材、营养成分多维度搜索
- **⭐ 收藏系统**：收藏喜爱的食谱，建立个人食谱库
- **📊 可视化分析**：直观的图表展示营养摄入和健康趋势

## 🚀 快速开始

### 环境要求

- [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) 最新版本
- Node.js >= 14.0.0
- 微信小程序账号
- 微信云开发环境

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/MKJS11/DietforME.git
cd DietforME
```

2. **安装依赖**
```bash
npm install
```

3. **配置小程序**
   - 在微信开发者工具中导入项目
   - 修改 `project.config.json` 中的 `appid` 为你的小程序ID
   - 在 `app.js` 中配置你的云开发环境ID

4. **配置云开发**
   - 在微信开发者工具中开通云开发
   - 部署云函数到云端
   - 配置云数据库集合

5. **配置第三方API**
   - 配置火山引擎API密钥（`utils/volcanoAPI.js`）
   - 配置Coze API密钥（`utils/recordApi.js`）

### 云函数部署

在微信开发者工具中，右键点击 `cloudfunctions` 文件夹下的各个云函数，选择"创建并部署"：

- `login` - 用户登录
- `getUserInfo` - 获取用户信息
- `updateUserInfo` - 更新用户信息
- `getRecipes` - 获取食谱数据
- `saveRecipe` - 保存食谱
- `addFavorite` - 添加收藏
- `removeFavorite` - 取消收藏
- `getFavorites` - 获取收藏列表
- `saveFoodHistory` - 保存饮食记录

### 数据库配置

在云开发控制台创建以下集合：

- `users` - 用户信息
- `recipes` - 食谱数据
- `favorites` - 收藏记录
- `foodhistory` - 饮食历史

## 🏗️ 项目结构

```
diet/
├── pages/                    # 页面文件
│   ├── index/               # 首页 - 健康概览
│   ├── recipe/              # 食谱页面 - 智能推荐
│   ├── record/              # 记录页面 - 拍照识别
│   ├── history/             # 历史页面 - 数据分析
│   ├── my/                  # 个人中心
│   ├── details/             # 食谱详情
│   ├── onboarding/          # 引导页面
│   ├── todayr/              # 今日推荐
│   └── cart/                # 购物车
├── components/              # 自定义组件
│   ├── navigation-bar/      # 导航栏组件
│   └── tab-bar/             # 底部标签栏
├── cloudfunctions/          # 云函数
│   ├── login/               # 用户登录
│   ├── getRecipes/          # 获取食谱
│   ├── addFavorite/         # 添加收藏
│   ├── saveFoodHistory/     # 保存饮食记录
│   └── ...                 # 其他云函数
├── utils/                   # 工具函数
│   ├── api.js              # API接口封装
│   ├── volcanoAPI.js       # 火山引擎AI接口
│   ├── recordApi.js        # 食物识别API
│   └── util.js             # 通用工具函数
├── images/                  # 静态图片资源
├── app.js                   # 小程序入口文件
├── app.json                 # 小程序配置
├── app.wxss                 # 全局样式
└── project.config.json      # 项目配置
```

## 🛠️ 技术栈

### 前端技术
- **微信小程序原生框架**：基础开发框架
- **Glass-easel组件框架**：增强组件功能
- **WXSS**：样式语言，支持响应式设计

### 后端技术
- **微信云开发**：Serverless后端服务
- **云函数**：业务逻辑处理
- **云数据库**：MongoDB文档数据库
- **云存储**：文件存储服务

### AI集成
- **火山引擎大模型**：智能食谱生成
- **Coze AI平台**：食物图像识别
- **营养分析算法**：卡路里和营养成分计算

### 开发工具
- **Babel**：JavaScript编译器
- **ESLint**：代码质量检查
- **微信开发者工具**：调试和发布

## 📊 核心算法

### BMI计算
```javascript
BMI = 体重(kg) / (身高(m))²
```

### 营养需求计算
- **基础代谢率(BMR)**：Harris-Benedict公式
- **每日热量需求(TDEE)**：BMR × 活动系数
- **营养素分配**：蛋白质、碳水化合物、脂肪比例

### 食谱推荐算法
1. **用户画像分析**：健康状况、饮食偏好、营养需求
2. **食谱特征提取**：营养成分、GI值、适用人群
3. **智能匹配**：基于AI大模型的个性化推荐
4. **实时优化**：根据用户反馈调整推荐策略

## 📸 功能截图

<div align="center">

| 首页概览 | 智能食谱 | 拍照识别 | 数据分析 |
|---------|---------|---------|---------|
| ![首页](screenshots/home.png) | ![食谱](screenshots/recipe.png) | ![识别](screenshots/record.png) | ![数据](screenshots/data.png) |

</div>

## 🔧 配置说明

### 云开发环境配置

在 `app.js` 中配置你的云开发环境：

```javascript
wx.cloud.init({
  env: 'your-cloud-env-id', // 云开发环境ID
  traceUser: true
});
```

### API密钥配置

1. **火山引擎配置** (`utils/volcanoAPI.js`)：
```javascript
const API_CONFIG = {
  url: 'https://ark.cn-beijing.volces.com/api/v3/bots/chat/completions',
  model: 'your-model-id',
  token: 'your-api-token'
};
```

2. **Coze配置** (`utils/recordApi.js`)：
```javascript
const COZE_CONFIG = {
  UPLOAD_URL: 'https://api.coze.cn/v1/files/upload',
  API_KEY: 'your-coze-api-key'
};
```

## 🤝 贡献指南

我们欢迎所有形式的贡献！如果你想为项目做出贡献，请遵循以下步骤：

1. **Fork 项目**
2. **创建功能分支** (`git checkout -b feature/AmazingFeature`)
3. **提交更改** (`git commit -m 'Add some AmazingFeature'`)
4. **推送到分支** (`git push origin feature/AmazingFeature`)
5. **创建 Pull Request**

### 开发规范

- 遵循微信小程序开发规范
- 保持代码风格一致
- 添加必要的注释和文档
- 确保新功能有相应的测试

## 📝 更新日志

### v1.0.0 (2025-09-21)

#### ✨ 新功能
- 🎉 项目初始化和基础架构搭建
- 👤 用户登录和个人信息管理
- 🍽️ 智能食谱推荐系统
- 📸 AI食物识别功能
- 📊 营养数据追踪和分析
- ⭐ 食谱收藏和管理
- 🎨 精美的UI界面设计

#### 🔧 技术实现
- 集成微信云开发平台
- 接入火山引擎AI大模型
- 集成Coze食物识别API
- 实现响应式设计和动画效果

## 🐛 问题反馈

如果你在使用过程中遇到任何问题，请通过以下方式反馈：

- [GitHub Issues](https://github.com/MKJS11/DietforME/issues)
- 邮箱：your-email@example.com

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源协议。

## 🙏 致谢

- [微信小程序](https://developers.weixin.qq.com/miniprogram/dev/framework/) - 提供开发平台
- [火山引擎](https://www.volcengine.com/) - 提供AI大模型服务
- [Coze](https://www.coze.cn/) - 提供图像识别服务
- 所有为项目做出贡献的开发者们

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请考虑给它一个星标！**

Made with ❤️ by [MKJS11](https://github.com/MKJS11)

</div>
