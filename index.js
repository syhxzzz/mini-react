import * as ReactDOM from "./MyLib.js";
// import { Component as App } from "./output.js";
function App() {
  return ReactDOM.createElement(
    "h2",
    {},
    ReactDOM.createElement("h1", {}, "Hello world!")
  );
}
let a = {
  type: "div",
  props: { className: "open", ref: null, age: 11 },
  children: [
    { type: "h1", props: {}, children: ["hello world"] },
    { type: App, props: {}, children: [] },
    { type: "h1", props: {}, children: ["114 514"] },
    { type: "h1", props: {}, children: ["514 114"] },
  ],
};
ReactDOM.render(a, document.getElementById("root"));
