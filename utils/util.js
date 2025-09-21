/**
 * 通用工具函数
 */

/**
 * 格式化时间
 * @param {Date} date 日期对象
 * @returns {string} 格式化后的时间字符串
 */
const formatTime = date => {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    date = new Date();
  }
  
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

/**
 * 格式化数字
 * @param {number} n 数字
 * @returns {string} 格式化后的数字字符串
 */
const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

/**
 * 生成唯一ID
 * @returns {string} 唯一ID
 */
const generateUniqueId = () => {
  return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 深拷贝对象
 * @param {Object} obj 要拷贝的对象
 * @returns {Object} 拷贝后的对象
 */
const deepClone = obj => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item));
  }
  
  if (obj instanceof Object) {
    const copy = {};
    Object.keys(obj).forEach(key => {
      copy[key] = deepClone(obj[key]);
    });
    return copy;
  }
  
  return obj;
}

/**
 * 防抖函数
 * @param {Function} func 要执行的函数
 * @param {number} wait 等待时间
 * @returns {Function} 防抖后的函数
 */
const debounce = (func, wait = 300) => {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}

module.exports = {
  formatTime,
  formatNumber,
  generateUniqueId,
  deepClone,
  debounce
} 