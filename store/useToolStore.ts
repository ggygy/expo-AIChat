import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_TOOLS, ToolDefinition } from '@/langchain/tools';

interface ToolStore {
  tools: ToolDefinition[];
  addTool: (tool: Omit<ToolDefinition, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTool: (id: string, updates: Partial<ToolDefinition>) => void;
  deleteTool: (id: string) => void;
  getToolById: (id: string) => ToolDefinition | undefined;
  validateToolFunc: (func: string) => { valid: boolean, error?: string };
}

// 验证工具函数字符串是否符合预期格式
const validateFunctionString = (funcStr: string): { valid: boolean, error?: string } => {
  try {
    // 检查函数结构是箭头函数，并且使用了解构参数
    if (!funcStr.includes('=>')) {
      return { 
        valid: false, 
        error: '函数必须是箭头函数，例如: ({ param1, param2 }) => { ... }' 
      };
    }

    // 尝试创建函数来验证语法
    new Function('input', `
      try {
        const result = (async (${funcStr}))(input);
        return result;
      } catch (error) {
        throw error;
      }
    `);
    
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: `函数语法错误: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
};

export const useToolStore = create<ToolStore>()(
  persist(
    (set, get) => ({
      tools: [...DEFAULT_TOOLS],
      
      // 添加工具前验证函数
      addTool: (tool) => {
        const validationResult = validateFunctionString(tool.func);
        if (!validationResult.valid) {
          console.error('工具函数无效:', validationResult.error);
          throw new Error(validationResult.error);
        }
        
        set((state) => ({
          tools: [
            ...state.tools,
            {
              ...tool,
              id: `tool_${Date.now()}`,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            }
          ]
        }));
      },
      
      // 更新工具前验证函数
      updateTool: (id, updates) => {
        if (updates.func) {
          const validationResult = validateFunctionString(updates.func);
          if (!validationResult.valid) {
            console.error('更新的工具函数无效:', validationResult.error);
            throw new Error(validationResult.error);
          }
        }
        
        set((state) => ({
          tools: state.tools.map(tool => 
            tool.id === id ? { ...tool, ...updates, updatedAt: Date.now() } : tool
          )
        }));
      },
      
      deleteTool: (id) => set((state) => ({
        tools: state.tools.filter(tool => tool.id !== id || tool.isSystem)
      })),
      
      getToolById: (id) => {
        return get().tools.find(tool => tool.id === id);
      },
      
      validateToolFunc: validateFunctionString
    }),
    {
      name: 'tools-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
