import { BaseProvider, ModelConfig } from "./BaseProvider";
import { ChatAlibabaTongyi } from "@langchain/community/chat_models/alibaba_tongyi";
import { SystemMessage } from '@langchain/core/messages';
import { langchainFetchOptions } from '@/utils/langchainFetchAdapter';

export class AlibabaTongyiProvider extends BaseProvider {
  initialize(config: ModelConfig): void {
    // 保存maxTokens
    this.maxTokens = config.maxTokens;
    
    const modelOptions: any = {
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens,
      modelName: config.modelName,
      topP: config.topP ?? 1,
      streaming: config.streamOutput,
      alibabaApiKey: config.apiKey,
      configuration: {
        ...langchainFetchOptions
      }
    };

    if (config.maxTokens !== undefined) {
      modelOptions.maxTokens = config.maxTokens;
      console.log(`Alibaba Tongyi Provider 设置最大令牌数: ${config.maxTokens}`);
    }

    // 创建 ChatAlibabaTongyi 实例
    let model = new ChatAlibabaTongyi(modelOptions);
    this.model = model;

    // 使用bindTools方法绑定工具
    if (config.tools && config.tools.length > 0) {
      try {
        this.llmWithTools = model.bindTools?.(config.tools);
        this.tools = config.tools;
        this.hasToolsCapability = model.bindTools ? true : false;
        console.log(`Alibaba Tongyi Provider 工具绑定完成`);
      } catch (error) {
        console.error("绑定工具失败:", error);
        this.hasToolsCapability = false;
      }
    }

    if (config.systemPrompt) {
      this.systemMessage = new SystemMessage({ content: config.systemPrompt });
    }
  }
}
