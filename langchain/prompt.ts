import { PromptTemplate } from "@langchain/core/prompts";

/**
 * 提示词模板类型
 */
export interface PromptTemplateType {
  id: string;
  name: string;
  description?: string;
  template: string;
  inputVariables: string[];
  createdAt: number;
  updatedAt: number;
  isSystem?: boolean; // 是否是系统提供的模板
  category?: string; // 可选的分类
}

/**
 * 创建LangChain Prompt模板
 */
export function createPromptTemplate(promptTemplate: PromptTemplateType) {
  return new PromptTemplate({
    template: promptTemplate.template,
    inputVariables: promptTemplate.inputVariables,
  });
}

/**
 * 默认提示词模板
 */
export const DEFAULT_TEMPLATES: PromptTemplateType[] = [
  {
    id: "default_assistant",
    name: "默认助手",
    description: "通用AI助手的提示词模板",
    template: "你是一个有帮助的AI助手。请根据用户的需求提供准确、有用的回答。\n\n{input}",
    inputVariables: ["input"],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isSystem: true,
  },
  {
    id: "code_assistant",
    name: "代码助手",
    description: "专注于编程和技术问题的助手",
    template: "你是一个专业的编程助手。请提供简洁、高效、易于理解的代码和技术解答。\n\n用户问题: {input}",
    inputVariables: ["input"],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isSystem: true,
  },
  {
    id: "translator",
    name: "翻译助手",
    description: "将文本翻译成指定语言",
    template: "请将以下{source_language}文本翻译成{target_language}，保持原意的同时使表达自然流畅。\n\n文本: {input}",
    inputVariables: ["source_language", "target_language", "input"],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isSystem: true,
  },
];

/**
 * 解析提示词模板中的变量
 */
export function parseTemplateVariables(template: string): string[] {
  const regex = /{([^{}]+)}/g;
  const matches = template.match(regex);
  if (!matches) return [];
  
  return matches.map(match => match.replace(/{|}/g, ""));
}
