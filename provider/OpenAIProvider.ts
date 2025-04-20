import { SystemMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { BaseProvider, ModelConfig } from './BaseProvider';
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
      console.log(`OpenAI Provider 设置最大令牌数: ${config.maxTokens}`);
    }

    // 创建 ChatOpenAI 实例
    let model = new ChatOpenAI(modelOptions);
    this.model = model;

    // 使用bindTools方法绑定工具
    if (config.tools && config.tools.length > 0) {
      try {
        // 直接使用模型的bindTools方法，简化工具绑定过程
        this.llmWithTools = model.bindTools(config.tools);
        this.tools = config.tools;
        this.hasToolsCapability = true;
        console.log(`OpenAI Provider 工具绑定完成`);
      } catch (error) {
        console.error("绑定工具失败:", error);
        this.hasToolsCapability = false;
      }
    }

    // 如果有系统提示，创建系统消息
    if (config.systemPrompt) {
      this.systemMessage = new SystemMessage({ content: config.systemPrompt });
    }
  }
}

export const OpenAIModels: ModelInfo[] = [
  { id: 'gpt-4o', name: 'GPT-4o', types: ['chat', 'inference', 'tool'], supportTools: true },
  { id: 'gpt-4o-mini', name: 'GPT-4o mini', types: ['chat', 'tool'], supportTools: true },
  { id: 'gpt-4-turbo', name: 'GPT-4-turbo', types: ['chat', 'inference', 'tool'], supportTools: true },
  { id: 'gpt-4-1106-preview', name: 'GPT-4-turbo (preview)', types: ['chat'], supportTools: true },
  { id: 'gpt-4-vision-preview', name: 'GPT-4-vision-preview', types: ['multimodal'], supportTools: false },
  { id: 'gpt-4', name: 'GPT-4', types: ['chat'], supportTools: false },
  { id: 'gpt-4-0314', name: 'GPT-4 (0314)', types: ['chat'], supportTools: false },
  { id: 'gpt-4-0613', name: 'GPT-4 (0613)', types: ['chat'], supportTools: false },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5-turbo', types: ['chat'], supportTools: true },
  { id: 'gpt-3.5-turbo-16k', name: 'GPT-3.5-turbo-16k', types: ['chat'], supportTools: true },
];