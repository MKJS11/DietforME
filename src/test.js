// 测试ES6+特性
const obj = { a: 1, b: 2 };
const { a, ...rest } = obj;

const arr = [1, 2, 3];
const [first, ...restArr] = arr;

class TestClass {
  constructor() {
    this.value = 42;
  }
  
  getValue() {
    return this.value;
  }
}

const instance = new TestClass();
console.log(instance.getValue());

// 测试箭头函数
const arrowFunc = () => {
  return 'Arrow function works!';
};

// 测试Promise
const promise = new Promise((resolve) => {
  setTimeout(() => resolve('Promise works!'), 1000);
});

// 导出
export { TestClass, arrowFunc, promise }; 