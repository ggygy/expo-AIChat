import { BaseMessageChunk, HumanMessage } from '@langchain/core/messages';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ModelProviderId } from '@/constants/ModelProviders';

export interface ModelConfig {
  vendor: ModelProviderId;
  apiKey: string;
  modelName: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface TestModelResult {
  success: boolean;
  error?: {
    code: 'timeout' | 'invalid_api_key' | 'connection_error' | 'unknown';
    message: string;
  };
}

export interface IModelProvider {
  initialize(config: ModelConfig): void;
  chat(messages: BaseMessageChunk[]): Promise<string>;
  stream(messages: BaseMessageChunk[]): AsyncGenerator<string>;
  testModel(): Promise<TestModelResult>;
}

export abstract class BaseProvider implements IModelProvider {
  protected model!: BaseChatModel;

  abstract initialize(config: ModelConfig): void;

  async chat(messages: BaseMessageChunk[]): Promise<string> {
    const response = await this.model.invoke(messages);
    return response.content.toString();
  }

  async *stream(messages: BaseMessageChunk[]): AsyncGenerator<string> {
    const stream = await this.model.stream(messages);
    for await (const chunk of stream) {
      yield chunk.content.toString();
    }
  }

  async testModel(): Promise<TestModelResult> {
    try {
      const testMessage = new HumanMessage({ content: 'Hi, this is a test message.' });
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), 10 * 1000);
      });
      const testPromise = this.model.invoke([testMessage]);
      
      const response = await Promise.race([testPromise, timeoutPromise]);
      
      if (response === null) {
        return {
          success: false,
          error: {
            code: 'timeout',
            message: 'Request timeout after 10s'
          }
        };
      }

      return {
        success: !!response.content
      };
    } catch (error) {
      console.error(`${this.constructor.name} test error:`, error);
      
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          return {
            success: false,
            error: {
              code: 'invalid_api_key',
              message: error.message
            }
          };
        }
        if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch')) {
          return {
            success: false,
            error: {
              code: 'connection_error',
              message: error.message
            }
          };
        }
      }

      return {
        success: false,
        error: {
          code: 'unknown',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
}

