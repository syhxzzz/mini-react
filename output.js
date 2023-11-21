/*
crateElement(
    'div',
    { className: myClass, ref: myRef },
    createElement(
        'h1',
        {},
        "Hello World"
    )
)
*/
import * as MyLib from "./MyLib.js";

export function Component() {
  let myRef = null;
  let name = "Fernando";
  let myClass = "open";
  let age = 11;
  return MyLib.createElement(
    "div",
    { className: myClass, ref: myRef, age: age },
    MyLib.createElement("h1", {}, "Hello " + name + "!"),
    MyLib.createElement(App, {})
  );
}

console.log(Component());
