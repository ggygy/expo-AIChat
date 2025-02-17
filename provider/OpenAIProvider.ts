import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { BaseProvider, ModelConfig } from "./BaseProvider";
import { ChatOpenAI } from '@langchain/openai';

export class OpenAIProvider extends BaseProvider {
  initialize(config: ModelConfig): void {
    this.model = new ChatOpenAI({
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