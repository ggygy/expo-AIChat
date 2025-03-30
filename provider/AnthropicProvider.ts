import { SystemMessage } from "@langchain/core/messages";
import { BaseProvider, ModelConfig } from "./BaseProvider";
import { ChatAnthropic } from "@langchain/anthropic";

export class AnthropicProvider extends BaseProvider {
    initialize(config: ModelConfig): void {
        this.model = new ChatAnthropic({
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