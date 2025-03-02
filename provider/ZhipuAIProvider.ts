import { BaseProvider, ModelConfig } from "./BaseProvider";
import { ChatZhipuAI } from "@langchain/community/chat_models/zhipuai";
import { SystemMessage } from '@langchain/core/messages';

export class ZhipuAIProvider extends BaseProvider {
  initialize(config: ModelConfig): void {
    this.model = new ChatZhipuAI({
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
