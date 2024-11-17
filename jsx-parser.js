import * as fs from "fs";
import { TextNode, parse } from "./html-parser/my_index.js";

// 用于匹配jsx字符串 return(<></>)
const JSX_STRING =
  /return\s*\(\s*(<[\s\S]*?>[\s\S]*?<\/[\s\S]*?>|<[\s\S]*?\/>)\s*\);/g;
// 匹配 JSX 中的 {}
const JSX_INTERPOLATION = /\{([a-zA-Z0-9]+)\}/gs;

async function parseJSXFile(fileName) {
  let content = await fs.promises.readFile(fileName);
  let str = content.toString();

  let match = JSX_STRING.exec(str);
  if (match) {
    let HTML = match[1];
    console.log("get the HTML content:");
    console.log(HTML);
    const root = parse(HTML);
    // 这里用 html-parser 解析
    let translated = translate(root.firstChild);
    str = str.replace(HTML, translated);
    await fs.promises.writeFile(outputPath, str);
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
    console.log("Found interpolation " + interpolation);
    let txt = replaceInterpolations(rawText);
    return `${txt}`;
  } else {
    console.log("There was interpolation for " + interpolation);
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
    console.log("fixing interpolation for " + txt);
    console.log("interpolation is " + interpolation);
    if (isJSON) {
      txt = txt.replace(`"{${interpolation[1]}}"`, interpolation[1]);
    } else {
      txt = txt.replace(`{${interpolation[1]}}`, `\${${interpolation[1]}}`);
    }
  }
  console.log("The text being fixed is " + txt);
  return txt;
}

const args = process.argv;

// 第三个参数是 filepath
const filepath = args[2];
const outputPath = args[3];
if (!filepath) {
  console.error("Error: Missing filepath argument.");
  console.log("Usage: node ./parser.js <filepath>");
  process.exit(1); // 退出程序，表示错误
}

(async () => {
  await parseJSXFile(filepath);
})();
