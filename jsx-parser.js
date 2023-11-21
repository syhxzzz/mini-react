import * as fs from "fs";
import { TextNode, parse } from "./node-fast-html-parser/my_index.js";

const JSX_STRING = /\(\s*(<.*)>\s*\)/gs;
// 用于匹配jsx字符串 return(<></>)
const JSX_INTERPOLATION = /\{([a-zA-Z0-9]+)\}/gs;
const QUOTED_STRING = /["|'](.*)["|']/g;
//
async function parseJSXFile(fileName) {
  let content = await fs.promises.readFile(fileName);
  let str = content.toString();

  let match = JSX_STRING.exec(str);
  if (match) {
    let HTML = match[1] + ">";
    console.log("get the HTML content:");
    console.log(HTML);
    const root = parse(HTML);
    // 这里用 html-fast-node-parser 解析
    let translated = translate(root.firstChild);
    str = str.replace(HTML, translated);
    await fs.promises.writeFile("output.js", str);
    console.log(root.firstChild.structure);
  }
}

function translate(root) {
  if (Array.isArray(root) && root.length == 0) {
    return;
  }
  console.log("Current root");
  console.log(root);
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
    return parseText(root.rawText);
  }
  let tagName = root.tagName;
  let props = getAttrs(root.rawAttrs);
  console.log("Current Props:");
  console.log(props);
  if (tagName[0] >= "a" && tagName <= "z") {
    tagName = `"${tagName}"`;
  }
  return `MyLib.createElement(${tagName},${replaceInterpolations(
    JSON.stringify(props, replacer),
    true
  )},${children})`;
}

function parseText(rawText) {
  let interpolation = rawText.match(JSX_INTERPOLATION);
  if (interpolation) {
    console.log("Found interpolation " + interpolation);
    // TODO
    let txt = replaceInterpolations(rawText);
    return `"${txt}"`;
  } else {
    console.log("There was interpolation for " + interpolation);
    return rawText;
  }
}

function getAttrs(rawAttrs) {
  // attrsStr = "className={myClass} ref={myRef}"
  if (rawAttrs == undefined) return {};
  if (rawAttrs.trim() === "") return {};
  let objAttrs = {};
  let parts = rawAttrs.split(" ");
  parts.forEach((part) => {
    const [key, value] = part.split("=");
    console.log(`obj[${key}]==${value}`);
    objAttrs[key] = value;
  });
  return objAttrs;
}

function replacer(key, value) {
  if (key) {
    let result = QUOTED_STRING.exec(value);
    if (result) {
      return parseText(result[1]);
    }
    return value;
  } else {
    return value;
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
  //isn'tJSON txt = `"Hello " + name + "!"'
  let interpolation = null;

  while ((interpolation = JSX_INTERPOLATION.exec(txt))) {
    console.log("fixing interpolation for " + txt);
    console.log("interpolation is " + interpolation);
    if (isJSON) {
      txt = txt.replace(`"{${interpolation[1]}}"`, interpolation[1]);
    } else {
      txt = txt.replace(
        `{${interpolation[1]}}`,
        `" + ` + interpolation[1] + ` + "`
      );
    }
  }
  console.log("The text being fixed is " + txt);
  return txt;
}

(async () => {
  await parseJSXFile("file.jsx");
})();
