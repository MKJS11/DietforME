// pages/record/record.js
// 引入API工具函数
const { callRecordApi } = require('../../utils/recordApi');

// Coze API配置
const COZE_CONFIG = {
  UPLOAD_URL: 'https://api.coze.cn/v1/files/upload',
  API_KEY: 'pat_IpG8CHMLLyZ1MrHWOnkEL8Jvnvk0ny8p3hQtDMzo1E0taNhUOnU47myif8eaw6i7'
};

Page({
  data: {
    photoPath: '', // 拍照后的临时路径
    recognizing: false, // 识别状态
    recognitionResult: null, // 识别结果
    cameraContext: null, // 相机上下文
    showModal: false, // 是否显示模态框
    analysisResult: null, // 分析结果
    showResult: false, // 是否显示结果页面
    saving: false, // 保存状态
  },

  onLoad: function() {
    this.initCamera();
  },

  // 初始化相机
  initCamera: function() {
    try {
      this.setData({
        cameraContext: wx.createCameraContext()
      });
      
      wx.setNavigationBarColor({
        frontColor: '#000000',
        backgroundColor: '#ffffff'
      });
    } catch (error) {
      console.error('相机初始化失败:', error);
      wx.showToast({
        title: '相机初始化失败',
        icon: 'none'
      });
    }
  },

  // 拍照并识别
  takePhoto: function() {
    if (this.data.recognizing) {
      wx.showToast({
        title: '正在识别中...',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ 
      recognizing: true,
      photoPath: '', // 清除之前的照片
      recognitionResult: null, // 清除之前的结果
      showResult: false // 隐藏结果页面
    });
    
    const camera = this.data.cameraContext;
    if (!camera) {
      this.handleError('相机未初始化');
      return;
    }

    wx.showLoading({
      title: '拍照中...',
      mask: true
    });

    camera.takePhoto({
      quality: 'high',
      success: (res) => {
        console.log('拍照成功:', res.tempImagePath);
        this.setData({
          photoPath: res.tempImagePath
        });
        this.recognizeFood(res.tempImagePath);
      },
      fail: (err) => {
        this.handleError('拍照失败', err);
      }
    });
  },

  // 调用食物识别API
  recognizeFood: function(imagePath) {
    if (!imagePath) {
      this.handleError('图片路径无效');
      return;
    }

    wx.showLoading({
      title: '正在上传...',
      mask: true
    });

    // 将图片转为base64
    wx.getFileSystemManager().readFile({
      filePath: imagePath,
      encoding: 'base64',
      success: (res) => {
        if (!res.data || typeof res.data !== 'string') {
          this.handleError('图片数据无效');
          return;
        }

        if (res.data.length > 5 * 1024 * 1024) {
          this.handleError('图片太大，请重试');
          return;
        }

        // 调用API进行识别
        this.callRecognitionAPI(res.data);
      },
      fail: (err) => {
        this.handleError('图片处理失败', err);
      }
    });
  },

  // 调用识别API
  callRecognitionAPI: function(base64Image) {
    callRecordApi(base64Image)
      .then(result => {
        if (!result) {
          throw new Error('识别结果为空');
        }

        console.log('识别结果:', result);
        
        // 显示结果
        this.setData({
          analysisResult: this.processRecognitionResult(result),
          showModal: true,
          recognizing: false
        });

        wx.hideLoading();
      })
      .catch(err => {
        console.error('识别失败:', err);
        this.handleError('识别失败，请重试');
      });
  },

  // 处理识别结果
  processRecognitionResult: function(result) {
    return {
      ...result,
      calories: result.calories || 0,
      protein: result.protein || 0,
      carbs: result.carbs || 0,
      fat: result.fat || 0,
      name: result.name || '未知食物',
      timestamp: new Date().getTime(),
      GI_level: result.GI_level || '未知',
      GL_level: result.GL_level || '未知',
      suggestion: result.suggestion || '暂无建议',
      // 添加recipe所需的字段
      image: '',
      time: '10分钟',
      tag: '健康',
      ingredients: [
        {
          name: result.name || '未知食物',
          amount: '1份'
        }
      ],
      steps: [
        {
          description: '食用' + (result.name || '未知食物'),
          image: ''
        }
      ],
      benefits: result.suggestion || '暂无建议',
      categories: ['健康饮食'],
      tags: ['识别食物'],
      isRecommended: false,
      rating: 5
    };
  },

  // 统一错误处理
  handleError: function(message, error = null) {
    console.error(message, error);
    wx.hideLoading();
    wx.showToast({
      title: message,
      icon: 'none',
      duration: 2000
    });
    this.setData({ 
      recognizing: false,
      photoPath: '',
      recognitionResult: null,
      showResult: false
    });
  },

  // 重新拍照
  retakePhoto: function() {
    this.setData({
      photoPath: '',
      recognitionResult: null,
      recognizing: false,
      showResult: false,
      showModal: false
    });
  },

  // 页面卸载时释放相机资源
  onUnload: function() {
    if (this.data.cameraContext) {
      this.data.cameraContext = null;
    }
  },

  // 相机错误处理
  cameraError: function(e) {
    this.handleError('相机启动失败', e.detail);
  },

  // 返回上一页
  goBack: function () {
    const pages = getCurrentPages();
    
    if (pages.length > 1) {
      wx.navigateBack({
        delta: 1,
        fail: (err) => {
          console.error("返回上一页失败:", err);
          this.navigateToHome();
        }
      });
    } else {
      this.navigateToHome();
    }
  },

  // 导航到首页
  navigateToHome: function() {
    wx.switchTab({
      url: '/pages/index/index',
      fail: (err) => {
        console.error("跳转到首页失败:", err);
        wx.showToast({
          title: '返回失败',
          icon: 'none'
        });
      }
    });
  },

  // 关闭模态框
  closeModal: function() {
    this.setData({
      showModal: false
    });
    this.retakePhoto();
  },

  // 确认模态框
  confirmModal: function() {
    // 保存数据到云数据库
    this.saveToDatabase();
  },

  // 保存到云数据库
  saveToDatabase: function() {
    if (this.data.saving) {
      return;
    }

    this.setData({ saving: true });
    
    wx.showLoading({
      title: '正在保存...',
      mask: true
    });

    // 只保存到食物历史记录
    this.saveToFoodHistory(this.data.analysisResult, this.data.photoPath)
      .then((historyRes) => {
        console.log('保存结果:', { history: historyRes });
        
        if (historyRes && historyRes.success) {
          wx.showToast({
            title: '保存成功',
            icon: 'success',
            duration: 1500
          });
          
          // 关闭模态框
          this.setData({
            showModal: false
          });
          
          // 重置页面状态，准备下一次拍照
          setTimeout(() => {
            this.retakePhoto();
          }, 1500);
        } else {
          const errorMsg = historyRes ? historyRes.message : '保存失败';
          this.handleSaveError(errorMsg);
        }
      })
      .catch(err => {
        console.error('保存过程出错:', err);
        this.handleSaveError('保存失败，请重试');
      })
      .finally(() => {
        this.setData({ saving: false });
        wx.hideLoading();
      });
  },

  // 保存到食物历史记录集合
  saveToFoodHistory: function(foodData, imagePath) {
    return new Promise((resolve, reject) => {
      // 如果有图片路径，先上传图片
      if (imagePath) {
        const cloudPath = `food_images/${Date.now()}_${Math.random().toString(36).substr(2)}.jpg`;
        
        wx.cloud.uploadFile({
          cloudPath: cloudPath,
          filePath: imagePath,
          success: res => {
            console.log('图片上传成功:', res);
            // 获取图片的云存储路径
            const imageUrl = res.fileID;
            // 调用保存食物历史记录的云函数
            this.callSaveFoodHistoryFunction(foodData, imageUrl, resolve);
          },
          fail: err => {
            console.error('图片上传失败:', err);
            // 即使图片上传失败，也尝试保存食物记录（没有图片）
            this.callSaveFoodHistoryFunction(foodData, '', resolve);
          }
        });
      } else {
        // 没有图片路径，直接保存食物记录
        this.callSaveFoodHistoryFunction(foodData, '', resolve);
      }
    });
  },

  // 调用保存食物历史记录的云函数
  callSaveFoodHistoryFunction: function(foodData, imageUrl, resolve) {
    wx.cloud.callFunction({
      name: 'saveFoodHistory',
      data: {
        foodData: foodData,
        imageUrl: imageUrl
      },
      success: (res) => {
        console.log('食物历史记录保存结果:', res);
        resolve(res.result || { success: false, message: '保存食物历史记录失败' });
      },
      fail: (err) => {
        console.error('保存食物历史记录失败:', err);
        resolve({ success: false, message: '保存食物历史记录失败，请重试' });
      }
    });
  },

  // 处理保存错误
  handleSaveError: function(message) {
    wx.showToast({
      title: message,
      icon: 'none',
      duration: 2000
    });
  }
}); 