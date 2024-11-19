const fs = require("fs");
const parseJSX = require("./jsx-parser");

async function parseJSXFile(fileName) {
  let content = await fs.promises.readFile(fileName);
  let str = content.toString();

  str = parseJSX(str);
  await fs.promises.writeFile(outputPath, str);
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
