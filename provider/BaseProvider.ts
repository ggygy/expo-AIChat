import { AIMessage, AIMessageChunk, BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ModelProviderId } from '@/constants/ModelProviders';
import { IterableReadableStream } from '@langchain/core/dist/utils/stream';
import { Tool } from 'langchain/tools';
import { Runnable } from '@langchain/core/runnables';
import { BaseLanguageModelInput } from '@langchain/core/language_models/base';
import { ChatDeepSeekCallOptions } from '@langchain/deepseek';

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
  tools?: Tool[]; // 工具配置
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
  processMessagesForReasoner(messages: BaseMessage[]): Promise<BaseMessage[]>;
  testModel(): Promise<TestModelResult>;
  supportsToolCalling(): boolean;
  addTools(tools: Tool[]): void;
}

export abstract class BaseProvider implements IModelProvider {
  protected model!: BaseChatModel;
  protected llmWithTools?: Runnable<BaseLanguageModelInput, AIMessageChunk, ChatDeepSeekCallOptions>
  protected systemMessage?: SystemMessage;
  protected maxTokens?: number;
  protected tools: Tool[] = [];
  protected hasToolsCapability: boolean = false;

  abstract initialize(config: ModelConfig): void;

  async chat(messages: BaseMessage[]): Promise<string> {
    const processedMessages = await this.processMessagesForReasoner(messages);
    const messageList = this.systemMessage
      ? [this.systemMessage, ...processedMessages]
      : processedMessages;

    // 使用适当的模型（带工具或不带工具）
    const modelToUse = this.hasToolsCapability && this.llmWithTools ? this.llmWithTools : this.model;
    
    const response = await modelToUse.invoke(messageList);
    return response.content.toString();
  }

  async stream(messages: BaseMessage[]): Promise<IterableReadableStream<any>> {
    const processedMessages = await this.processMessagesForReasoner(messages);
    const messageList = this.systemMessage
      ? [this.systemMessage, ...processedMessages]
      : processedMessages;

    // 使用适当的模型（带工具或不带工具）
    const modelToUse = this.hasToolsCapability && this.llmWithTools ? this.llmWithTools : this.model;
    
    return modelToUse.stream(messageList);
  }

  /**
   * 添加工具到模型
   */
  addTools(tools: Tool[]): void {
    if (tools && tools.length > 0) {
      this.tools = tools;
      
      // 基类中只存储工具，具体的绑定由子类实现
      console.log(`[${this.constructor.name}] 添加了 ${tools.length} 个工具，但需要子类实现绑定`);
      
      // 标记为有工具能力，但需要子类设置为true
      this.hasToolsCapability = false;
    }
  }

  /**
   * 检查提供商是否支持工具调用
   */
  supportsToolCalling(): boolean {
    return this.hasToolsCapability;
  }

  async processMessagesForReasoner(messages: BaseMessage[]): Promise<BaseMessage[]> {
    // 检查模型是否是 reasoner 类型
    const isReasoner = (this.model as any)?.modelName?.includes('reasoner');

    if (!isReasoner) {
        return messages; // 如果不是reasoner模型，直接返回消息
    }

    // 确保消息是交替的用户和助手消息
    const processedMessages: BaseMessage[] = [];
    let lastMessageType: string | null = null;

    for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        const currentType = message instanceof HumanMessage ? 'human' :
            message instanceof AIMessage ? 'ai' :
                message instanceof SystemMessage ? 'system' : 'unknown';

        // 系统消息直接添加，不参与交替检查
        if (currentType === 'system') {
            processedMessages.push(message);
            continue;
        }

        // 处理连续相同类型的消息
        if (lastMessageType === currentType && (currentType === 'human' || currentType === 'ai')) {
            if (currentType === 'human') {
                // 如果有连续的用户消息，添加一个空的AI消息
                processedMessages.push(new AIMessage({ content: "" }));
                console.log('发现连续的用户消息，添加空的AI消息进行分隔');
            } else if (currentType === 'ai') {
                // 如果有连续的AI消息，添加一个提示续写的用户消息
                processedMessages.push(new HumanMessage({ content: "Please continue." }));
                console.log('发现连续的AI消息，添加用户提示消息进行分隔');
            }
        }

        // 添加当前消息
        processedMessages.push(message);
        lastMessageType = currentType;
    }

    // 确保最后一条消息是用户消息，这样才能生成AI回复
    const lastMessage = processedMessages[processedMessages.length - 1];
    if (lastMessage instanceof AIMessage) {
        console.log('最后一条消息是AI消息，添加一个用户提示消息');
        processedMessages.push(new HumanMessage({ content: "Please continue." }));
    }

    return processedMessages;
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

