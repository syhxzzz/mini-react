// require("apollojs");
import "apollojs";

// let entities = require("entities");
import * as entities from "entities";
/**
 * Node Class as base class for TextNode and HTMLElement.
 */
export class Node {
  constructor() {
    this.childNodes = [];
  }
}

/** 
    TextNode to contain a text element in DOM tree
  *  @param {string} value [description]
*/
export class TextNode extends Node {
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

var kBlockElements = {
  div: true,
  p: true,
  ul: true,
  ol: true,
  li: true,
  table: true,
  tr: true,
  td: true,
  section: true,
  br: true,
};

/**
 * HTMLElement, which contains a set of children.
 * @param {string} tagName
 * @param {Object} keyAttrs id and class attribute
 * @param {string} rawAttrs attributes in string
 * TODO: in the index.js rawAttrs is {Object}
 */

export class HTMLElement extends Node {
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

/**
 * Cache to store generated match functions
 * @type {Object}
 */
var pMatchFunctionCache = {};

/**
 * Matcher class to make CSS match
 * @param {string} selector Selector
 */

export class Matcher {
  constructor(selector) {
    this.matchers = selector.split(" ").map(function (matcher) {
      if (pMatchFunctionCache[matcher]) {
        return pMatchFunctionCache[matcher];
      }
      let parts = matcher.split(".");
      let tagName = parts[0];
      let classes = parts.slice(1);
      let source = "";
      if (tagName && tagName != "*") {
        if (tagName[0] == "#") {
          source +=
            "if (el.id!=" +
            JSON.stringify(tagName.substring(1)) +
            ") return false;";
        } else {
          source +=
            "if (el.tagName!=" + JSON.stringify(tagName) + ")return false;";
        }
      }
      if (classes.length > 0) {
        source +=
          "for (let cls=" +
          JSON.stringify(classes) +
          ",i=0;i<cls.length;i++)if(el.classNames.indexOf(cls[i])===-1)return false;";
      }
      source += "return true;";
      return (pMatchFunctionCache[matcher] = new Function("el", source));
    });
    this.nextMatch = 0;
  }
  /**
   * Trying to advance match pointer
   * @param  {HTMLElement} el element to make the match
   * @return {bool}           true when pointer advanced.
   */
  advance(el) {
    if (
      this.nextMatch < this.matchers.length &&
      this.matchers[this.nextMatch](el)
    ) {
      this.nextMatch++;
      return true;
    }
    return false;
  }
  /**
   * Rewind the match pointer
   */
  rewind() {
    this.nextMatch--;
  }
  /**
   * Trying to determine if match made.
   * @return {bool} true when the match is made
   */
  get matched() {
    return this.nextMatch == this.matchers.length;
  }
  /**
   * Reset match pointer.
   * @return {[type]} [description]
   */
  reset() {
    this.nextMatch = 0;
  }
  static flushCache() {
    pMatchFunctionCache = {};
  }
}
// var kMarkupPattern =
var kMarkupPattern =
  /<([A-Z][A-Za-z0-9]*|[a-z][A-Za-z0-9]*)(\s+[^=<>/\s]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*}))?)*\s*(\/?)>/gi;
var kAttributePattern = /\b(id|class)\s*=\s*("([^"]+)"|'([^']+)'|(\S+))/gi;
var kSelfClosingElements = {
  meta: true,
  img: true,
  link: true,
  input: true,
  area: true,
  br: true,
  hr: true,
};
var kElementsClosedByOpening = {
  li: { li: true },
  p: { p: true, div: true },
  td: { td: true, th: true },
  th: { td: true, th: true },
};
var kElementsClosedByClosing = {
  li: { ul: true, ol: true },
  a: { div: true },
  b: { div: true },
  i: { div: true },
  p: { div: true },
  td: { tr: true, table: true },
  th: { tr: true, table: true },
};

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
export function parse(data) {
  let root = new HTMLElement(null, {});
  let currentParent = root;
  let stack = [root];
  let lastTextPos = -1;

  // var kMarkupPattern =
  // /<!--[^]*?(?=-->)-->|<(\/?)([a-z][a-z0-9]*)\s*([^>]*?)(\/?)>/gi;

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
      if (currentParent.tagName === match[1]) {
        stack.pop();
        currentParent = stack.back;
        break;
      } else {
        throw Error("Input string label can't be closed");
      }
    } else {
      // 处理 props
      const attrs = parseProps(props);
      const thisHTMLElement = new HTMLElement(tagName, attrs, props);
      currentParent.appendChild(thisHTMLElement);
      if (!isSelfClosed) {
        // 自闭合标签
        currentParent = thisHTMLElement;
        stack.push(currentParent);
      }
    }
  }

  return root;
}
// };

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
