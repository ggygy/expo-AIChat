import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { BaseProvider, ModelConfig } from "./BaseProvider";
import { ChatOpenAI } from '@langchain/openai';
import { SystemMessage } from '@langchain/core/messages';

export class OpenAIProvider extends BaseProvider {
  initialize(config: ModelConfig): void {
    this.model = new ChatOpenAI({
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