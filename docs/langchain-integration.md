# LangChain 集成说明

本文档描述了在应用中如何使用 LangChain 功能进行 AI 聊天交互。

## 功能概述

1. **提示词模板** - 使用 LangChain 的 PromptTemplate 功能创建和渲染模板
2. **工具集成** - 使用 LangChain Tool 接口创建动态工具
3. **思考链** - 通过系统提示增强实现思考链功能

## 使用方法

### 提示词模板

提示词模板使用 PromptTemplate 实现，支持变量插值。例如:

```
你是一个专业的{role}。请帮助用户解决{domain}问题。

用户问题: {input}
```

变量会在运行时被替换，`input` 变量会自动填充用户输入内容。

### 工具创建

工具通过以下方式定义:

1. 工具名称和描述
2. 参数定义 (JSON Schema 格式)
3. 工具函数体 (JavaScript 代码)

工具函数接收 `args` 参数，必须返回字符串结果。

### 聊天配置

在聊天界面中，可以通过设置按钮:

- 选择提示词模板
- 启用/禁用工具
- 查看思考过程

## 开发指南

### 添加新的默认模板

在 `langchain/prompt.ts` 文件中的 `DEFAULT_TEMPLATES` 数组中添加。

### 添加新的默认工具

在 `langchain/tools.ts` 文件中的 `DEFAULT_TOOLS` 数组中添加。

### 扩展功能

可以通过修改 `useLangChainTools.ts` hook 来扩展 LangChain 功能。
