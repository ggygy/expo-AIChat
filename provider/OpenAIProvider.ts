import { BaseMessage, SystemMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { BaseProvider, ModelConfig } from './BaseProvider';
import { IterableReadableStream } from '@langchain/core/dist/utils/stream';
import { langchainFetchOptions } from '@/utils/langchainFetchAdapter';
import { ModelInfo } from "@/constants/ModelProviders";

export class OpenAIProvider extends BaseProvider {
  initialize(config: ModelConfig): void {
    // 保存maxTokens
    this.maxTokens = config.maxTokens;
    
    const modelOptions: any = {
      modelName: config.modelName,
      openAIApiKey: config.apiKey,
      temperature: config.temperature ?? 0.7,
      topP: config.topP ?? 1,
      configuration: {
        ...langchainFetchOptions,
        baseURL: config.baseUrl || 'https://api.openai.com/v1'
      }
    };
    
    if (config.maxTokens !== undefined) {
      modelOptions.maxTokens = config.maxTokens;
    }

    this.model = new ChatOpenAI(modelOptions);

    // 如果有系统提示，创建系统消息
    if (config.systemPrompt) {
      this.systemMessage = new SystemMessage({ content: config.systemPrompt });
    }
  }
}

export const OpenAIModels: ModelInfo[] = [
  { 
    id: 'gpt-3.5-turbo', 
    name: 'GPT-3.5 Turbo',
    types: ['chat']
  },
  { 
    id: 'gpt-4', 
    name: 'GPT 4',
    types: ['chat']
  },
  {
    id: 'gpt-4o-mini', 
    name: 'GPT 4o Mini',
    types: ['chat']
  },
  { 
    id: 'o1-preview', 
    name: 'GPT o1 Preview',
    types: ['chat']
  },
  {
    id: 'o1-mini',
    name: 'GPT o1 Mini',
    types: ['chat']
  },
]