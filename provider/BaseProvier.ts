import { BaseMessageChunk } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { ChatDeepSeek } from '@langchain/deepseek';
import { ModelProviderId } from '@/constants/ModelProviders';

interface ModelConfig {
  vendor: string;
  apiKey: string;
  modelName: string;
  temperature?: number;
  maxTokens?: number;
}

class UnifiedProvider {
  getModel(config: ModelConfig): ChatOpenAI | ChatDeepSeek {
    const commonParams = {
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens,
      modelName: config.modelName,
      apiKey: config.apiKey
    };

    switch (config.vendor) {
      case ModelProviderId.OpenAI:
        return new ChatOpenAI({
          ...commonParams,
        });
      case ModelProviderId.DeepSeek:
        return new ChatDeepSeek({
          ...commonParams,
        });
      default:
        throw new Error(`Unsupported vendor: ${config.vendor}`);
    }
  }

  // 统一调用入口
  async callSingleModel(
    messages: BaseMessageChunk[],
    config: ModelConfig
  ): Promise<string> {
    try {
      const model = this.getModel(config);
      const response = await model.invoke(messages);
      return response.content.toString();
    } catch (error) {
      throw this.handleError(error, config.vendor);
    }
  }

  // 批量异步调用
  async callModels(
    messages: BaseMessageChunk[],
    configs: ModelConfig[]
  ): Promise<Record<string, string>> {
    const results: Record<string, string> = {};

    await Promise.all(
      configs.map(async (config) => {
        try {
          const response = await this.callSingleModel(messages, config);
          results[config.vendor] = response;
        } catch (error: any) {
          results[config.vendor] = `Error: ${error.message}`;
        }
      })
    );

    return results as Record<string, string>;
  }

  // 错误处理统一封装
  private handleError(error: any, vendor: string): Error {
    let message = `[${vendor}] API Error: `;
    
    if (error.response) {
      message += `Status ${error.response.status}: ${error.response.data?.error?.message}`;
    } else if (error.message) {
      message += error.message;
    } else {
      message += 'Unknown error';
    }
    
    return new Error(message);
  }

  // 扩展：流式输出支持
  async *streamModel(
    messages: BaseMessageChunk[],
    config: ModelConfig
  ): AsyncGenerator<string> {
    const model = this.getModel(config);
    const stream = await model.stream(messages);

    for await (const chunk of stream) {
      yield chunk.content.toString();
    }
  }
}

// 4. 使用示例
async function demo() {
  const client = new UnifiedProvider();
  const model = client.getModel({
    vendor: ModelProviderId.DeepSeek,
    apiKey: 'your-api-key',
    modelName: 'claude-2',
  });
}
