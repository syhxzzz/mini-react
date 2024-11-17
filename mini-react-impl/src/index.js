import { MiniReact } from "./react";

const { useEffect, useState, render } = MiniReact;

/** @jsx MiniReact.createElement */
function Count() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log(`计数器更新为: ${count}`);

    // 返回的函数会在组件卸载或下一次更新时执行
    return () => {
      console.log(`清理上一次的计数值: ${count}`);
    };
  }, [count]); // 依赖项为 count，每次 count 变化时都会触发
  return MiniReact.createElement(
    "div",
    {},
    MiniReact.createElement("p", {}, `count:${count}`),
    MiniReact.createElement(
      "button",
      { onClick: () => setCount((count) => count + 1) },
      `add 1`
    )
  );
}
const element = MiniReact.createElement(Count, {});
const container = document.getElementById("root");
render(element, container);
