import { DynamicStructuredToolInput, DynamicTool, DynamicToolInput } from "langchain/tools";
import { Tool } from "langchain/tools";
import { z } from "zod";

/**
 * 工具类型定义
 */
export interface ToolDefinition {
  id: string;
  name: string;  
  description: string;
  func: string; // 存储为字符串形式的函数体
  parameters: {
    type: "object";
    properties: Record<string, {
      type: string;
      description: string;
    }>;
    required: string[];
  };
  createdAt: number;
  updatedAt: number;
  isSystem?: boolean; // 是否是系统工具
  category?: string; // 可选的分类
  toolType?: string; // 工具类型：structured或dynamic
}

/**
 * 将 parameters 对象转换为 Zod 架构
 */
export function parametersToZodSchema(parameters: ToolDefinition['parameters']): z.ZodObject<any> {
  // 创建一个空的 Zod 对象作为起点
  let schema: Record<string, z.ZodTypeAny> = {};
  
  // 遍历所有属性并转换为相应的 Zod 类型
  for (const [key, prop] of Object.entries(parameters.properties)) {
    let fieldSchema: z.ZodTypeAny;
    
    // 根据属性类型创建对应的 Zod 类型
    switch (prop.type) {
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
        // 对于数组，默认使用任意值数组
        fieldSchema = z.array(z.any());
        break;
      default:
        // 默认使用任意类型
        fieldSchema = z.any();
    }
    
    // 添加描述（这是关键，让大模型理解参数的意义）
    fieldSchema = fieldSchema.describe(prop.description);
    
    // 检查是否为必需字段
    if (!parameters.required.includes(key)) {
      fieldSchema = fieldSchema.optional();
    }
    
    schema[key] = fieldSchema;
  }
  
  return z.object(schema);
}

/**
 * 动态创建工具
 */
export function createDynamicTool(toolDef: ToolDefinition): Tool {
  // 用于安全地执行工具函数
  const safeExec = (fnBody: string, args: Record<string, any>) => {
    try {
      // 将函数体字符串转换为实际函数
      const fn = new Function('args', fnBody);
      return fn(args);
    } catch (error) {
      console.error('Tool执行错误:', error);
      return `工具执行失败: ${error instanceof Error ? error.message : '未知错误'}`;
    }
  };

  // 确定是创建结构化工具还是动态工具
  const useStructuredTool = toolDef.toolType === 'structured' || 
                           (toolDef.parameters && Object.keys(toolDef.parameters.properties).length > 0);
  
  if (useStructuredTool) {
    // 使用 Zod schema 创建结构化工具
    const schema = parametersToZodSchema(toolDef.parameters);
    
    // 创建结构化工具配置
    const toolConfig: DynamicStructuredToolInput = {
      name: toolDef.name,
      description: toolDef.description,
      schema: schema,
      func: async (input: Record<string, any>) => {
        try {
          // 直接使用结构化输入
          const result = await Promise.resolve(safeExec(toolDef.func, input));
          return typeof result === 'string' ? result : JSON.stringify(result);
        } catch (error) {
          return `工具执行错误: ${error instanceof Error ? error.message : '未知错误'}`;
        }
      }
    };

    return new DynamicTool(toolConfig);
  } else {
    // 创建简单的动态工具
    const toolConfig: DynamicToolInput = {
      name: toolDef.name,
      description: toolDef.description,
      func: async (inputStr: string) => {
        try {
          // 解析输入字符串
          let input: Record<string, any> = {};
          try {
            // 尝试将输入解析为 JSON
            input = JSON.parse(inputStr);
          } catch (parseError: any) {
            // 如果解析失败，创建一个只包含输入字符串的对象
            if (toolDef.parameters.required.length === 1) {
              // 如果只有一个必需参数，将整个输入作为该参数
              const paramName = toolDef.parameters.required[0];
              input = { [paramName]: inputStr };
            } else {
              // 否则将输入作为通用参数
              input = { input: inputStr };
            }
          }
          
          // 执行函数
          const result = await Promise.resolve(safeExec(toolDef.func, input));
          return typeof result === 'string' ? result : JSON.stringify(result);
        } catch (error) {
          return `工具执行错误: ${error instanceof Error ? error.message : '未知错误'}`;
        }
      }
    };

    return new DynamicTool(toolConfig);
  }
}

/**
 * 默认工具集
 */
export const DEFAULT_TOOLS: ToolDefinition[] = [
  {
    id: "calculator",
    name: "calculator",
    description: "用于执行数学计算的工具，如加减乘除、平方根等",
    func: `
      const { expression } = args;
      try {
        // 仅允许安全的数学表达式
        if (/[^0-9+\\-*/().\\s]/.test(expression)) {
          return "表达式包含不安全的字符";
        }
        // 使用Function进行计算
        return eval(expression).toString();
      } catch (error) {
        return "计算错误: " + error.message;
      }
    `,
    parameters: {
      type: "object",
      properties: {
        expression: {
          type: "string",
          description: "要计算的数学表达式，例如 '2 + 2' 或 '(3 * 4) / 2'"
        }
      },
      required: ["expression"]
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isSystem: true,
    toolType: "structured"
  },
  {
    id: "current_time",
    name: "current_time",
    description: "获取当前的日期和时间",
    func: `
      const now = new Date();
      return now.toLocaleString('zh-CN');
    `,
    parameters: {
      type: "object",
      properties: {},
      required: []
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isSystem: true,
    toolType: "dynamic"
  }
];
