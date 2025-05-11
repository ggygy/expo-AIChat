import { AIMessage, AIMessageChunk, BaseMessage, HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ModelProviderId } from '@/constants/ModelProviders';
import { IterableReadableStream } from '@langchain/core/utils/stream';
import { ToolInterface } from '@langchain/core/tools';
import { Runnable } from '@langchain/core/runnables';
import { BaseLanguageModelInput } from '@langchain/core/language_models/base';
import { ChatDeepSeekCallOptions } from '@langchain/deepseek';
import { AgentExecutor } from 'langchain/agents';
import { 
  getLastConversationTurn,
  processMessagesForReasoner
} from '@/utils/conversationUtils';
import { type ToolCall } from '@langchain/core/messages/tool';

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
  tools?: ToolInterface[];
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
  chat(messages: BaseMessage[]): Promise<AIMessageChunk>;
  stream(messages: BaseMessage[]): Promise<IterableReadableStream<any>>;
  processMessagesForReasoner(messages: BaseMessage[]): Promise<BaseMessage[]>;
  testModel(): Promise<TestModelResult>;
  supportsToolCalling(): boolean;
  getLastToolCalls?(): any[] | undefined;
}

export abstract class BaseProvider implements IModelProvider {
  protected model!: BaseChatModel;
  protected llmWithTools?: Runnable<BaseLanguageModelInput, AIMessageChunk>;
  protected systemMessage?: SystemMessage;
  protected maxTokens?: number;
  protected tools: ToolInterface[] = [];
  protected hasToolsCapability: boolean = false;
  protected agentExecutor?: AgentExecutor;
  protected lastToolCalls: ToolCall[] = []; // 存储最近一次的工具调用信息
  protected lastInvalidToolCalls: any[] = []; // 存储最近一次的无效工具调用信息

  abstract initialize(config: ModelConfig): void;

  async chat(messages: BaseMessage[]): Promise<AIMessageChunk> {
    const processedMessages = await this.processMessagesForReasoner(messages);
    const messageList = this.systemMessage
      ? [this.systemMessage, ...processedMessages]
      : processedMessages;

    if (this.hasToolsCapability && this.llmWithTools && this.tools.length > 0) {
      try {
        console.log(`[${this.constructor.name}] 使用工具调用模式`);
        
        // 使用更清晰的工具调用处理流程
        const response = await this.processToolCalls(messageList);
        return response as AIMessageChunk;
      } catch (error) {
        console.error("工具调用处理出错:", error);
        const response = await this.model.invoke(messageList);
        return response;
      }
    } else if (this.agentExecutor) {
      try {
        const result = await this.agentExecutor.invoke({
          messages: messageList,
        });
        return result.output;
      } catch (error) {
        console.error("Agent执行器出错:", error);
        const response = await this.model.invoke(messageList);
        return response;
      }
    } else {
      console.log(`[${this.constructor.name}] 使用普通模型`);
      const response = await this.model.invoke(messageList);
      return response;
    }
  }

  async stream(messages: BaseMessage[]): Promise<IterableReadableStream<any>> {
    const processedMessages = await this.processMessagesForReasoner(messages);
    
    const messageList = this.systemMessage
      ? [this.systemMessage, ...processedMessages]
      : processedMessages;

    // 支持工具调用的流式输出
    if (this.hasToolsCapability && this.llmWithTools && this.tools.length > 0) {
      try {
        console.log(`[${this.constructor.name}] 使用工具调用模式（流式输出）`);
        const response = await this.processToolCalls(messageList, true);
        if (response instanceof IterableReadableStream) {
          return response;
        } else {
          // 如果返回类型不是流，直接抛出错误
          throw new Error("工具调用处理返回了非流式数据");
        }
      } catch (error) {
        console.error("工具调用处理出错，回退到普通流式输出:", error);
        return this.model.stream(messageList);
      }
    } else if (this.agentExecutor) {
      // Agent暂不支持流式输出，回退到普通流式输出
      console.log(`[${this.constructor.name}] Agent执行器不支持流式输出，使用普通流式输出`);
      return this.model.stream(messageList);
    } else {
      console.log(`[${this.constructor.name}] 使用普通流式输出`);
      return this.model.stream(messageList);
    }
  }

  /**
   * 处理工具调用逻辑，遵循LangChain官方推荐方式
   * @param messages 消息列表
   * @param streamMode 是否使用流式输出模式
   * @returns 最终响应文本或流
   */
  protected async processToolCalls(messages: BaseMessage[], streamMode: boolean = false): Promise<AIMessageChunk | IterableReadableStream<any>> {
    try {
      // 重置工具调用记录
      this.lastToolCalls = [];
      this.lastInvalidToolCalls = [];

      // 确保只传递系统消息和最后一条人类消息
      const latestMessages = getLastConversationTurn(messages);
      // 使用提取的消息获取初始回复
      const aiMessage = await this.llmWithTools!.invoke(latestMessages);
      
      // 如果没有工具调用，直接返回内容
      if (!aiMessage.tool_calls || aiMessage.tool_calls.length === 0) {
        if (streamMode) {
          // 在流模式下，只使用系统消息和最后一条人类消息，加上新的AI回复
          return this.model.stream([...latestMessages, aiMessage]);
        }
        return aiMessage;
      }
      
      // 记录所有工具调用
      if (aiMessage.tool_calls) {
        this.lastToolCalls = [...aiMessage.tool_calls];
      }
      
      // 第二步：创建包含初始回复的消息列表
      let updatedMessages = [...latestMessages, aiMessage];
      
      // 为工具名称创建快速查找映射
      const toolsByName: Record<string, ToolInterface> = {};
      this.tools.forEach(tool => {
        toolsByName[tool.name] = tool;
      });
      
      // 第三步：执行每个工具调用，并添加结果到消息列表
      for (const toolCall of aiMessage.tool_calls) {
        const selectedTool = toolsByName[toolCall.name];
        if (selectedTool) {
          try {
            console.log(`执行工具: ${toolCall.name}，参数:`, JSON.stringify(toolCall.args));
            
            // 用更安全的方式调用工具
            let toolMessage;
            try {
              toolMessage = await selectedTool.invoke(toolCall);
            } catch (invokeError) {
              console.error(`标准调用工具 ${toolCall.name} 失败，尝试替代方法:`, invokeError);
              
              // 如果标准方式失败，尝试直接调用 _call 方法
              if ((selectedTool as any)._call) {
                const args = typeof toolCall.args === 'string' ? 
                  JSON.parse(toolCall.args) : toolCall.args;
                  
                const result = await (selectedTool as any)._call(args);
                toolMessage = new ToolMessage({
                  content: typeof result === 'string' ? result : JSON.stringify(result),
                  tool_call_id: toolCall.id ?? '',
                  name: toolCall.name
                });
              } else {
                throw invokeError;
              }
            }
            
            console.log(`工具 ${toolCall.name} 执行结果:`, toolMessage.content);
            updatedMessages.push(toolMessage);
          } catch (error) {
            console.error(`工具 ${toolCall.name} 调用失败:`, error);
            const errorMessage = new ToolMessage({
              content: `工具执行失败: ${error instanceof Error ? error.message : '未知错误'}`,
              tool_call_id: toolCall.id ?? '',
              name: toolCall.name
            });
            updatedMessages.push(errorMessage);
            
            // 记录无效工具调用
            this.lastInvalidToolCalls.push({
              ...toolCall,
              error: error instanceof Error ? error.message : '未知错误'
            });
          }
        } else {
          // 处理找不到工具的情况
          console.error(`未找到工具: ${toolCall.name}，可用工具:`, Object.keys(toolsByName));
          const errorMessage = new ToolMessage({
            content: `找不到工具: ${toolCall.name}`,
            tool_call_id: toolCall.id ?? '',
            name: toolCall.name
          });
          updatedMessages.push(errorMessage);
          
          // 记录无效工具调用
          this.lastInvalidToolCalls.push({
            ...toolCall,
            error: `找不到工具: ${toolCall.name}`
          });
        }
      }
      
      if (streamMode) {
        // 将处理工具调用产生的消息直接用于流式输出
        console.log(`流模式下，使用 ${updatedMessages.length} 条消息进行流式输出`);
        return this.model.stream(updatedMessages);
      } else {
        const finalResponse = await this.llmWithTools!.invoke(updatedMessages);
        return finalResponse;
      }
    } catch (error) {
      console.error("工具调用处理出错:", error);
      throw error; // 向上层传递错误，让它处理回退逻辑
    }
  }

  supportsToolCalling(): boolean {
    return this.hasToolsCapability;
  }

  // 使用工具函数库中的处理方法
  async processMessagesForReasoner(messages: BaseMessage[]): Promise<BaseMessage[]> {
    const isReasoner = (this.model as any)?.modelName?.includes('reasoner');
    return processMessagesForReasoner(messages, isReasoner);
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

  /**
   * 获取最近一次对话中的工具调用信息
   * @returns 工具调用信息数组，如果没有则返回undefined
   */
  getLastToolCalls(): ToolCall[] | undefined {
    // 如果有工具调用，则返回工具调用信息
    if (this.lastToolCalls && this.lastToolCalls.length > 0) {
      // 返回工具调用信息的深拷贝，避免外部修改
      return JSON.parse(JSON.stringify(this.lastToolCalls));
    }
    
    // 如果只有无效工具调用，也返回这些信息
    if (this.lastInvalidToolCalls && this.lastInvalidToolCalls.length > 0) {
      return JSON.parse(JSON.stringify(this.lastInvalidToolCalls));
    }
    
    // 如果都没有，返回undefined
    return undefined;
  }
}

