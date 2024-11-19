# README

这是一个 mini-react 的实现，其中包含 jsx 的解释器，以及 html 的解析器

## 效果预览

这是一个 jsx 的解释器，可以将代码段

```jsx
<div className={myClass} ref={myRef}>
  <h1>Hello {name}!</h1>
</div>
```

转换成

```javascript
MiniReact.createElement(
  "div",
  { className: myClass, ref: myRef },
  MiniReact.createElement("h1", {}, "Hello World")
);
```

## 实现细节

1. 通过正则表达式搜索 jsx 字符串

2. 通过 html-parser 解析 html 字符串，得到虚拟 dom 树

3. 调用 translate 函数，对虚拟 dom 树和其子树进行递归处理

4. 通过 stringify 处理 props 对象

5. 最后通过 tagName,props,children 生成 jsx 字符串

## 形态

目前 jsx-parser 可以有两种工作方式，一种是读取文件，将文件内容转换成 js 代码。一种是作为 webpack loader 使用。

### 直接转换

```bash
node jsx-parser.js input.jsx output.js
```

### 作为 webpack loader 使用

```javascript
module: {
  rules: [
    {
      test: /\.jsx$/, // 匹配 .jsx 文件
      use: [
        {
          loader: path.resolve(__dirname, "./loaders/jsx-parser-loader.js"),
        },
      ],
    },
    ...
  ],
}
```
