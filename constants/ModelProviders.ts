import { ModelType } from './ModelTypes';

export enum ModelProviderId {
  OpenAI = 'openai',
  DeepSeek = 'deepseek',
}

export interface ModelInfo {
  id: string;
  name: string;
  types: ModelType[];
}

export interface ModelProvider {
  id: ModelProviderId;
  name: string;
  icon: string;
  baseUrl: string;
  apiKeyUrl?: string;
  availableModels: ModelInfo[];
}

export const MODEL_PROVIDERS: ModelProvider[] = [
  {
    id: ModelProviderId.OpenAI,
    name: 'OpenAI',
    icon: 'OpenAI',
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
      }
    ],
  },
  {
    id: ModelProviderId.DeepSeek,
    name: 'DeepSeek',
    icon: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    apiKeyUrl: 'https://platform.deepseek.com/api_keys',
    availableModels: [
      { id: 'deepseek-chat', name: 'deepseek V3', types: ['chat'] },
      { id: 'deepseek-reasoner', name: 'deepseek R1', types: ['chat', 'inference'] },
    ],
  },
];
