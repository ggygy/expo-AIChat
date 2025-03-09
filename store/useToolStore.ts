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
}

export const useToolStore = create<ToolStore>()(
  persist(
    (set, get) => ({
      tools: [...DEFAULT_TOOLS],
      addTool: (tool) => set((state) => ({
        tools: [
          ...state.tools,
          {
            ...tool,
            id: `tool_${Date.now()}`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }
        ]
      })),
      updateTool: (id, updates) => set((state) => ({
        tools: state.tools.map(tool => 
          tool.id === id ? { ...tool, ...updates, updatedAt: Date.now() } : tool
        )
      })),
      deleteTool: (id) => set((state) => ({
        tools: state.tools.filter(tool => tool.id !== id || tool.isSystem)
      })),
      getToolById: (id) => {
        return get().tools.find(tool => tool.id === id);
      },
    }),
    {
      name: 'tools-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
