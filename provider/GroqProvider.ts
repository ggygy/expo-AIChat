import { BaseProvider, ModelConfig } from "./BaseProvider";
import { ChatGroq } from "@langchain/groq";
import { SystemMessage } from '@langchain/core/messages';
import { langchainFetchOptions } from '@/utils/langchainFetchAdapter';

export class GroqProvider extends BaseProvider {
  initialize(config: ModelConfig): void {
    this.model = new ChatGroq({
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      modelName: config.modelName,
      streaming: config.streamOutput,
      apiKey: config.apiKey,
      fetch: langchainFetchOptions.fetch,
      baseUrl: config.baseUrl,
    });

    if (config.systemPrompt) {
      this.systemMessage = new SystemMessage({ content: config.systemPrompt });
    }
  }
}
