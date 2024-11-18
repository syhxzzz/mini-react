require("apollojs");
const entities = require("entities");
/**
 * Node Class as base class for TextNode and HTMLElement.
 */
class Node {
  constructor() {
    this.childNodes = [];
  }
}

/** 
    TextNode to contain a text element in DOM tree
  *  @param {string} value [description]
*/
class TextNode extends Node {
  constructor(value) {
    super();
    this.rawText = value;
  }

  /**
   * Get unescaped text value of current node and its children.
   * @return {string} text content
   */
  get text() {
    // entities.decodeHTML5
    return entities.decodeHTML5(this.rawText);
  }

  /**
   * Detect if the node contains only white space.
   * @return {bool}
   */
  get isWhitespace() {
    return /^(\s|&nbsp;)*$/.test(this.rawText);
  }
}

/**
 * HTMLElement, which contains a set of children.
 * @param {string} tagName
 * @param {Object} keyAttrs id and class attribute
 * @param {string} rawAttrs attributes in string
 * TODO: in the index.js rawAttrs is {Object}
 */

class HTMLElement extends Node {
  constructor(tagName, keyAttrs, rawAttrs) {
    super();
    this.tagName = tagName;
    this.rawAttrs = rawAttrs || "";
    this.attrs = keyAttrs;
    this.classNames = [];
    // this.childNodes = [];
    if (keyAttrs.id) {
      this.id = keyAttrs.id;
    }
    if (keyAttrs.class) {
      this.classNames = keyAttrs.class.split(/\s+/);
    }
  }
  /**
   * Get unescaped text value of current node and its children
   * @return {string} text content
   */
  get text() {
    return entities.decodeHTML5(this.rawText);
  }

  /**
   * Get escaped text value of current node and its children
   * @return {string} text content
   */
  get rawText() {
    let res = "";
    for (let index = 0; index < this.childNodes.length; index++) {
      const child = this.childNodes[index];
      res += child.rawText;
    }
  }
  /**
   * Get DOM structure
   * @return {string} structure
   */
  get structure() {
    let res = [];
    let indention = 0;
    function write(text) {
      res.push("  ".repeat(indention) + text);
    }
    function dfs(root) {
      let idStr = root.id ? "#" + root.id : "";
      let classStr = root.classNames.length
        ? "." + root.classNames.join(".")
        : "";
      write(root.tagName + idStr + classStr);
      indention++;
      for (let index = 0; index < root.childNodes.length; index++) {
        const node = root.childNodes[index];
        if (node instanceof HTMLElement) {
          dfs(node);
        } else if (node instanceof TextNode) {
          if (!node.isWhitespace) {
            write("#text");
          }
        }
      }
      indention--;
    }
    dfs(this);
    return res.join("\n");
  }
  ku;
  /**
   * Query CSS selector to find matching nodes.
   * @param {string} selector Simplified CSS selector
   * @param {Matcher} selector A Matcher instance
   * @return {HTMLElement[]} matching elements
   */
  querySelectorAll(selector) {
    let matcher;
    if (selector instanceof Matcher) {
      matcher = selector;
      matcher.reset();
    } else {
      matcher = new Matcher(selector);
    }
    let res = [];
    let stack = [];
    for (let id = 0; id < this.childNodes.length; id++) {
      const node = this.childNodes[id];
      stack.push([node, 0, false]);
      while (stack.length) {
        let state = stack.back;
        let el = state[0];
        if (state[1] === 0) {
          // Seen for first time
          if (el instanceof TextNode) {
            stack.pop();
            continue;
          }
          if ((state[2] = matcher.advance(el) && matcher.matched)) {
            res.push(el);
            matcher.rewind();
            stack.pop();
            continue;
          }
        }
        if (state[1] < el.childNodes.length) {
          stack.push([el.childNodes[state[1]++], 0, false]);
        } else {
          if (state[2]) matcher.rewind();
          stack.pop();
        }
      }
    }

    return res;
  }
  /**
   * Query CSS Selector to find matching node.
   * @param  {string}         selector Simplified CSS selector
   * @param  {Matcher}        selector A Matcher instance
   * @return {HTMLElement}    matching node
   */
  querySelector(selector) {
    let matcher;
    if (selector instanceof Matcher) {
      matcher = selector;
      matcher.reset();
    } else {
      matcher = new Matcher(selector);
    }
    let stack = [];
    for (let index = 0; index < this.childNodes.length; index++) {
      const node = this.childNodes[index];
      stack.push([node, 0, false]);
      while (stack.length) {
        let state = stack.back;
        let el = state[0];
        if (state[1] === 0) {
          //Seen for first time
          if (el instanceof TextNode) {
            stack.pop();
            continue;
          }
          if ((state[2] = matcher.advance(el) && matcher.matched)) {
            return el;
          }
        }
        if (state[1] < el.childNodes.length) {
          stack.push([el.childNodes[state[1]++], 0, false]);
        } else {
          if (state[2]) matcher.rewind();
          stack.pop();
        }
      }
    }
    return null;
  }
  /**
   * Append a child node to childNodes
   * @param {node} node node to append
   * @return {Node} node appended
   */
  appendChild(node) {
    node.parentNode = this;
    this.childNodes.push(node);
    return node;
  }
  /**
   * Get first child node
   * @return {Node} first child node
   */
  get firstChild() {
    return this.childNodes.front;
  }
  /**
   * Get last child node
   * @return {Node} last child node
   */
  get lastChild() {
    return this.childNodes.back;
  }

  /**
   * Get attributes
   * @return {Object} parsed and unescaped attributes
   */
  get attributes() {
    if (this._attrs) {
      return this._attrs;
    }
    this._attrs = {};
    let attrs = this.rawAttributes;
    for (let key in attrs) {
      this._attrs[key] = entities.decodeHTML5(attrs[key]);
    }
    return this._attrs;
  }

  get rawAttributes() {
    if (this._rawAttrs) {
      return this._rawAttrs;
    }
    let attrs = {};
    if (this.rawAttrs) {
      let re = /\b([a-z][a-z0-9\-]*)\s*=\s*("([^"]+)"|'([^']+)'|(\S+))/gi;
      for (let match; (match = re.exec(this.rawAttrs)); )
        attrs[match[1]] = match[3] || match[4] || match[5];
    }
    this._rawAttrs = attrs;
    return attrs;
  }
}

var kMarkupPattern =
  /<\/?[A-Za-z][A-Za-z0-9]*(\s+[^=<>/\s]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*}))?)*\s*\/?>/g;

/**
 * Parses HTML and returns a root element
 */
// module.exports = {
//  export Matcher,
// Node,
// HTMLElement,
// TextNode,

/**
 * Parse a chunk of HTML source
 * @param {string} data html
 * @return {HTMLElement} root element
 */
function parse(data) {
  let root = new HTMLElement(null, {});
  let currentParent = root;
  let stack = [root];
  let lastTextPos = -1;

  for (let match; (match = kMarkupPattern.exec(data)); ) {
    const totalExp = match[0];
    // 类似于 totalExp = '<div onClick={() => setCount((count) => count + 1)} className="11"></div>'
    const jsxInfo = handleJSXTag(totalExp);
    const { tagName, isSelfClosed, closed, props } = jsxInfo;
    if (lastTextPos > -1) {
      if (lastTextPos + match[0].length < kMarkupPattern.lastIndex) {
        let text = data.substring(
          lastTextPos,
          kMarkupPattern.lastIndex - match[0].length
        );
        currentParent.appendChild(new TextNode(text));
      }
    }
    lastTextPos = kMarkupPattern.lastIndex;

    if (closed) {
      if (match[0].includes(currentParent.tagName)) {
        stack.pop();
        currentParent = stack.back;
      } else {
        throw Error("Input string label can't be closed");
      }
    } else {
      // 处理 props
      const attrs = parseProps(props);
      const thisHTMLElement = new HTMLElement(tagName, attrs, props);
      currentParent.appendChild(thisHTMLElement);
      if (!isSelfClosed) {
        // 普通标签，继续向下遍历
        currentParent = thisHTMLElement;
        stack.push(currentParent);
      }
    }
  }

  return root;
}

function handleJSXTag(input) {
  const result = {
    tagName: "",
    props: "",
    isSelfClosed: false,
    closed: false,
  };

  // 移除首尾空白字符
  const trimmed = input.trim();

  // 检查是否闭合标签
  if (trimmed.startsWith("</")) {
    result.closed = true;
    // 提取标签名
    const endTag = trimmed.slice(2, trimmed.indexOf(">")).trim();
    result.tagName = endTag;
    return result;
  }

  // 检查是否自闭合标签
  result.isSelfClosed = trimmed.endsWith("/>");

  // 去掉尖括号
  const innerContent = trimmed.slice(1, result.isSelfClosed ? -2 : -1).trim();

  // 提取标签名
  let spaceIndex = innerContent.indexOf(" ");
  if (spaceIndex === -1) {
    // 没有属性部分
    result.tagName = innerContent;
    result.props = "";
  } else {
    // 有属性部分
    result.tagName = innerContent.slice(0, spaceIndex);
    result.props = innerContent.slice(spaceIndex + 1).trim();
  }

  return result;
}

function parseProps(propsString) {
  const attrs = {};
  let currentKey = "";
  let currentValue = "";
  let inQuotes = false;
  let quoteType = ""; // Type of quotes (' or ")
  let inBraces = false; // Track if inside {}
  let isParsingValue = false;

  for (let i = 0; i < propsString.length; i++) {
    const char = propsString[i];

    if (inQuotes) {
      // Inside quotes, accumulate value until the quote ends
      if (char === quoteType) {
        inQuotes = false;
        currentValue += char; // Include the closing quote
      } else {
        currentValue += char;
      }
    } else if (inBraces) {
      // Inside braces, accumulate value until the brace ends
      if (char === "}") {
        inBraces = false;
        currentValue += char; // Include the closing brace
      } else {
        currentValue += char;
      }
    } else {
      if (char === "=") {
        // Equal sign indicates the start of a value
        isParsingValue = true;
      } else if (char === '"' || char === "'") {
        // Start of a quoted value
        inQuotes = true;
        quoteType = char;
        currentValue += char; // Include the opening quote
      } else if (char === "{") {
        // Start of a brace-enclosed value
        inBraces = true;
        currentValue += char; // Include the opening brace
      } else if (char === " " && isParsingValue && currentValue.trim() !== "") {
        // Space indicates the end of a key-value pair (outside quotes/braces)
        currentValue = currentValue.trim();
        if (currentValue[0] === "{") currentValue = currentValue.slice(1, -1);
        attrs[currentKey.trim()] = currentValue.trim();
        currentKey = "";
        currentValue = "";
        isParsingValue = false;
      } else if (isParsingValue) {
        // Accumulate value
        currentValue += char;
      } else {
        // Accumulate key
        currentKey += char;
      }
    }
  }

  // Add the last key-value pair if any
  if (currentKey.trim() && currentValue.trim()) {
    currentValue = currentValue.trim();
    if (currentValue[0] === "{") currentValue = currentValue.slice(1, -1);
    attrs[currentKey.trim()] = currentValue.trim();
  }

  return attrs;
}

module.exports = {
  parse,
  TextNode,
};