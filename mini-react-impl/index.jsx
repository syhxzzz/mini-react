function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) =>
        typeof child === "object" ? child : createTextElement(child)
      ),
    },
  };
}

function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot,
  };
  deletions = [];
  nextUnitOfWork = wipRoot;
}

let wipRoot = null;
let currentRoot = null;
let nextUnitOfWork = null;
let deletions = null;

function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

function performUnitOfWork(fiber) {
  const isFunctionComponent = fiber.type instanceof Function;
  if (isFunctionComponent) {
    updateFunctionComponent(fiber);

    let hookIndex = null;
    fiber.hooks
      .filter((hook, index) => {
        hookIndex = index;
        return hook.tag === "EFFECT";
      })
      .forEach((hook) => {
        const oldHook =
          fiber.alternate &&
          fiber.alternate.hooks &&
          fiber.alternate.hooks[hookIndex];
        const oldDeps = oldHook.deps;

        const { callback, deps } = hook;
        let flag = false;
        for (let i = 0; i < deps.length; i++) {
          if (deps[i] !== oldDeps[i]) {
            flag = true;
            break;
          }
        }
        if (flag) {
          pendingEffects.push(callback);
        }
      });
  } else {
    updateHostComponent(fiber);
  }

  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
}

let wipFiber = null;
let hookIndex = null;

function updateFunctionComponent(fiber) {
  wipFiber = fiber;
  hookIndex = 0;
  wipFiber.hooks = [];
  const children = [fiber.type(fiber.props)];
  reconcileChildren(wipFiber, children);
}

function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  reconcileChildren(fiber, fiber.props.children);
}

const isEvent = (key) => key.startsWith("on");
const isProperty = (key) => key !== "children" && !isEvent(key);
const isNew = (prevProps, nextProps) => (key) =>
  prevProps[key] !== nextProps[key];
const isGone = (prevProps, nextProps) => (key) =>
  !nextProps[key] && prevProps[key];

function createDom(fiber) {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);
  updateDom(dom, {}, fiber.props);
  return dom;
}

function updateDom(dom, prevProps, nextProps) {
  // remove old or changed event handler
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(
      (key) =>
        isGone(prevProps, nextProps)(key) || isNew(prevProps, nextProps)(key)
    )
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });
  // remove old properties
  Object.keys(prevProps)
    .filter(isProperty)
    .filter((key) => isGone(prevProps, nextProps)(key))
    .forEach((name) => {
      delete dom[name];
    });
  // set new or changed properties

  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = nextProps[name];
    });
  // add new listener
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
}

function commitRoot() {
  deletions.forEach(commitWork);
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
  pendingEffects.forEach((it) => it());
  pendingEffects = [];
}

function commitWork(fiber) {
  if (!fiber) {
    return;
  }
  let domParentFiber = fiber.parent;
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }
  const domParent = domParentFiber.dom;
  if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  } else if (fiber.effectTag === "DELETION") {
    commitDeletion(fiber, domParent);
  }
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child, domParent);
  }
}

function reconcileChildren(wipFiber, elements) {
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null;
  while (index < elements.length || oldFiber != null) {
    const element = elements[index];
    let newFiber = null;
    const sameType = oldFiber && element && element.type === oldFiber.type;
    if (sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
      };
    }
    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT",
      };
    }
    if (oldFiber && !sameType) {
      (oldFiber.effectTag = "DELETION"), deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }
    if (index === 0) {
      wipFiber.child = newFiber;
    } else if (element) {
      prevSibling.sibling = newFiber;
    }
    prevSibling = newFiber;
    index++;
  }
}

function useState(initial) {
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex];

  const hook = {
    tag: "STATE",
    state: oldHook ? oldHook.state : initial,
    queue: [],
  };

  const actions = oldHook ? oldHook.queue : [];
  actions.forEach((action) => {
    hook.state = action instanceof Function ? action(hook.state) : action;
  });

  const setState = (action) => {
    hook.queue.push(action);
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot,
    };
    nextUnitOfWork = wipRoot;
    deletions = [];
  };
  wipFiber.hooks.push(hook);
  hookIndex++;
  return [hook.state, setState];
}

function useLayoutEffect(callback, deps) {
  let oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex];

  let flag = !oldHook || false;
  if (oldHook) {
    for (let index = 0; index < deps.length; index++) {
      const dep = deps[index];
      if (dep !== oldHook.deps[index]) {
        flag = true;
        oldHook.clearFunction();
        break;
      }
    }
  }
  let hook = {
    tag: "LAYOUT_EFFECT",
    callback,
    deps,
    clearFunction: flag ? callback() : oldHook.clearFunction,
  };
  wipFiber.hooks.push(hook);
  hookIndex++;
}

let pendingEffects = [];
function useEffect(callback, deps) {
  const hook = {
    tag: "EFFECT",
    callback,
    deps,
  };
  wipFiber.hooks.push(hook);
  hookIndex++;
}

const MiniReact = {
  createElement,
  render,
  useState,
  useLayoutEffect,
};

function useMemo(callback, deps) {
  // TODO
}

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
  return (
    <div>
      <p>count:{count}</p>
      <button onClick={() => setCount((count) => count + 1)}>add 1</button>
    </div>
  );
}
const container = document.getElementById("root");
render(<Count />, container);
