import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";

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
  // 可选的 schema 定义，用于结构化输入参数
  inputSchema?: Record<string, {
    type: string;
    description: string;
    required?: boolean;
  }>;
}

/**
 * 创建LangChain Prompt模板
 */
export function createPromptTemplate(promptTemplate: PromptTemplateType) {
  // 基本的 PromptTemplate 创建
  const template = new PromptTemplate({
    template: promptTemplate.template,
    inputVariables: promptTemplate.inputVariables,
  });
  
  // 如果有定义输入schema，添加Zod schema
  if (promptTemplate.inputSchema) {
    const schema: Record<string, z.ZodTypeAny> = {};
    
    for (const [key, def] of Object.entries(promptTemplate.inputSchema)) {
      let fieldSchema: z.ZodTypeAny;
      
      // 根据属性类型创建对应的 Zod 类型
      switch (def.type) {
        case 'string':
          fieldSchema = z.string();
          break;
        case 'number':
          fieldSchema = z.number();
          break;
        case 'boolean':
          fieldSchema = z.boolean();
          break;
        case 'array':
          fieldSchema = z.array(z.any());
          break;
        default:
          fieldSchema = z.any();
      }
      
      // 添加描述
      fieldSchema = fieldSchema.describe(def.description);
      
      // 处理可选字段
      if (def.required === false) {
        fieldSchema = fieldSchema.optional();
      }
      
      schema[key] = fieldSchema;
    }
    
    // 添加 schema 属性
    (template as any)._schema = z.object(schema);
  }
  
  return template;
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
    inputSchema: {
      input: {
        type: "string",
        description: "用户的问题或请求",
        required: true
      }
    }
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
    inputSchema: {
      input: {
        type: "string",
        description: "用户的编程问题或代码相关请求",
        required: true
      }
    }
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
    inputSchema: {
      source_language: {
        type: "string",
        description: "源语言，例如：中文、英文、日语等",
        required: true
      },
      target_language: {
        type: "string",
        description: "目标语言，例如：中文、英文、日语等",
        required: true
      },
      input: {
        type: "string",
        description: "需要翻译的文本内容",
        required: true
      }
    }
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
