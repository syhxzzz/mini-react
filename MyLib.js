function mapAttrName(name) {
  if (name == "className") return "class";
  return name;
}

export function createElement(tag, opts, ...children) {
  const node = {},
    props = {};
  node.type = tag;
  Object.keys(opts).map((key) => {
    props[key] = opts[key];
  });
  node.props = props;
  let childrenList = children || [];

  if (!Array.isArray(childrenList)) {
    childrenList = [childrenList];
  }
  node.children = childrenList;
  return node;
}

// ReactDOM.render(
//   {
//     type: "div",
//     props: { className: "open", ref: null, age: 11 },
//     children: [
//       { type: "h1", props: {}, children: [Array] },
//       { type: "p", props: {}, children: [] },
//     ],
//   },
//   document.getElementById("root")
// );
export function render(element, containerNode) {
  const rootComponent = instantiateComponent(element);
  const node = rootComponent.mount();
  containerNode.appendChild(node);
  console.log(1);
}

function instantiateComponent(element) {
  let type = element.type;
  if (typeof type === "string") {
    return new DOMComponent(element);
  } else if (type === undefined) {
    // 此时为 文字节点
    // element = "hello world!"
    return new TextComponent(element);
  }
}

class TextComponent {
  constructor(text) {
    this.text = text;
    this.node = null;
  }
  mount() {
    const node = document.createTextNode(this.text);
    this.node = node;
    return node;
  }
}
class DOMComponent {
  constructor(element) {
    this.currentElement = element; // 虚拟 DOM
    this.node = null;
    this.renderedChildren = [];
  }

  getPublicInstance() {
    return this.node;
  }

  mount() {
    const element = this.currentElement;
    const { type, props, children } = element;
    const node = document.createElement(type);
    this.node = node;
    Object.keys(props).map((propName) => {
      if (propName !== "children") {
        node.setAttribute(propName, props[propName]);
      }
    });

    const renderedChildren = children.map(instantiateComponent);
    this.renderedChildren = renderedChildren;

    const childNodes = renderedChildren.map((item) => item.mount());
    childNodes.map((item) => {
      node.appendChild(item);
    });
    return node;
  }
}
