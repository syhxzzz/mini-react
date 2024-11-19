const parseJSX = require("./jsx-parser");

module.exports = function (str) {
  return parseJSX(str);
};
