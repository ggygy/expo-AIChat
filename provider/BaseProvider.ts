import { BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ModelProviderId } from '@/constants/ModelProviders';
import { IterableReadableStream } from '@langchain/core/dist/utils/stream';

export interface ModelConfig {
  vendor: ModelProviderId;
  apiKey: string;
  modelName: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  streamOutput?: boolean;
  systemPrompt?: string;
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
  chat(messages: BaseMessage[]): Promise<string>;
  stream(messages: BaseMessage[]): Promise<IterableReadableStream<any>>;
  testModel(): Promise<TestModelResult>;
}

export abstract class BaseProvider implements IModelProvider {
  protected model!: BaseChatModel;
  protected systemMessage?: SystemMessage;

  abstract initialize(config: ModelConfig): void;

  async chat(messages: BaseMessage[]): Promise<string> {
    const messageList = this.systemMessage 
      ? [this.systemMessage, ...messages]
      : messages;
    const response = await this.model.invoke(messageList);
    return response.content.toString();
  }

  async stream(messages: BaseMessage[]): Promise<IterableReadableStream<any>> {
    const messageList = this.systemMessage 
      ? [this.systemMessage, ...messages]
      : messages;
    return this.model.stream(messageList);
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

