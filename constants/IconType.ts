import { ModelProviderId } from './ModelProviders';

export const glyphMap = {
    'baiduyun': 0xe644,
    'aliyun': 0xe66e,
    'ai': 0xee23,
    'zhipuAI': 0xe6a5,
    'yemian1': 0xe60a,
    'kimi': 0xe767,
    'ollama': 0xe675,
    'siliconflow': 0xe600,
    'deepseek': 0xe601,
    'openai-fill': 0xeac8
};

export type IconNames = keyof typeof glyphMap;

export interface IconConfig {
  name: string;
  size: number;
  defaultColor?: string;
}

export const PROVIDER_ICONS: Record<ModelProviderId, IconConfig> = {
  [ModelProviderId.OpenAI]: {
    name: 'openai-fill',
    size: 36,
  },
  [ModelProviderId.DeepSeek]: {
    name: 'deepseek',
    size: 36,
    defaultColor: '#1296db',
  },
  [ModelProviderId.SiliconFlow]: {
    name: 'siliconflow',
    size: 36,
    defaultColor: '#8449e8', 
  }
};

export const getProviderIcon = (
  providerId: ModelProviderId, 
  overrides?: Partial<IconConfig>
): IconConfig => {
  const defaultConfig = PROVIDER_ICONS[providerId] || {
    name: 'robot-fill',
    size: 32,
    defaultColor: '#666666'
  };

  return {
    ...defaultConfig,
    ...overrides
  };
};
