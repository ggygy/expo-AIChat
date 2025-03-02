import { BaseProvider, ModelConfig } from "./BaseProvider";
import { ChatTencentHunyuan } from "@langchain/community/chat_models/tencent_hunyuan";
import { SystemMessage } from '@langchain/core/messages';
import { langchainFetchOptions } from '@/utils/langchainFetchAdapter';

export class TencentHunyuanProvider extends BaseProvider {
  initialize(config: ModelConfig): void {
    this.model = new ChatTencentHunyuan({
      temperature: config.temperature,
      model: config.modelName,
      topP: config.topP,
      streaming: config.streamOutput,
      tencentSecretKey: config.apiKey,
    });

    if (config.systemPrompt) {
      this.systemMessage = new SystemMessage({ content: config.systemPrompt });
    }
  }
}
