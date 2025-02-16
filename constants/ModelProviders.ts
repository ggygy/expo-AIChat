import { ModelType } from './ModelTypes';

export enum ModelProviderId {
  OpenAI = 'openai',
  Anthropic = 'anthropic',
  DeepSeek = 'deepseek',
}

export interface ModelInfo {
  id: string;
  name: string;
  types: ModelType[];  // enabled 属性应该从接口中移除，它只是初始状态
}

export interface ModelProvider {
  id: string;
  name: string;
  baseUrl?: string;
  apiKeyUrl?: string;
  availableModels: ModelInfo[];
}

export const MODEL_PROVIDERS: ModelProvider[] = [
  {
    id: ModelProviderId.OpenAI,
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    apiKeyUrl: 'https://platform.openai.com/api-keys',
    availableModels: [
      { 
        id: 'gpt-3.5-turbo', 
        name: 'GPT-3.5 Turbo',
        types: ['chat', 'inference']
      },
      { 
        id: 'gpt-4', 
        name: 'GPT-4', 
        types: ['chat', 'inference']
      },
      { 
        id: 'gpt-4-turbo', 
        name: 'GPT-4 Turbo', 
        types: ['chat']
      },
      { 
        id: 'dall-e-3', 
        name: 'DALL·E 3', 
        types: ['image']
      },
      { 
        id: 'text-embedding-ada-002', 
        name: 'Ada Embedding', 
        types: ['embedding']
      },
    ],
  },
  {
    id: ModelProviderId.Anthropic,
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    apiKeyUrl: 'https://console.anthropic.com/account/keys',
    availableModels: [
      { id: 'claude-2', name: 'Claude 2', types: ['chat'] },
      { id: 'claude-instant', name: 'Claude Instant', types: ['chat'] },
    ],
  },
];
