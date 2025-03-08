import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MODEL_PROVIDERS, ModelInfo } from '@/constants/ModelProviders';

export interface ProviderConfig {
  id: string;
  apiKey: string;
  baseUrl: string;
  isActive: boolean;
  enabledModels: string[];
  availableModels: ModelInfo[];
  customModels: ModelInfo[];
}

interface ConfigStore {
  providers: ProviderConfig[];
  activeProviderId: string[];
  addProvider: (provider: Omit<ProviderConfig, 'baseUrl' | 'enabledModels' | 'availableModels' | 'customModels'>) => void;
  updateProvider: (id: string, updates: Partial<ProviderConfig>) => void;
  deleteProvider: (id: string) => void;
  setActiveProvider: (id: string) => void;
  toggleModel: (providerId: string, modelId: string) => void;
  addCustomModel: (providerId: string, model: ModelInfo) => void;
  deleteCustomModel: (providerId: string, modelId: string) => void;
  refreshProviders: () => void;
  getActiveProvider: () => ProviderConfig | undefined;
}

export const useProviderStore = create<ConfigStore>()(
  persist(
    (set, get) => ({
      providers: [],
      activeProviderId: [],  // 初始化为空数组
      addProvider: (provider) => set((state) => ({
        providers: [
          ...state.providers,
          { 
            ...provider,
            baseUrl: MODEL_PROVIDERS.find(p => p.id === provider.id)?.baseUrl || '',
            enabledModels: [],
            availableModels: MODEL_PROVIDERS.find(p => p.id === provider.id)?.availableModels || [],
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
        activeProviderId: state.activeProviderId.filter(pid => pid !== id)
      })),
      setActiveProvider: (id) => set((state) => {
        const provider = state.providers.find(p => p.id === id);
        if (!provider) return state;

        const isInActiveIds = state.activeProviderId.includes(id);
        const newIsActive = !isInActiveIds;

        return {
          providers: state.providers.map(p => ({
            ...p,
            isActive: p.id === id ? newIsActive : p.isActive
          })),
          activeProviderId: newIsActive
            ? [...state.activeProviderId, id]
            : state.activeProviderId.filter(pid => pid !== id)
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
      refreshProviders: () => {
        const currentState = get();
        set({
          providers: [...currentState.providers],
          activeProviderId: currentState.activeProviderId
        });
      },
      getActiveProvider: () => {
        return get().providers.find(p => p.isActive);
      }
    }),
    {
      name: 'config-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.refreshProviders();
        }
      },
    }
  )
);
