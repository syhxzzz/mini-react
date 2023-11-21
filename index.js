import * as ReactDOM from "./MyLib.js";
// import { Component as App } from "./output.js";
console.log(1);
let a = {
  type: "div",
  props: { className: "open", ref: null, age: 11 },
  children: [
    { type: "h1", props: {}, children: ["hello world"] },
    { type: "p", props: {}, children: [] },
  ],
};
ReactDOM.render(a, document.getElementById("root"));
