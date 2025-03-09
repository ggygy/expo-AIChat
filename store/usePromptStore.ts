import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_TEMPLATES, PromptTemplateType } from '@/langchain/prompt';

interface PromptStore {
  templates: PromptTemplateType[];
  addTemplate: (template: Omit<PromptTemplateType, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTemplate: (id: string, updates: Partial<PromptTemplateType>) => void;
  deleteTemplate: (id: string) => void;
  getTemplateById: (id: string) => PromptTemplateType | undefined;
}

export const usePromptStore = create<PromptStore>()(
  persist(
    (set, get) => ({
      templates: [...DEFAULT_TEMPLATES],
      addTemplate: (template) => set((state) => ({
        templates: [
          ...state.templates,
          {
            ...template,
            id: `template_${Date.now()}`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }
        ]
      })),
      updateTemplate: (id, updates) => set((state) => ({
        templates: state.templates.map(template => 
          template.id === id ? { ...template, ...updates, updatedAt: Date.now() } : template
        )
      })),
      deleteTemplate: (id) => set((state) => ({
        templates: state.templates.filter(template => template.id !== id || template.isSystem)
      })),
      getTemplateById: (id) => {
        return get().templates.find(template => template.id === id);
      },
    }),
    {
      name: 'prompt-templates-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
