# readme
## 效果预览

这是一个 jsx 的解释器，可以将代码段

```jsx
  return (
    <div className={myClass} ref={myRef}>
      <h1>Hello {name}!</h1>
    </div>
  );
```

转换成

```javascript
	return crateElement(
    'div',
    { className: myClass, ref: myRef },
    createElement(
        'h1',
        {},
        "Hello World"
    )
)
```

## 实现手段

### 在 jsx-parser.js 中

主要的步骤:

1. 先用正则表达式

``````javascript
const JSX_STRING = /\(\s*(<.*)>\s*\)/gs;
// 用于匹配jsx字符串 return(<></>)
``````

2. 在调用 html-fast-node-parser 进行解析，将返回 `root` 结点，是用对象相互嵌套组成的对象，其中有着 html 结点的基本属性，例如 tagName,className,id等属性

   root实例参考

   ```````javascript
   root = {
     childNodes: [
       {
         childNodes: [
           {
             childNodes: [
             ],
             rawText: "\n      ",
             parentNode: [Circular],
           },
           {
             childNodes: [
               {
                 childNodes: [
                 ],
                 rawText: "Hello {name}!",
                 parentNode: [Circular],
               },
             ],
             tagName: "h1",
             rawAttrs: "",
             classNames: [
             ],
             parentNode: [Circular],
           },
           {
             childNodes: [
             ],
             rawText: "\n    ",
             parentNode: [Circular],
           },
         ],
         tagName: "div",
         rawAttrs: "className={myClass} ref={myRef}",
         classNames: [
         ],
         parentNode: [Circular],
       },
     ],
     tagName: null,
     rawAttrs: "",
     classNames: [
     ],
   }
   ```````

   3. 随后递归调用函数 `translate(root)`对root结点进行解析

      `translate()`将会返回如下

      ``````javascript
        return `MyLib.createElement("${tagName}",${replaceInterpolations(
          JSON.stringify(props, replacer),
          true
        )},${children})`;
      ``````

      其中的 tagName 为root中的键值对，children 为递归调用 root 所有的 childNodes 返回的数组，

      #### props

      props 是将root.rawAttrs字符串进行解析,
      
      ``````javascript
      root.rawAttrs = `className={myClass} ref={myRef}`;
      let props = getAttrs(root.rawAttrs);
      // => 
      props = { className: '{myClass}', ref: '{myRef}' };
      ``````

      其中 `${replaceInterpolations(JSON.stringify(props, replacer),true)}`

      #### ${replaceInterpolations( JSON.stringify(props, replacer), true)}
      
       `JSON.stringify(props,replacer)`将一个 javascript 对象 props 进行序列化成字符串，将调用对象的`toJSON()`方法其中对象中的键将会被引号，值将会被转换
      
      ````javascript
      console.log(JSON.stringify({ x: 5, y: 6 }));
      // Expected output: '{"x":5,"y":6}'
      ````
      
      并且JSON.stringify()调用的```replacer(key,value)```,将会一对一对检查 root 对象中的键值，将其中value中有花括号包围的值进行翻译解析，调用`parseText()`,随后调用`replaceInterpolations()`改动
      
      ``````javascript
      isJSON = false;
      `Hello {name}!`
      //replaceInterpolations() =>
      `Hello " + name + " !`
      //parseText()=>
      `"Hello " + name + " !"`
      
      isJSON = true;
      `{"className":"{myClass}","ref":"{myRef}"}`
      //replaceInterpolations()=>
      `{"className":myClass,"ref":myRef}`
      ``````
      
      

### 在 html-fast-node-parser 中

在 html-fast-node-parser 中，主要先调用 `parse(HTML)` 函数进行解析

``````javascript
let HTML = "<div className={myClass} ref={myRef} age={age}>\n      <h1>Hello {name}!</h1>\n    </div>";
const root = parse(HTML);
``````

在parse中，首先会创造一个 `HTMLElement` 类实例 root 作为所有后续结点的总父亲

随后用正则表达式对 `HTML` 进行解析

1. 如果是注释, <!--content-->，则进行 continue 操作

2. 如果不是</ tags ，说明是标签的开头，如 `<div>`

   1. 首先会用对标签中的 id 或者 class 进行识别

   ``````javascript
   let attrs = {};
   for (let attMatch; (attMatch = kAttributePattern.exec(match[3])); )
       attrs[attMatch[1]] = attMatch[3] || attMatch[4] || attMatch[5];
   console.log(attrs);
   ``````

   2. 之后创造一个新的 `HTMLElement` 并将其压入栈中
   3. 

3. 如果是 </ tags

   1. 首先会 `while(true)` 循环遍历 stack，如果此时当前 match 到的 tagName 与栈中最上方的元素的 tagName重合，则 stack 弹出并更新 `currentParent`，

