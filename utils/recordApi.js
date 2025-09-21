// Coze API 相关配置
const COZE_API_KEY = 'pat_IpG8CHMLLyZ1MrHWOnkEL8Jvnvk0ny8p3hQtDMzo1E0taNhUOnU47myif8eaw6i7';
const COZE_UPLOAD_URL = 'https://api.coze.cn/v1/files/upload';
const COZE_CHAT_URL = 'https://api.coze.cn/v3/chat';
const COZE_MESSAGE_LIST_URL = 'https://api.coze.cn/v3/chat/message/list';
const COZE_WORKFLOW_URL = 'https://api.coze.cn/v1/workflow/run';
const COZE_BOT_ID = '7477877870443593791';
const COZE_WORKFLOW_ID = '7477872458873389110';
const MAX_POLLING_ATTEMPTS = 20; // 最大轮询次数
const POLLING_INTERVAL = 1000; // 轮询间隔（毫秒）

/**
 * 调用Coze API进行食物识别
 * @param {string} base64Image - Base64编码的图片数据
 * @returns {Promise<Object>} - 包含识别结果的Promise
 */
const callRecordApi = function(base64Image) {
  console.log('开始调用Coze API进行食物识别');
  return new Promise((resolve, reject) => {
    // 第一步：上传图片到Coze
    uploadImageToCoze(base64Image)
      .then(uploadResult => {
        console.log('【第一阶段】图片上传成功，返回数据:', JSON.stringify(uploadResult));
        
        // 检查上传结果是否包含文件ID
        if (!uploadResult || !uploadResult.data || !uploadResult.data.id) {
          console.error('上传响应结构:', JSON.stringify(uploadResult));
          throw new Error('上传响应中没有找到文件ID');
        }
        
        const fileId = uploadResult.data.id;
        console.log('获取到文件ID:', fileId);
        
        // 第二步：使用上传的图片ID调用Coze进行图像识别，获取chat_id和conversation_id
        return recognizeImageWithCoze(fileId);
      })
      .then(recognitionResult => {
        console.log('【第二阶段】图片识别成功，原始返回数据:', JSON.stringify(recognitionResult));
        
        // 检查识别结果是否为空
        if (!recognitionResult) {
          console.error('识别结果为空');
          throw new Error('识别结果为空');
        }
        
        // 提取chat_id和conversation_id
        const chatId = recognitionResult.data?.id;
        const conversationId = recognitionResult.data?.conversation_id;
        
        if (!chatId || !conversationId) {
          console.error('识别结果中缺少chat_id或conversation_id，原始数据:', JSON.stringify(recognitionResult.data));
          throw new Error('识别结果中缺少chat_id或conversation_id');
        }
        
        console.log(`获取到chat_id: ${chatId}, conversation_id: ${conversationId}`);
        console.log(`开始轮询消息列表，chat_id: ${chatId}, conversation_id: ${conversationId}`);
        
        // 第三步：轮询获取消息列表，获取图片URL
        return pollForResults(chatId, conversationId, 0);
      })
      .then(pollResult => {
        console.log('【第三阶段】轮询获取消息列表成功，返回数据:', JSON.stringify(pollResult));
        
        // 从轮询结果中提取图片URL
        let imageUrl = extractImageUrlFromPollResult(pollResult);
        
        if (!imageUrl) {
          console.error('未从轮询结果中提取到图片URL');
          throw new Error('未从轮询结果中提取到图片URL');
        }
        
        console.log('从轮询结果中提取到图片URL:', imageUrl);
        
        // 第四步：使用图片URL调用工作流API
        return callWorkflowApi(imageUrl);
      })
      .then(workflowResult => {
        console.log('【第四阶段】工作流API调用成功，返回数据:', JSON.stringify(workflowResult));
        
        // 解析工作流结果
        const parsedWorkflowResult = parseWorkflowResult(workflowResult);
        console.log('解析后的工作流结果:', JSON.stringify(parsedWorkflowResult));
        
        // 返回解析后的结果
        resolve(parsedWorkflowResult);
      })
      .catch(error => {
        console.error('处理图片时出错:', error);
        // 返回默认结果而不是抛出错误
        resolve(getDefaultResult());
      });
  });
};

/**
 * 上传图片到Coze API
 * @param {string} base64Image - Base64编码的图片数据
 * @returns {Promise<Object>} - 包含上传结果的Promise
 */
const uploadImageToCoze = function(base64Image) {
  console.log('开始上传图片到Coze');
  return new Promise((resolve, reject) => {
    // 将Base64转换为临时文件
    const tempFilePath = wx.env.USER_DATA_PATH + '/temp_image.jpg';
    const buffer = wx.base64ToArrayBuffer(base64Image);
    
    wx.getFileSystemManager().writeFile({
      filePath: tempFilePath,
      data: buffer,
      encoding: 'binary',
      success: () => {
        // 上传临时文件到Coze
        wx.uploadFile({
          url: COZE_UPLOAD_URL,
          filePath: tempFilePath,
          name: 'file',
          header: {
            'Authorization': `Bearer ${COZE_API_KEY}`
          },
          success: (res) => {
            try {
              // 解析响应数据
              const data = JSON.parse(res.data);
              resolve(data);
            } catch (error) {
              reject(new Error('解析上传响应失败: ' + error.message));
            }
          },
          fail: (error) => {
            reject(new Error('上传图片失败: ' + error.errMsg));
          }
        });
      },
      fail: (error) => {
        reject(new Error('创建临时文件失败: ' + error.errMsg));
      }
    });
  });
};

/**
 * 使用Coze API进行图像识别
 * @param {string} fileId - 上传到Coze的文件ID
 * @returns {Promise<Object>} - 包含识别结果的Promise
 */
const recognizeImageWithCoze = function(fileId) {
  return new Promise((resolve, reject) => {
    console.log('开始调用Coze API进行图像识别，文件ID:', fileId);
    
    // 构建请求体，按照curl示例格式
    const requestBody = {
      bot_id: COZE_BOT_ID,
      user_id: "1",
      stream: false,
      additional_messages: [
        {
          content_type: "object_string",
          content: `[{"type": "image","file_id":"${fileId}"}]`,
          role: "user"
        }
      ]
    };
    
    console.log('识别请求体:', JSON.stringify(requestBody));
    console.log('识别请求URL:', COZE_CHAT_URL);
    console.log('识别请求头:', {
      'Authorization': `Bearer ${COZE_API_KEY.substring(0, 5)}...`,
      'Content-Type': 'application/json'
    });
    
    // 发送请求
    wx.request({
      url: COZE_CHAT_URL,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${COZE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      data: requestBody,
      success: (res) => {
        console.log('识别响应状态码:', res.statusCode);
        console.log('识别响应数据:', JSON.stringify(res.data));
        
        // 检查响应状态码
        if (res.statusCode !== 200) {
          console.error('识别请求状态码错误:', res.statusCode);
          reject(new Error(`识别请求状态码错误: ${res.statusCode}`));
          return;
        }
        
        // 检查响应数据
        if (!res.data) {
          console.error('识别响应为空');
          reject(new Error('识别响应为空'));
          return;
        }
        
        // 检查错误码
        if (res.data.code !== 0) {
          console.error('识别请求错误:', res.data.msg || '未知错误', '错误码:', res.data.code);
          reject(new Error(`识别请求错误: ${res.data.msg || '未知错误'}`));
          return;
        }
        
        // 检查data字段
        if (!res.data.data) {
          console.error('识别响应中缺少data字段');
          reject(new Error('识别响应中缺少data字段'));
          return;
        }
        
        // 检查id和conversation_id字段
        if (!res.data.data.id || !res.data.data.conversation_id) {
          console.error('识别响应中缺少id或conversation_id字段:', JSON.stringify(res.data.data));
          // 尝试继续处理而不是立即失败
        }
        
        // 返回完整的响应数据
        resolve(res.data);
      },
      fail: (err) => {
        console.error('识别请求网络错误:', err);
        reject(err);
      }
    });
  });
};

/**
 * 轮询获取消息列表
 * @param {string} chatId - 聊天ID
 * @param {string} conversationId - 会话ID
 * @param {number} attempt - 当前尝试次数
 * @returns {Promise<Object>} - 包含消息列表的Promise
 */
const pollForResults = function(chatId, conversationId, attempt) {
  return new Promise((resolve, reject) => {
    // 检查是否超过最大尝试次数
    if (attempt >= MAX_POLLING_ATTEMPTS) {
      console.error('轮询超过最大尝试次数');
      reject(new Error('获取结果超时'));
      return;
    }
    
    console.log(`轮询尝试 #${attempt + 1}`);
    
    // 构建请求URL，确保格式与示例一致
    const url = `${COZE_MESSAGE_LIST_URL}?conversation_id=${conversationId}&chat_id=${chatId}&`;
    console.log('轮询URL:', url);
    
    // 打印完整的请求信息，便于调试
    console.log('轮询请求头:', {
      'Authorization': `Bearer ${COZE_API_KEY.substring(0, 5)}...`,
      'Content-Type': 'application/json'
    });
    
    // 发送请求
    wx.request({
      url: url,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${COZE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      success: (res) => {
        console.log(`轮询响应状态码 #${attempt + 1}:`, res.statusCode);
        console.log(`轮询响应数据 #${attempt + 1}:`, JSON.stringify(res.data));
        
        // 检查响应状态码
        if (res.statusCode !== 200) {
          console.error('轮询请求状态码错误:', res.statusCode);
          // 继续轮询而不是立即失败
          setTimeout(() => {
            pollForResults(chatId, conversationId, attempt + 1)
              .then(resolve)
              .catch(reject);
          }, POLLING_INTERVAL);
          return;
        }
        
        // 检查响应数据
        if (!res.data || res.data.code !== 0) {
          console.error('轮询请求错误:', res.data?.msg || '未知错误', '错误码:', res.data?.code);
          // 继续轮询而不是立即失败
          setTimeout(() => {
            pollForResults(chatId, conversationId, attempt + 1)
              .then(resolve)
              .catch(reject);
          }, POLLING_INTERVAL);
          return;
        }
        
        // 检查是否有消息
        if (!res.data.data || !Array.isArray(res.data.data) || res.data.data.length === 0) {
          console.log('轮询返回的消息列表为空，继续轮询');
          setTimeout(() => {
            pollForResults(chatId, conversationId, attempt + 1)
              .then(resolve)
              .catch(reject);
          }, POLLING_INTERVAL);
          return;
        }
        
        // 打印所有消息类型，便于调试
        const messageTypes = res.data.data.map(msg => msg.type);
        console.log('消息类型列表:', messageTypes);
        
        // 查找type为answer的消息
        const answerMessage = res.data.data.find(msg => msg.type === 'answer');
        
        if (!answerMessage) {
          console.log('未找到type为answer的消息，继续轮询');
          setTimeout(() => {
            pollForResults(chatId, conversationId, attempt + 1)
              .then(resolve)
              .catch(reject);
          }, POLLING_INTERVAL);
          return;
        }
        
        console.log('找到type为answer的消息，轮询完成');
        console.log('answer消息内容:', JSON.stringify(answerMessage));
        resolve(res.data);
      },
      fail: (err) => {
        console.error('轮询请求失败:', err);
        // 继续轮询而不是立即失败
        setTimeout(() => {
          pollForResults(chatId, conversationId, attempt + 1)
            .then(resolve)
            .catch(reject);
        }, POLLING_INTERVAL);
      }
    });
  });
};

/**
 * 从轮询结果中提取图片URL
 * @param {Object} pollResult - 轮询返回的结果
 * @returns {string} - 提取到的图片URL，如果没有则返回空字符串
 */
const extractImageUrlFromPollResult = function(pollResult) {
  try {
    console.log('开始从轮询结果中提取图片URL');
    
    // 检查pollResult是否为undefined或null
    if (!pollResult || !pollResult.data) {
      console.error('轮询结果为undefined或null，或缺少data字段');
      return '';
    }
    
    // 检查data是否为数组
    if (!Array.isArray(pollResult.data)) {
      console.error('轮询结果的data字段不是数组');
      return '';
    }
    
    // 打印所有消息，便于调试
    console.log('轮询结果中的所有消息:', JSON.stringify(pollResult.data));
    
    // 查找type为answer的消息
    const answerMessage = pollResult.data.find(msg => msg.type === 'answer');
    
    if (!answerMessage) {
      console.error('未找到type为answer的消息');
      return '';
    }
    
    console.log('找到type为answer的消息:', JSON.stringify(answerMessage));
    
    // 直接从content中提取URL
    if (answerMessage.content && typeof answerMessage.content === 'string') {
      // 尝试直接从content中提取URL
      const urlMatches = answerMessage.content.match(/https:\/\/[^"\s}]+/g);
      if (urlMatches && urlMatches.length > 0) {
        console.log('从content中提取到所有图片URL:', urlMatches);
        
        // 检查是否有重复的URL（两个相同的URL连在一起）
        if (urlMatches.length === 1) {
          const url = urlMatches[0];
          // 检查URL是否包含两个https://
          const httpsCount = (url.match(/https:\/\//g) || []).length;
          
          if (httpsCount > 1) {
            console.log('检测到URL中包含多个https://，尝试分离');
            const splitIndex = url.indexOf('https://', 8); // 从第一个https://之后开始查找
            if (splitIndex !== -1) {
              const firstUrl = url.substring(0, splitIndex);
              console.log('分离出第一个URL:', firstUrl);
              return firstUrl;
            }
          }
          
          console.log('使用提取到的单个URL:', url);
          return url;
        } else {
          // 如果有多个URL，使用第一个
          console.log('使用提取到的第一个URL:', urlMatches[0]);
          return urlMatches[0];
        }
      }
      
      // 尝试解析content为JSON
      try {
        const contentObj = JSON.parse(answerMessage.content);
        console.log('解析后的content对象:', JSON.stringify(contentObj));
        
        if (contentObj.output && typeof contentObj.output === 'string') {
          // 检查output是否包含多个https://
          const output = contentObj.output;
          const httpsCount = (output.match(/https:\/\//g) || []).length;
          
          if (httpsCount > 1) {
            console.log('检测到output中包含多个https://，尝试分离');
            const splitIndex = output.indexOf('https://', 8); // 从第一个https://之后开始查找
            if (splitIndex !== -1) {
              const firstUrl = output.substring(0, splitIndex);
              console.log('从output分离出第一个URL:', firstUrl);
              return firstUrl;
            }
          }
          
          if (output.startsWith('http')) {
            console.log('从content的output字段提取到图片URL:', output);
            return output;
          }
          
          // 尝试从output中提取URL
          const outputUrlMatches = output.match(/https:\/\/[^"\s}]+/g);
          if (outputUrlMatches && outputUrlMatches.length > 0) {
            console.log('从output中提取到图片URL:', outputUrlMatches[0]);
            return outputUrlMatches[0];
          }
        }
        
        // 尝试从整个contentObj中提取URL
        const contentStr = JSON.stringify(contentObj);
        const contentUrlMatches = contentStr.match(/https:\/\/[^"\s}]+/g);
        if (contentUrlMatches && contentUrlMatches.length > 0) {
          console.log('从contentObj中提取到所有图片URL:', contentUrlMatches);
          
          // 检查第一个URL是否包含多个https://
          const firstUrl = contentUrlMatches[0];
          const httpsCount = (firstUrl.match(/https:\/\//g) || []).length;
          
          if (httpsCount > 1) {
            console.log('检测到URL中包含多个https://，尝试分离');
            const splitIndex = firstUrl.indexOf('https://', 8); // 从第一个https://之后开始查找
            if (splitIndex !== -1) {
              const cleanUrl = firstUrl.substring(0, splitIndex);
              console.log('分离出第一个URL:', cleanUrl);
              return cleanUrl;
            }
          }
          
          return contentUrlMatches[0];
        }
      } catch (error) {
        console.error('解析content为JSON失败:', error);
        // 继续尝试其他方法
      }
    }
    
    // 如果仍然没有找到URL，尝试从整个answerMessage中提取
    const messageStr = JSON.stringify(answerMessage);
    const messageUrlMatches = messageStr.match(/https:\/\/[^"\s}]+/g);
    if (messageUrlMatches && messageUrlMatches.length > 0) {
      console.log('从整个answerMessage中提取到所有图片URL:', messageUrlMatches);
      
      // 检查第一个URL是否包含多个https://
      const firstUrl = messageUrlMatches[0];
      const httpsCount = (firstUrl.match(/https:\/\//g) || []).length;
      
      if (httpsCount > 1) {
        console.log('检测到URL中包含多个https://，尝试分离');
        const splitIndex = firstUrl.indexOf('https://', 8); // 从第一个https://之后开始查找
        if (splitIndex !== -1) {
          const cleanUrl = firstUrl.substring(0, splitIndex);
          console.log('分离出第一个URL:', cleanUrl);
          return cleanUrl;
        }
      }
      
      return messageUrlMatches[0];
    }
    
    console.error('未能从轮询结果中提取到图片URL');
    return '';
  } catch (error) {
    console.error('从轮询结果中提取图片URL失败:', error);
    return '';
  }
};

/**
 * 调用工作流API
 * @param {string} imageUrl - 图片URL
 * @returns {Promise<Object>} - 包含工作流结果的Promise
 */
const callWorkflowApi = function(imageUrl) {
  return new Promise((resolve, reject) => {
    console.log('开始调用工作流API，图片URL:', imageUrl);
    
    // 验证图片URL
    if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('http')) {
      console.error('无效的图片URL:', imageUrl);
      reject(new Error('无效的图片URL'));
      return;
    }
    
    // 构建请求体，确保格式与示例一致
    const requestBody = {
      parameters: {
        input: imageUrl
      },
      workflow_id: COZE_WORKFLOW_ID
    };
    
    console.log('工作流请求体:', JSON.stringify(requestBody));
    console.log('工作流请求URL:', COZE_WORKFLOW_URL);
    console.log('工作流请求头:', {
      'Authorization': `Bearer ${COZE_API_KEY.substring(0, 5)}...`,
      'Content-Type': 'application/json'
    });
    
    // 发送请求
    wx.request({
      url: COZE_WORKFLOW_URL,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${COZE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      data: requestBody,
      success: (res) => {
        console.log('工作流响应状态码:', res.statusCode);
        console.log('工作流响应数据:', JSON.stringify(res.data));
        
        // 检查响应状态码
        if (res.statusCode !== 200) {
          console.error('工作流请求状态码错误:', res.statusCode);
          reject(new Error(`工作流请求状态码错误: ${res.statusCode}`));
          return;
        }
        
        // 检查响应数据
        if (!res.data) {
          console.error('工作流响应为空');
          reject(new Error('工作流响应为空'));
          return;
        }
        
        // 检查错误码
        if (res.data.code !== 0 && res.data.code !== undefined) {
          console.error('工作流请求错误:', res.data.msg || '未知错误', '错误码:', res.data.code);
          reject(new Error(`工作流请求错误: ${res.data.msg || '未知错误'}`));
          return;
        }
        
        // 返回完整的响应数据
        resolve(res.data);
      },
      fail: (err) => {
        console.error('工作流请求网络错误:', err);
        reject(err);
      }
    });
  });
};

/**
 * 解析工作流结果
 * @param {Object} result - 工作流API返回的原始结果
 * @returns {Object} - 格式化后的食物信息
 */
const parseWorkflowResult = function(result) {
  try {
    console.log('开始解析工作流结果');
    
    // 检查result是否为undefined或null
    if (!result) {
      console.error('工作流结果为undefined或null');
      return getDefaultResult();
    }
    
    // 打印完整的工作流结果，便于调试
    console.log('完整的工作流结果:', JSON.stringify(result));
    
    // 首先检查是否有data字段（新格式）
    if (result.data) {
      console.log('检测到data字段，尝试解析');
      
      // 处理嵌套的data结构
      if (result.data.data && typeof result.data.data === 'string') {
        console.log('检测到嵌套的data结构，尝试解析内部data字段');
        return parseNestedData(result.data.data);
      }
      
      // 如果result.data本身是字符串，可能包含JSON
      if (typeof result.data === 'string') {
        console.log('data字段是字符串，尝试解析为JSON');
        return parseDataString(result.data);
      }
      
      // 如果result.data是对象但不包含嵌套的data字段
      // 检查是否有data属性
      if (result.data.data) {
        console.log('data字段是对象，包含data属性，尝试解析');
        if (typeof result.data.data === 'string') {
          return parseDataString(result.data.data);
        } else {
          return extractFoodInfo(result.data.data);
        }
      }
      
      console.log('data字段是对象，直接使用');
      return extractFoodInfo(result.data);
    }
    
    // 如果没有data字段，尝试旧格式（output字段）
    if (result.output) {
      console.log('检测到output字段，尝试解析');
      
      // 处理output字段（可能是数组或对象）
      let outputItem;
      
      if (Array.isArray(result.output)) {
        // 如果output是数组，获取第一个元素
        if (result.output.length === 0) {
          console.error('工作流结果的output数组为空');
          return getDefaultResult();
        }
        outputItem = result.output[0];
        console.log('从output数组中获取第一个元素:', JSON.stringify(outputItem));
      } else {
        // 如果output不是数组，直接使用
        outputItem = result.output;
        console.log('直接使用output字段:', JSON.stringify(outputItem));
      }
      
      // 检查输出项是否为对象
      if (!outputItem || typeof outputItem !== 'object') {
        console.error('工作流输出项不是对象:', outputItem);
        
        // 尝试将输出项解析为对象（如果是字符串）
        if (typeof outputItem === 'string') {
          try {
            const parsedItem = JSON.parse(outputItem);
            if (typeof parsedItem === 'object') {
              outputItem = parsedItem;
              console.log('成功将输出项字符串解析为对象:', JSON.stringify(outputItem));
            }
          } catch (error) {
            console.error('解析输出项字符串失败:', error);
            return getDefaultResult();
          }
        } else {
          return getDefaultResult();
        }
      }
      
      return extractFoodInfo(outputItem);
    }
    
    console.error('工作流结果中既没有output字段也没有data字段:', JSON.stringify(result));
    return getDefaultResult();
  } catch (error) {
    console.error('解析工作流结果失败:', error);
    return getDefaultResult();
  }
};

/**
 * 解析嵌套的data字段
 * @param {string} dataString - 嵌套的data字段内容
 * @returns {Object} - 格式化后的食物信息
 */
const parseNestedData = function(dataString) {
  try {
    console.log('解析嵌套的data字段:', dataString);
    
    // 尝试解析JSON字符串
    let foodData;
    try {
      foodData = JSON.parse(dataString);
      console.log('成功解析嵌套data字段为JSON:', JSON.stringify(foodData));
    } catch (e) {
      // 如果解析失败，尝试从字符串中提取JSON数组
      const jsonMatch = dataString.match(/\[\{.*\}\]/);
      if (jsonMatch) {
        foodData = JSON.parse(jsonMatch[0]);
        console.log('从嵌套字符串中提取并解析JSON数组:', JSON.stringify(foodData));
      } else {
        throw new Error('无法从嵌套data字段中提取JSON');
      }
    }
    
    // 如果foodData是数组，取第一个元素
    if (Array.isArray(foodData)) {
      if (foodData.length === 0) {
        console.error('解析后的数据数组为空');
        return getDefaultResult();
      }
      
      const foodItem = foodData[0];
      console.log('从数组中获取第一个食物项:', JSON.stringify(foodItem));
      return extractFoodInfo(foodItem);
    } else if (typeof foodData === 'object' && foodData !== null) {
      // 如果foodData是对象，直接使用
      console.log('使用解析后的对象:', JSON.stringify(foodData));
      return extractFoodInfo(foodData);
    } else {
      console.error('解析后的数据既不是数组也不是对象');
      return getDefaultResult();
    }
  } catch (error) {
    console.error('解析嵌套data字段失败:', error);
    return getDefaultResult();
  }
};

/**
 * 解析data字符串
 * @param {string} dataString - data字段内容
 * @returns {Object} - 格式化后的食物信息
 */
const parseDataString = function(dataString) {
  try {
    console.log('解析data字符串:', dataString);
    
    // 尝试解析JSON字符串
    let foodData;
    try {
      foodData = JSON.parse(dataString);
      console.log('成功解析data字符串为JSON:', JSON.stringify(foodData));
    } catch (e) {
      // 如果解析失败，尝试从字符串中提取JSON数组
      const jsonMatch = dataString.match(/\[\{.*\}\]/);
      if (jsonMatch) {
        try {
          foodData = JSON.parse(jsonMatch[0]);
          console.log('从字符串中提取并解析JSON数组:', JSON.stringify(foodData));
        } catch (err) {
          console.error('解析提取的JSON数组失败:', err);
          // 尝试清理字符串中的转义字符
          const cleanedJson = jsonMatch[0].replace(/\\"/g, '"');
          try {
            foodData = JSON.parse(cleanedJson);
            console.log('使用清理后的JSON解析成功:', JSON.stringify(foodData));
          } catch (cleanErr) {
            console.error('清理后解析仍然失败:', cleanErr);
            throw new Error('无法解析JSON数组');
          }
        }
      } else {
        throw new Error('无法从data字符串中提取JSON');
      }
    }
    
    // 如果foodData是数组，取第一个元素
    if (Array.isArray(foodData)) {
      if (foodData.length === 0) {
        console.error('解析后的数据数组为空');
        return getDefaultResult();
      }
      
      const foodItem = foodData[0];
      console.log('从数组中获取第一个食物项:', JSON.stringify(foodItem));
      return extractFoodInfo(foodItem);
    } else if (typeof foodData === 'object' && foodData !== null) {
      // 如果foodData是对象，直接使用
      console.log('使用解析后的对象:', JSON.stringify(foodData));
      
      // 检查是否有data字段，这可能是嵌套的情况
      if (foodData.data && typeof foodData.data === 'string') {
        console.log('检测到嵌套的data字段，尝试再次解析');
        return parseDataString(foodData.data);
      }
      
      return extractFoodInfo(foodData);
    } else {
      console.error('解析后的数据既不是数组也不是对象');
      return getDefaultResult();
    }
  } catch (error) {
    console.error('解析data字符串失败:', error);
    
    // 尝试处理双重转义的情况
    try {
      console.log('尝试处理双重转义的JSON字符串');
      // 替换掉转义的引号和反斜杠
      const cleanedString = dataString.replace(/\\\\/g, '\\').replace(/\\"/g, '"');
      console.log('清理后的字符串:', cleanedString);
      
      // 尝试提取JSON数组
      const jsonMatch = cleanedString.match(/\[\{.*\}\]/);
      if (jsonMatch) {
        const foodData = JSON.parse(jsonMatch[0]);
        console.log('成功从清理后的字符串中提取JSON数组:', JSON.stringify(foodData));
        
        if (Array.isArray(foodData) && foodData.length > 0) {
          return extractFoodInfo(foodData[0]);
        }
      }
    } catch (e) {
      console.error('处理双重转义失败:', e);
    }
    
    return getDefaultResult();
  }
};

/**
 * 从食物信息对象中提取格式化的结果
 * @param {Object} foodItem - 食物信息对象
 * @returns {Object} - 格式化后的食物信息
 */
const extractFoodInfo = function(foodItem) {
  console.log('提取食物信息:', JSON.stringify(foodItem));
  
  // 检查foodItem是否包含data字段，这可能是嵌套的情况
  if (foodItem.data && typeof foodItem.data === 'string') {
    console.log('食物项包含data字段，尝试解析');
    try {
      // 尝试解析data字段
      return parseDataString(foodItem.data);
    } catch (error) {
      console.error('解析食物项中的data字段失败:', error);
      // 继续使用原始对象
    }
  }
  
  // 构建结果对象
  const parsedResult = {
    name: foodItem.name || '未知食物',
    calories: parseFloat(foodItem.calories || foodItem.energy || 0),
    protein: foodItem.protein || '未知',
    carbs: foodItem.carbs || '未知',
    fat: foodItem.fat || '未知',
    GI: foodItem.GI || '未知',
    GI_level: foodItem.GI_level || '未知',
    GL: foodItem.GL || '未知',
    GL_level: foodItem.GL_level || '未知',
    energy: foodItem.energy || '未知',
    suggestion: foodItem.suggestion || '暂无建议'
  };
  
  // 处理energy字段，如果是字符串，尝试提取数值
  if (typeof parsedResult.calories === 'string' || typeof foodItem.energy === 'string') {
    const energyStr = parsedResult.calories.toString() || foodItem.energy.toString() || '';
    const caloriesMatch = energyStr.match(/(\d+(?:\.\d+)?)/);
    if (caloriesMatch) {
      parsedResult.calories = parseFloat(caloriesMatch[1]);
    }
  }
  
  console.log('解析后的工作流结果:', JSON.stringify(parsedResult));
  return parsedResult;
};

/**
 * 获取默认的食物信息结果
 * @returns {Object} - 默认的食物信息
 */
const getDefaultResult = function() {
  return {
    name: '未知食物',
    calories: 0,
    protein: '未知',
    carbs: '未知',
    fat: '未知',
    GI_level: '未知',
    GL_level: '未知',
    energy: '未知',
    suggestion: '暂无建议'
  };
};

module.exports = {
  callRecordApi
};
