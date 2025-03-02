import { BaseProvider, ModelConfig } from "./BaseProvider";
import { ChatAlibabaTongyi } from "@langchain/community/chat_models/alibaba_tongyi";
import { SystemMessage } from '@langchain/core/messages';

export class AlibabaTongyiProvider extends BaseProvider {
  initialize(config: ModelConfig): void {
    this.model = new ChatAlibabaTongyi({
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      modelName: config.modelName,
      topP: config.topP,
      streaming: config.streamOutput,
      alibabaApiKey: config.apiKey,
    });

    if (config.systemPrompt) {
      this.systemMessage = new SystemMessage({ content: config.systemPrompt });
    }
  }
}
