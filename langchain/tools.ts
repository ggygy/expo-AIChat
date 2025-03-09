import { DynamicTool } from "langchain/tools";
import { Tool } from "langchain/tools";

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

  // 修改这里，使用正确的属性将参数传递给DynamicTool
  return new DynamicTool({
    name: toolDef.name,
    description: toolDef.description,
    // 不再使用 schema 属性
    // schema: toolDef.parameters,
    
    // 直接使用函数，不定义模式
    func: async (input: string) => {
      try {
        // 解析输入字符串为参数对象
        let args: Record<string, any> = {};
        try {
          // 尝试将输入解析为 JSON
          args = JSON.parse(input);
        } catch (parseError) {
          // 如果解析失败，将整个输入作为单个参数
          args = { input };
        }
        
        // 执行函数
        const result = await Promise.resolve(safeExec(toolDef.func, args));
        return typeof result === 'string' ? result : JSON.stringify(result);
      } catch (error) {
        return `工具执行错误: ${error instanceof Error ? error.message : '未知错误'}`;
      }
    }
  });
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
    isSystem: true
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
    isSystem: true
  }
];
