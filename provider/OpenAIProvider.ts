import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { BaseProvider, ModelConfig } from "./BaseProvider";
import { ChatOpenAI } from '@langchain/openai';
import { SystemMessage } from '@langchain/core/messages';
import { langchainFetchOptions } from "@/utils/langchainFetchAdapter";
import { ModelInfo } from "@/constants/ModelProviders";

export class OpenAIProvider extends BaseProvider {
  initialize(config: ModelConfig): void {
    this.model = new ChatOpenAI({
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      modelName: config.modelName,
      topP: config.topP,
      streaming: config.streamOutput,
      apiKey: config.apiKey,
      configuration: {
        ...langchainFetchOptions,
        baseURL: config.baseUrl
      }
    });

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
  {
    id: 'o1-mini',
    name: 'GPT o1 Mini',
    types: ['chat']
  }
]