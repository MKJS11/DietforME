var _typeof = require("./typeof.js")["default"];
var toPrimitive = require("./toPrimitive.js");

function toPropertyKey(arg) {
  var key = toPrimitive(arg, "string");
  return _typeof(key) === "symbol" ? key : String(key);
}

module.exports = toPropertyKey;
module.exports["default"] = toPropertyKey; 