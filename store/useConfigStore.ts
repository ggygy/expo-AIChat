import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ModelProvider, MODEL_PROVIDERS } from '@/constants/ModelProviders';

export interface ProviderConfig {
  id: string;
  apiKey: string;
  baseUrl: string;
  isActive: boolean;
  enabledModels: string[];
  customModels: Array<{
    id: string;
    name: string;
  }>;
}

interface ConfigStore {
  providers: ProviderConfig[];
  activeProviderId: string | null;
  addProvider: (provider: Omit<ProviderConfig, 'enabledModels' | 'customModels'>) => void;
  updateProvider: (id: string, updates: Partial<ProviderConfig>) => void;
  deleteProvider: (id: string) => void;
  setActiveProvider: (id: string) => void;
  toggleModel: (providerId: string, modelId: string) => void;
  addCustomModel: (providerId: string, model: { id: string; name: string }) => void;
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
      setActiveProvider: (id) => set((state) => ({
        providers: state.providers.map(provider => ({
          ...provider,
          isActive: provider.id === id
        })),
        activeProviderId: id
      })),
      toggleModel: (providerId, modelId) => set((state) => ({
        providers: state.providers.map(provider => {
          if (provider.id !== providerId) return provider;
          const enabledModels = provider.enabledModels.includes(modelId)
            ? provider.enabledModels.filter(id => id !== modelId)
            : [...provider.enabledModels, modelId];
          return { ...provider, enabledModels };
        })
      })),
      addCustomModel: (providerId, model) => set((state) => ({
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
