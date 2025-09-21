"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.promise = exports.arrowFunc = exports.TestClass = void 0;
var _slice = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/slice"));
var _promise = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/promise"));
var _setTimeout2 = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/set-timeout"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/createClass"));
var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/objectWithoutProperties"));
// 测试ES6+特性
var obj = {
  a: 1,
  b: 2
};
var a = obj.a,
  rest = (0, _objectWithoutProperties2.default)(obj, ["a"]);
var arr = [1, 2, 3];
var first = arr[0],
  restArr = (0, _slice.default)(arr).call(arr, 1);
var TestClass = exports.TestClass = /*#__PURE__*/function () {
  function TestClass() {
    (0, _classCallCheck2.default)(this, TestClass);
    this.value = 42;
  }
  return (0, _createClass2.default)(TestClass, [{
    key: "getValue",
    value: function getValue() {
      return this.value;
    }
  }]);
}();
var instance = new TestClass();
console.log(instance.getValue());

// 测试箭头函数
var arrowFunc = exports.arrowFunc = function arrowFunc() {
  return 'Arrow function works!';
};

// 测试Promise
var promise = exports.promise = new _promise.default(function (resolve) {
  (0, _setTimeout2.default)(function () {
    return resolve('Promise works!');
  }, 1000);
});

// 导出