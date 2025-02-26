import { BaseProvider, ModelConfig } from "./BaseProvider";
import { ChatDeepSeek } from '@langchain/deepseek';
import { SystemMessage } from '@langchain/core/messages';

export class DeepSeekProvider extends BaseProvider {
  initialize(config: ModelConfig): void {
    this.model = new ChatDeepSeek({
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      modelName: config.modelName,
      topP: config.topP,
      streaming: config.streamOutput,
      apiKey: config.apiKey,
      configuration: {
        baseURL: config.baseUrl,
      }
    });

    if (config.systemPrompt) {
      this.systemMessage = new SystemMessage({ content: config.systemPrompt });
    }
  }
}