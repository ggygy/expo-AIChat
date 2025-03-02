import { BaseProvider, ModelConfig } from "./BaseProvider";
import { ChatBaiduQianfan } from "@langchain/baidu-qianfan";
import { SystemMessage } from '@langchain/core/messages';

export class BaiduQianfanProvider extends BaseProvider {
  initialize(config: ModelConfig): void {
    this.model = new ChatBaiduQianfan({
      temperature: config.temperature,
      modelName: config.modelName,
      topP: config.topP,
      streaming: config.streamOutput,
      qianfanAccessKey: config.apiKey
    });

    if (config.systemPrompt) {
      this.systemMessage = new SystemMessage({ content: config.systemPrompt });
    }
  }
}
