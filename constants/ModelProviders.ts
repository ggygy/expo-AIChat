export interface ModelProvider {
  id: string;
  name: string;
  baseUrl: string;
  availableModels: {
    id: string;
    name: string;
    enabled: boolean;
  }[];
}

export const MODEL_PROVIDERS: ModelProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    availableModels: [
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', enabled: true },
      { id: 'gpt-4', name: 'GPT-4', enabled: true },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', enabled: true },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    availableModels: [
      { id: 'claude-2', name: 'Claude 2', enabled: true },
      { id: 'claude-instant', name: 'Claude Instant', enabled: true },
    ],
  },
];
