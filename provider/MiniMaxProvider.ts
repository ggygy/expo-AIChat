import { BaseProvider, ModelConfig } from "./BaseProvider";
import { ChatMinimax } from "@langchain/community/chat_models/minimax";
import { SystemMessage } from '@langchain/core/messages';
import { langchainFetchOptions } from '@/utils/langchainFetchAdapter';

export class MiniMaxProvider extends BaseProvider {
  initialize(config: ModelConfig): void {
    this.model = new ChatMinimax({
      temperature: config.temperature,
      tokensToGenerate: config.maxTokens,
      modelName: config.modelName,
      topP: config.topP,
      streaming: config.streamOutput,
      apiKey: config.apiKey
    });

    if (config.systemPrompt) {
      this.systemMessage = new SystemMessage({ content: config.systemPrompt });
    }
  }
}
