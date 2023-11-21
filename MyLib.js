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

  receive(nextElement) {
    const nextProps = nextElement.props;
    const type = nextElement.type;
    const nextRenderedElement = type(nextProps);
    const prevRenderedComponent = this.renderedComponent;
    const prevRenderedElement = prevRenderedComponent.currentElement;
    if (nextRenderedElement.type === prevRenderedElement.type) {
      // 如果两次的 type相同
      prevRenderedComponent.receive(nextRenderedElement);
      return;
    }
    // TODO: getHostNode to be finished
    const prevNode = prevRenderedComponent.getHostNode();

    prevRenderedComponent.unmount();
    const nextRenderedComponent = instantiateComponent(nextRenderedElement);
    const nextNode = nextRenderedComponent.mount();

    // 替换子组件的引用

    this.renderedComponent = nextRenderedComponent;

    // 用新的 Node 替换旧 Node
    prevNode.parentNode.replaceChild(nextNode, prevNode);
  }

  getHostNode() {
    return this.renderedComponent.getHostNode();
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

  receive(nextElement) {
    var node = this.node;
    const prevElement = this.currentElement;
    const prevProps = prevElement.props;
    const nextProps = nextElement.props;
    this.currentElement = nextElement;
    Object.keys(prevProps).forEach((propName) => {
      if (propName !== "children" && !nextProps.hasOwnProperty(propName)) {
        node.removeAttribute(propName);
      }
    });
    Object.keys(nextProps).forEach((propName) => {
      if (propName !== "children") {
        node.setAttribute(propName, nextProps[prevProps]);
      }
    });

    var prevChildren = prevProps.children || [];
    if (!Array.isArray(prevChildren)) {
      prevChildren = [prevChildren];
    }
    var nextChildren = nextProps.children || [];
    if (!Array.isArray(nextChildren)) {
      nextChildren = [nextChildren];
    }
    // 这些是内部实例的数组:
    var prevRenderedChildren = this.renderedChildren;
    var nextRenderedChildren = [];

    // 当我们迭代子组件时，我们将向数组添加相应操作。
    var operationQueue = [];

    // 注意：以下部分非常简化!
    // 它不处理重新排序、带空洞或有 key 的子组件。
    // 它的存在只是为了说明整个流程，而不是细节。

    for (var i = 0; i < nextChildren.length; i++) {
      // 尝试去获取此子组件现有的内部实例
      var prevChild = prevRenderedChildren[i];

      // 如果此索引下没有内部实例，
      // 则子实例已追加到末尾。
      // 创建新的内部实例,挂载它,并使用其节点。
      if (!prevChild) {
        var nextChild = instantiateComponent(nextChildren[i]);
        var node = nextChild.mount();

        // 记录我们需要追加的节点
        operationQueue.push({ type: "ADD", node });
        nextRenderedChildren.push(nextChild);
        continue;
      }

      // 仅当实例的元素类型匹配时，我们才能更新该实例。
      // 例如，<Button size="small" /> 可以更新成 <Button size="large" />，
      // 但是不能更新成 <App />。
      var canUpdate = prevChildren[i].type === nextChildren[i].type;

      // 如果我们无法更新现有的实例，
      // 我们必须卸载它并安装一个新实例去替代
      if (!canUpdate) {
        var prevNode = prevChild.getHostNode();
        prevChild.unmount();

        var nextChild = instantiateComponent(nextChildren[i]);
        var nextNode = nextChild.mount();

        // 记录我们需要替换的节点
        operationQueue.push({ type: "REPLACE", prevNode, nextNode });
        nextRenderedChildren.push(nextChild);
        continue;
      }

      // 如果我们能更新现有的内部实例，
      // 只是让它接收下一个元素并处理自己的更新。
      prevChild.receive(nextChildren[i]);
      nextRenderedChildren.push(prevChild);
    }

    // 最后，卸载不存在的任何子组件:
    for (var j = nextChildren.length; j < prevChildren.length; j++) {
      var prevChild = prevRenderedChildren[j];
      var node = prevChild.getHostNode();
      prevChild.unmount();

      // 记录我们需要删除的节点
      operationQueue.push({ type: "REMOVE", node });
    }

    // 将渲染的子级列表指向更新的版本。
    this.renderedChildren = nextRenderedChildren;

    while (operationQueue.length > 0) {
      var operation = operationQueue.shift();
      switch (operation.type) {
        case "ADD":
          this.node.appendChild(operation.node);
          break;
        case "REPLACE":
          this.node.replaceChild(operation.nextNode, operation.prevNode);
          break;
        case "REMOVE":
          this.node.removeChild(operation.node);
          break;
      }
    }
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
  // 检查现有的树
  if (containerNode.firstChild) {
    var prevNode = containerNode.firstChild;
    var prevRootComponent = prevNode._internalInstance;
    var prevElement = prevRootComponent.currentElement;

    // 如果可以，重用现有的根组件
    if (prevElement.type === element.type) {
      prevRootComponent.receive(element);
      return;
    }

    // 否则，卸载现有树
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
