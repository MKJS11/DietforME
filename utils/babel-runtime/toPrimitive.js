var _typeof = require("./typeof.js")["default"];

function toPrimitive(input, hint) {
  if (_typeof(input) !== "object" || input === null) return input;
  
  // 微信小程序环境中可能不支持Symbol，所以我们使用更简单的实现
  if (hint === "string") {
    return String(input);
  }
  
  return Number(input);
}

module.exports = toPrimitive;
module.exports["default"] = toPrimitive; 