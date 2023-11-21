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
  mountTree(element, containerNode);
  mountTree(element, containerNode);
}

function instantiateComponent(element) {
  let type = element.type;
  if (typeof type === "string") {
    return new DOMComponent(element);
  } else if (type === undefined) {
    // 此时为 文字节点
    // element = "hello world!"
    return new TextComponent(element);
  } else if (typeof type === "function") {
    return new CompositeComponent(element);
  }
}

class CompositeComponent {
  constructor(element) {
    this.currentElement = element;
    // this.publicInstance = null;
    // used by Class Component ,cause Function Component doesn't have public instance
    // yet Class Component has state and life cycle which means it needs public class method
    this.renderedComponent = null;
  }
  getPublicInstance() {
    // 对于组合组件，公共类实例
    return this.publicInstance;
  }
  mount() {
    const element = this.currentElement;
    const { type, props } = element;
    let publicInstance;
    let renderedElement;
    // suppose type to be function component
    publicInstance = null;
    renderedElement = type(props);

    this.publicInstance = publicInstance;

    let renderedComponent = instantiateComponent(renderedElement);
    this.renderedComponent = renderedComponent;
    return renderedComponent.mount();
  }
  unmount() {
    const renderedComponent = this.renderedComponent;
    renderedComponent.unmount();
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
  unmount() {
    // this.node.innerHTML=''
    // do nothing
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

  unmount() {
    const renderedChildren = this.renderedChildren;
    renderedChildren.forEach((child) => {
      if (child) {
        child.unmount();
      }
    });
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

export function mountTree(element, containerNode) {
  if (containerNode.firstChild) {
    unmountTree(containerNode);
  }
  const rootComponent = instantiateComponent(element);

  const node = rootComponent.mount();
  containerNode.appendChild(node);
  node._internalInstance = rootComponent;
}

function unmountTree(containerNode) {
  const node = containerNode.firstChild;
  const rootComponent = node._internalInstance;

  rootComponent.unmount();
  containerNode.innerHTML = "";
}
