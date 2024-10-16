// var HTMLParser = require("fast-html-parser");
var HTMLParser = require("./my_index");
var root = HTMLParser.parse(
  '<ul id="list"><li class="abc def"><p class="ghi">Hello World</p><hr />  <script src=""></script><!-- dd --></li></ul>'
);

console.log(root.firstChild.structure);
// ul#list
//   li
//     #text

// console.dir(root.querySelectorAll(".abc.def .ghi"));
console.dir(root.querySelector("#list"));
// { tagName: 'ul',
//   rawAttrs: 'id="list"',
//   childNodes:
//    [ { tagName: 'li',
//        rawAttrs: '',
//        childNodes: [Object],
//        classNames: [] } ],
//   id: 'list',
//   classNames: [] }
