import { BaseProvider, ModelConfig } from "./BaseProvider";
import { ChatTogetherAI } from "@langchain/community/chat_models/togetherai";
import { SystemMessage } from '@langchain/core/messages';
import { langchainFetchOptions } from '@/utils/langchainFetchAdapter';

export class TogetherAIProvider extends BaseProvider {
  initialize(config: ModelConfig): void {
    this.model = new ChatTogetherAI({
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      modelName: config.modelName,
      topP: config.topP,
      streaming: config.streamOutput,
      apiKey: config.apiKey,
    });

    if (config.systemPrompt) {
      this.systemMessage = new SystemMessage({ content: config.systemPrompt });
    }
  }
}
