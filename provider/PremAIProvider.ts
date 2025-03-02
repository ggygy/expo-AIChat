import { BaseProvider, ModelConfig } from "./BaseProvider";
import { ChatPrem } from "@langchain/community/chat_models/premai";
import { SystemMessage } from '@langchain/core/messages';
import { langchainFetchOptions } from '@/utils/langchainFetchAdapter';

export class PremAIProvider extends BaseProvider {
  initialize(config: ModelConfig): void {
    this.model = new ChatPrem({
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      model: config.modelName,
      top_p: config.topP,
      streaming: config.streamOutput,
      apiKey: config.apiKey,
    });

    if (config.systemPrompt) {
      this.systemMessage = new SystemMessage({ content: config.systemPrompt });
    }
  }
}
