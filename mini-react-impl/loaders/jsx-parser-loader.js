const { TextNode, parse } = require("./html-parser");

// 用于匹配jsx字符串 return(<></>)
const JSX_STRING =
  /return\s*\(\s*(<[\s\S]*?>[\s\S]*?<\/[\s\S]*?>|<[\s\S]*?\/>)\s*\);/g;
// 匹配 JSX 中的 {}
const JSX_INTERPOLATION = /\{([a-zA-Z0-9]+)\}/gs;

function translate(root) {
  if (Array.isArray(root) && root.length == 0) {
    return;
  }
  let children = [];
  if (root.childNodes.length > 0) {
    children = root.childNodes
      .map((node) => translate(node))
      .filter((node) => node != null);
  }
  if (root instanceof TextNode) {
    // 此时可能会出现 hello {world} 这样的需要进行解析的
    if (root.rawText.trim() === "") {
      return null;
    }
    return `\`${parseText(root.rawText)}\``;
  }
  let tagName = root.tagName;
  let props = root.attrs;

  let tmp = stringify(props);

  return `MiniReact.createElement("${tagName}",${tmp},${children})`;
}

function stringify(props) {
  const result = [];
  for (const key in props) {
    if (Object.prototype.hasOwnProperty.call(props, key)) {
      const element = props[key];
      result.push(`${key}:${element}`);
    }
  }
  return `{${result.join(",")}}`;
}

function parseText(rawText) {
  let interpolation = rawText.match(JSX_INTERPOLATION);
  if (interpolation) {
    let txt = replaceInterpolations(rawText);
    return `${txt}`;
  } else {
    return rawText;
  }
}

function replaceInterpolations(txt, isJSON = false) {
  // 查找 interpolation 有两种情况
  // 第一种是在 props 中，如<div className={myClass} ref={myRef}>
  // 第二种是在文本中，<h1>Hello {name}!</h1>
  // 分别对应着 isOnJSON 的是否
  //  isJSON： txt = `{"className":"{myClass}","ref":"{myRef}"}`
  // isn'tJSON txt =`Hello {name}!`
  //返回值分别是
  //isJSON txt = `{"className":myClass,"ref":myRef}`
  // isn't JSON txt = `Hello ${name}!`
  let interpolation = null;

  while ((interpolation = JSX_INTERPOLATION.exec(txt))) {
    if (isJSON) {
      txt = txt.replace(`"{${interpolation[1]}}"`, interpolation[1]);
    } else {
      txt = txt.replace(`{${interpolation[1]}}`, `\${${interpolation[1]}}`);
    }
  }
  return txt;
}

module.exports = async function (str) {
  let match = null;
  while ((match = JSX_STRING.exec(str))) {
    let HTML = match[1];
    const root = parse(HTML);
    // 这里用 html-parser 解析
    let translated = translate(root.firstChild);
    str = str.replace(HTML, translated);
  }
  return str;
};
