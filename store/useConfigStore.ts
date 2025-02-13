import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MODEL_PROVIDERS, ModelInfo } from '@/constants/ModelProviders';

export interface ProviderConfig {
  id: string;
  apiKey: string;
  baseUrl: string;
  isActive: boolean;
  enabledModels: string[];  // 使用单独的数组来追踪启用状态
  customModels: ModelInfo[];  // 直接使用 ModelInfo 接口
}

interface ConfigStore {
  providers: ProviderConfig[];
  activeProviderId: string | null;  // 改回 activeProviderId
  addProvider: (provider: Omit<ProviderConfig, 'enabledModels' | 'customModels'>) => void;
  updateProvider: (id: string, updates: Partial<ProviderConfig>) => void;
  deleteProvider: (id: string) => void;
  setActiveProvider: (id: string) => void;
  toggleModel: (providerId: string, modelId: string) => void;
  addCustomModel: (providerId: string, model: ModelInfo) => void;
  deleteCustomModel: (providerId: string, modelId: string) => void;
}

export const useConfigStore = create<ConfigStore>()(
  persist(
    (set) => ({
      providers: [],
      activeProviderId: null,
      addProvider: (provider) => set((state) => ({
        providers: [
          ...state.providers,
          { 
            ...provider,
            baseUrl: MODEL_PROVIDERS.find(p => p.id === provider.id)?.baseUrl || '',
            enabledModels: [],
            customModels: []
          }
        ]
      })),
      updateProvider: (id, updates) => set((state) => ({
        providers: state.providers.map(provider => 
          provider.id === id ? { ...provider, ...updates } : provider
        )
      })),
      deleteProvider: (id) => set((state) => ({
        providers: state.providers.filter(provider => provider.id !== id),
        activeProviderId: state.activeProviderId === id ? null : state.activeProviderId
      })),
      setActiveProvider: (id) => set((state) => {
        const provider = state.providers.find(p => p.id === id);
        if (!provider) return state;

        const newIsActive = !provider.isActive;
        return {
          providers: state.providers.map(p => ({
            ...p,
            isActive: p.id === id ? newIsActive : p.isActive
          })),
          activeProviderId: provider.id === state.activeProviderId && !newIsActive 
            ? null 
            : (newIsActive ? id : state.activeProviderId)
        };
      }),
      toggleModel: (providerId, modelId) => set((state) => ({
        providers: state.providers.map(provider => {
          if (provider.id !== providerId) return provider;
          const enabledModels = provider.enabledModels.includes(modelId)
            ? provider.enabledModels.filter(id => id !== modelId)
            : [...provider.enabledModels, modelId];
          return { ...provider, enabledModels };
        })
      })),
      addCustomModel: (providerId, model: ModelInfo) => set((state) => ({
        providers: state.providers.map(provider => 
          provider.id === providerId
            ? {
                ...provider,
                customModels: [...provider.customModels, model],
                enabledModels: [...provider.enabledModels, model.id]
              }
            : provider
        )
      })),
      deleteCustomModel: (providerId, modelId) => set((state) => ({
        providers: state.providers.map(provider => 
          provider.id === providerId
            ? {
                ...provider,
                customModels: provider.customModels.filter(m => m.id !== modelId),
                enabledModels: provider.enabledModels.filter(id => id !== modelId)
              }
            : provider
        )
      })),
    }),
    {
      name: 'config-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export const getCurrentProvider = (state: ConfigStore) => {
  const activeProvider = state.providers.find(p => p.id === state.activeProviderId);
  if (activeProvider?.isActive) return activeProvider;
  
  return state.providers.find(p => p.isActive) || null;
};
