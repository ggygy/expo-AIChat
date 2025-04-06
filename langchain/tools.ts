import { DynamicStructuredTool, DynamicTool, Tool, ToolInterface } from "@langchain/core/tools";
import { z } from "zod";

/**
 * 工具类型定义
 */
export interface ToolDefinition {
  id: string;
  name: string;
  schema: z.ZodTypeAny; // 使用Zod类型定义工具的参数
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
  responseFormat?: "text" | "content"; // 响应格式
}

/**
 * 将 parameters 对象转换为 Zod 架构
 */
export function parametersToZodSchema(parameters: ToolDefinition['parameters']): z.ZodObject<any> {
  let schema: Record<string, z.ZodTypeAny> = {};
  
  for (const [key, prop] of Object.entries(parameters.properties)) {
    let fieldSchema: z.ZodTypeAny;
    
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
        fieldSchema = z.array(z.any());
        break;
      default:
        fieldSchema = z.any();
    }
    
    fieldSchema = fieldSchema.describe(prop.description);
    
    if (!parameters.required.includes(key)) {
      fieldSchema = fieldSchema.optional();
    }
    
    schema[key] = fieldSchema;
  }
  
  return z.object(schema);
}

/**
 * 动态创建工具
 * 返回类型修改为ToolInterface，这是一个更通用的工具接口类型
 */
export function createDynamicTool(toolDef: ToolDefinition): ToolInterface {
  const useStructuredTool = toolDef.toolType === 'structured' || 
                           (toolDef.parameters && Object.keys(toolDef.parameters.properties).length > 0);
  
  if (useStructuredTool) {
    const schema = parametersToZodSchema(toolDef.parameters);
    const paramNames = Object.keys(toolDef.parameters.properties);

    // 使用 Function 构造函数创建函数
    const func = new Function(...paramNames, toolDef.func);
    
    const structuredTool = new DynamicStructuredTool({
      name: toolDef.name,
      description: toolDef.description,
      schema: schema,
      func: async (input) => {
        // 将输入对象转换为参数数组
        const args = paramNames.map(name => input[name]);
        return await func(...args);
      }
    });
    return structuredTool as ToolInterface;
  } else {
    const func = new Function('args', toolDef.func);
    
    const dynamicTool = new DynamicTool({
      name: toolDef.name,
      description: toolDef.description,
      func: async (input) => {
        return await func(input);
      }
    });
    return dynamicTool as ToolInterface;
  }
}

/**
 * 从用户输入的字符串创建工具定义
 * @param id 工具ID
 * @param name 工具名称
 * @param description 工具描述
 * @param functionBodyString 函数体字符串
 * @param parameters 参数定义
 * @param options 额外选项
 */
export function createToolDefinitionFromInput(
  id: string,
  name: string, 
  description: string, 
  functionBodyString: string,
  parameters: ToolDefinition['parameters'],
  options?: {
    isSystem?: boolean;
    category?: string;
    toolType?: string;
    responseFormat?: "text" | "content";
  }
): ToolDefinition {
  return {
    id,
    name,
    schema: z.object({}),
    description,
    func: functionBodyString,
    parameters,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isSystem: options?.isSystem || false,
    category: options?.category,
    toolType: options?.toolType || "structured",
    responseFormat: options?.responseFormat || "content"
  };
}

/**
 * 从完整的JSON字符串创建工具
 * @param jsonString 包含工具定义的JSON字符串
 */
export function createToolFromJsonString(jsonString: string): ToolInterface | null {
  try {
    // 解析用户输入
    const toolDefinition = JSON.parse(jsonString) as ToolDefinition;
    
    // 验证必要字段
    if (!toolDefinition.id || !toolDefinition.name || !toolDefinition.description || !toolDefinition.func) {
      console.error("工具定义缺少必要字段");
      return null;
    }
    
    // 确保参数字段存在
    if (!toolDefinition.parameters) {
      toolDefinition.parameters = {
        type: "object",
        properties: {},
        required: []
      };
    }
    
    // 设置默认值
    toolDefinition.createdAt = toolDefinition.createdAt || Date.now();
    toolDefinition.updatedAt = Date.now();
    
    // 创建工具
    return createDynamicTool(toolDefinition);
  } catch (error) {
    console.error("从JSON创建工具失败:", error);
    return null;
  }
}

/**
 * 测试工具函数的执行是否有效
 * @param functionBody 函数体字符串
 * @param testArgs 测试参数
 */
export function testToolFunction(functionBody: string, testArgs: Record<string, any> = {}): { success: boolean; result?: any; error?: string } {
  try {
    // 创建测试函数
    const fn = new Function('args', functionBody);
    // 执行函数并获取结果
    const result = fn(testArgs);
    return { 
      success: true, 
      result 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

/**
 * 生成工具函数模板
 * @param parameters 参数定义
 * @param responseFormat 响应格式
 */
export function generateToolFunctionTemplate(
  parameters: ToolDefinition['parameters'], 
  responseFormat: "text" | "content" = "text"
): string {
  const paramNames = Object.keys(parameters.properties);
  const paramExtraction = paramNames.length > 0 
    ? `const { ${paramNames.join(', ')} } = args;` 
    : '// 无需从args中提取参数';
  
  if (responseFormat === "content") {
    return `
  ${paramExtraction}
  try {
    // 这里是工具函数的实现逻辑
    const result = "计算结果..."; // 替换为实际计算
    const artifact = { data: "这里是数据对象" }; // 替换为实际数据对象
    
    // 返回内容和工件的元组
    return [
      \`操作成功: \${result}\`, // 文本描述结果
      artifact // 结构化数据
    ];
  } catch (error) {
    // 出错时返回错误信息
    return ["操作失败: " + (error instanceof Error ? error.message : String(error)), null];
  }
`;
  } else {
    return `
  ${paramExtraction}
  try {
    // 这里是工具函数的实现逻辑
    const result = "计算结果..."; // 替换为实际计算
    
    // 返回结果字符串
    return \`操作成功: \${result}\`;
  } catch (error) {
    // 出错时返回错误信息
    return "操作失败: " + (error instanceof Error ? error.message : String(error));
  }
`;
  }
}

/**
 * 默认工具集
 */
export const DEFAULT_TOOLS: ToolDefinition[] = [
  {
    id: "calculator",
    name: "calculator",
    schema: z.object({
      operation: z
        .enum(["add", "subtract", "multiply", "divide"])
        .describe("The type of operation to execute."),
      number1: z.number().describe("The first number to operate on."),
      number2: z.number().describe("The second number to operate on."),
    }),
    description: "用于执行数学计算的工具，如加减乘除、平方根等",
    func: `try {
        switch(operation) {
          case "add":
            return (number1 + number2).toString();
          case "subtract":
            return (number1 - number2).toString();
          case "multiply":
            return (number1 * number2).toString();
          case "divide":
            if (number2 === 0) {
              return "错误：除数不能为零";
            }
            return (number1 / number2).toString();
          default:
            return "错误：不支持的操作";
        }
      } catch (error) {
        return "计算错误: " + (error instanceof Error ? error.message : String(error));
      }`,
    parameters: {
      type: "object",
      properties: {
        operation: {
          type: "string",
          description: "The type of operation to execute."
        },
        number1: {
          type: "number",
          description: "The first number to operate on."
        },
        number2: {
          type: "number",
          description: "The second number to operate on."
        }
      },
      required: ["operation", "number1", "number2"]
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isSystem: true,
    toolType: "structured"
  },
  {
    id: "current_time",
    name: "current_time",
    schema: z.object({
      timezone: z.string().optional().describe("Optional timezone for the time format")
    }),
    description: "获取当前的日期和时间",
    func: `const now = new Date();
      try {
        if (timezone) {
          return now.toLocaleString('zh-CN', { timeZone: timezone });
        }
        return now.toLocaleString('zh-CN');
      } catch (error) {
        return "获取时间错误: " + (error instanceof Error ? error.message : String(error));
      }`,
    parameters: {
      type: "object",
      properties: {
        timezone: {
          type: "string",
          description: "Optional timezone for the time format"
        }
      },
      required: []
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isSystem: true,
    toolType: "dynamic"
  },
  {
    id: "random_numbers",
    name: "random_numbers",
    schema: z.object({
      min: z.number().describe("The minimum value for random numbers"),
      max: z.number().describe("The maximum value for random numbers"),
      size: z.number().describe("The number of random numbers to generate")
    }),
    description: "生成指定范围和数量的随机数",
    func: `
      try {
        const array = [];
        for (let i = 0; i < size; i++) {
          array.push(Math.floor(Math.random() * (max - min + 1)) + min);
        }
        return [\`成功生成 \${size} 个范围在 [\${min}, \${max}] 的随机数\`, array];
      } catch (error) {
        return ["生成随机数失败", null];
      }`,
    parameters: {
      type: "object",
      properties: {
        min: {
          type: "number",
          description: "The minimum value for random numbers"
        },
        max: {
          type: "number",
          description: "The maximum value for random numbers"
        },
        size: {
          type: "number",
          description: "The number of random numbers to generate"
        }
      },
      required: ["min", "max", "size"]
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isSystem: true,
    toolType: "structured",
    responseFormat: "content"
  }
];
