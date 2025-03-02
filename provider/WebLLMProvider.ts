import { BaseProvider, ModelConfig } from "./BaseProvider";
import { ChatWebLLM } from "@langchain/community/chat_models/webllm";
import { SystemMessage } from '@langchain/core/messages';
import { langchainFetchOptions } from '@/utils/langchainFetchAdapter';

export class WebLLMProvider extends BaseProvider {
  initialize(config: ModelConfig): void {
    this.model = new ChatWebLLM({
      temperature: config.temperature,
      model: config.modelName || "Llama-2-7b-chat-hf",
    });

    if (config.systemPrompt) {
      this.systemMessage = new SystemMessage({ content: config.systemPrompt });
    }
  }
}
