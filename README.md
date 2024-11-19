# MiniReact

这是一个简易的 React 实现，其中包括有 React 本身的一些核心机制。还有自己实现的 jsx 解释器，解释器可以作为 webpack loader 使用。具体细节见各模块的 README。

## 模块

- MiniReact
  - 是一个简易的 React 实现，实现了基本的时间分片更新机制。和基本的 hooks 支持。
- jsx-parser
  - 是一个简易的 jsx 解释器，解释器可以作为 webpack loader 使用。

## 使用方式

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```
