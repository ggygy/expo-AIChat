import { BaseMessageChunk, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ModelProviderId } from '@/constants/ModelProviders';

export interface ModelConfig {
  vendor: ModelProviderId;
  apiKey: string;
  modelName: string;
  baseUrl?: string;
  temperature: number;
  maxTokens?: number;
  topP: number;
  streamOutput: boolean;
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
  chat(messages: BaseMessageChunk[]): Promise<string>;
  stream(messages: BaseMessageChunk[]): AsyncGenerator<string>;
  testModel(): Promise<TestModelResult>;
}

export abstract class BaseProvider implements IModelProvider {
  protected model!: BaseChatModel;
  protected systemMessage?: SystemMessage;

  abstract initialize(config: ModelConfig): void;

  async chat(messages: BaseMessageChunk[]): Promise<string> {
    const messageList = this.systemMessage 
      ? [this.systemMessage, ...messages]
      : messages;
    const response = await this.model.invoke(messageList);
    return response.content.toString();
  }

  async *stream(messages: BaseMessageChunk[]): AsyncGenerator<string> {
    try {
      const messageList = this.systemMessage 
        ? [this.systemMessage, ...messages]
        : messages;
   
      // 获取流时增加类型断言或检查
      const stream = await this.model.stream(messageList);
      console.log('stream', stream);
      
      
      if (!stream) {
        throw new Error('No stream response received');
      }
  
      // 检查流是否有效（示例代码，具体依赖 LangChain 实现）
      if (typeof stream[Symbol.asyncIterator] !== 'function') {
        throw new Error('Invalid stream response: not an async iterable');
      }
  
      let receivedValidChunk = false;
      for await (const chunk of stream) {
        if (!chunk?.content) {
          console.warn('Received empty chunk:', chunk);
          continue;
        }
        receivedValidChunk = true;
        yield chunk.content.toString();
      }
  
      if (!receivedValidChunk) {
        throw new Error('Stream ended without valid content');
      }
    } catch (error) {
      console.error('Stream processing error:', error);
      throw new Error(
        error instanceof Error 
          ? error.message 
          : 'Failed to process stream response'
      );
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

