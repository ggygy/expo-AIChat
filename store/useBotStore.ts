import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MODEL_PROVIDERS } from '@/constants/ModelProviders';
import { useProviderStore } from './useProviderStore';

export interface BotConfig {
  id: string;
  name: string;
  avatar?: string;
  providerId: string;
  modelId: string;
  temperature: number;
  topP: number;
  maxContextLength: number;
  enableMaxTokens: boolean;
  maxTokens?: number;
  streamOutput: boolean;
  chainOfThought: number;
  systemPrompt?: string;
  createdAt: number;
  description?: string;
  lastMessageAt?: number;
  messagesCount?: number;
}

interface BotStore {
  bots: BotConfig[];
  addBot: (bot: Omit<BotConfig, 'id' | 'createdAt'>) => void;
  updateBot: (id: string, updates: Partial<BotConfig>) => void;
  deleteBot: (id: string) => void;
  getBotInfo: (id: string) => BotConfig | null;
  updateBotStats: (id: string, stats: Partial<Pick<BotConfig, 'lastMessageAt' | 'messagesCount'>>) => void;
  getAvailableBots: () => BotConfig[];
  sortBots: (sortBy: 'name' | 'createdAt' | 'lastMessageAt') => void;
}

export const useBotStore = create<BotStore>()(
  persist(
    (set, get) => ({
      bots: [],
      addBot: (bot) => set((state) => ({
        bots: [
          ...state.bots,
          {
            ...bot,
            id: Math.random().toString(36).substring(7),
            createdAt: Date.now(),
            temperature: bot.temperature ?? 0.7,
            topP: bot.topP ?? 1,
            maxContextLength: bot.maxContextLength ?? 4,
            enableMaxTokens: bot.enableMaxTokens ?? false,
            maxTokens: bot.maxTokens,
            streamOutput: bot.streamOutput ?? true,
            chainOfThought: bot.chainOfThought ?? 0,
          }
        ]
      })),
      updateBot: (id, updates) => set((state) => ({
        bots: state.bots.map(bot => 
          bot.id === id ? { ...bot, ...updates } : bot
        )
      })),
      deleteBot: (id) => set((state) => ({
        bots: state.bots.filter(bot => bot.id !== id)
      })),
      getBotInfo: (id) => {
        return get().bots.find(bot => bot.id === id) || null;
      },
      updateBotStats: (id, stats) => set((state) => ({
        bots: state.bots.map(bot => 
          bot.id === id ? { ...bot, ...stats } : bot
        )
      })),
      getAvailableBots: () => {
        const providers = useProviderStore.getState().providers;
        return get().bots.filter(bot => {
          const provider = providers.find(p => p.id === bot.providerId);
          return provider?.isActive && provider.enabledModels.includes(bot.modelId);
        });
      },
      sortBots: (sortBy) => set((state) => ({
        bots: [...state.bots].sort((a, b) => {
          switch (sortBy) {
            case 'name':
              return a.name.localeCompare(b.name);
            case 'lastMessageAt':
              return (b.lastMessageAt || 0) - (a.lastMessageAt || 0);
            case 'createdAt':
              return b.createdAt - a.createdAt;
            default:
              return 0;
          }
        })
      })),
    }),
    {
      name: 'bot-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
