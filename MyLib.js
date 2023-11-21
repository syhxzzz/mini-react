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
