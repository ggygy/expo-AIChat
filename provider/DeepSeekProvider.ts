import { BaseProvider, ModelConfig } from "./BaseProvider";
import { ChatDeepSeek } from '@langchain/deepseek';

export class DeepSeekProvider extends BaseProvider {
  initialize(config: ModelConfig): void {
    this.model = new ChatDeepSeek({
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens,
      modelName: config.modelName,
      apiKey: config.apiKey,
      configuration: {
        baseURL: config.baseUrl,
      }
    });
  }
}