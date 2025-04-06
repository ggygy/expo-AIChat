import { AIMessage, AIMessageChunk, BaseMessage, HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ModelProviderId } from '@/constants/ModelProviders';
import { IterableReadableStream } from '@langchain/core/dist/utils/stream';
import { ToolInterface } from '@langchain/core/tools';
import { Runnable } from '@langchain/core/runnables';
import { BaseLanguageModelInput } from '@langchain/core/language_models/base';
import { ChatDeepSeekCallOptions } from '@langchain/deepseek';
import { AgentExecutor } from 'langchain/agents';
import { 
  getLastConversationTurn,
  processMessagesForReasoner
} from '@/utils/conversationUtils';

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
  chat(messages: BaseMessage[]): Promise<string>;
  stream(messages: BaseMessage[]): Promise<IterableReadableStream<any>>;
  processMessagesForReasoner(messages: BaseMessage[]): Promise<BaseMessage[]>;
  testModel(): Promise<TestModelResult>;
  supportsToolCalling(): boolean;
  addTools?(tools: ToolInterface[]): Promise<void>;
}

export abstract class BaseProvider implements IModelProvider {
  protected model!: BaseChatModel;
  protected llmWithTools?: Runnable<BaseLanguageModelInput, AIMessageChunk, ChatDeepSeekCallOptions>;
  protected systemMessage?: SystemMessage;
  protected maxTokens?: number;
  protected tools: ToolInterface[] = [];
  protected hasToolsCapability: boolean = false;
  protected agentExecutor?: AgentExecutor;

  abstract initialize(config: ModelConfig): void;

  async chat(messages: BaseMessage[]): Promise<string> {
    const processedMessages = await this.processMessagesForReasoner(messages);
    const messageList = this.systemMessage
      ? [this.systemMessage, ...processedMessages]
      : processedMessages;

    if (this.hasToolsCapability && this.llmWithTools && this.tools.length > 0) {
      try {
        console.log(`[${this.constructor.name}] 使用工具调用模式`);
        
        // 使用更清晰的工具调用处理流程
        const response = await this.processToolCalls(messageList);
        return response;
      } catch (error) {
        console.error("工具调用处理出错:", error);
        const response = await this.model.invoke(messageList);
        return response.content.toString();
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
        return response.content.toString();
      }
    } else {
      console.log(`[${this.constructor.name}] 使用普通模型`);
      const response = await this.model.invoke(messageList);
      return response.content.toString();
    }
  }

  async stream(messages: BaseMessage[]): Promise<IterableReadableStream<any>> {
    const processedMessages = await this.processMessagesForReasoner(messages);
    const messageList = this.systemMessage
      ? [this.systemMessage, ...processedMessages]
      : processedMessages;

    // 注意：工具调用通常与流式输出不兼容
    // 简单地使用原始模型进行流式输出
    return this.model.stream(messageList);
  }

  /**
   * 处理工具调用逻辑，遵循LangChain官方推荐方式
   * @param messages 消息列表
   * @returns 最终响应文本
   */
  protected async processToolCalls(messages: BaseMessage[]): Promise<string> {
    try {
      // 第一步：向模型发送请求，获取初始回复
      console.log("发送消息到模型以获取初始回复...");
      
      // 确保只传递最新的人类消息，以减少错误
      const latestMessages = getLastConversationTurn(messages);
      console.log(`使用最新的消息进行工具调用，消息数量: ${latestMessages.length}`);
      
      const aiMessage = await this.llmWithTools!.invoke(latestMessages);
      
      // 如果没有工具调用，直接返回内容
      if (!aiMessage.tool_calls || aiMessage.tool_calls.length === 0) {
        return aiMessage.content.toString();
      }
      
      console.log(`检测到工具调用请求，处理 ${aiMessage.tool_calls.length} 个工具调用:`, 
        JSON.stringify(aiMessage.tool_calls.map(tc => ({ name: tc.name, args: tc.args })))
      );
      
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
        }
      }
      
      // 第四步：发送包含工具结果的完整消息列表，获取最终回复
      console.log("获取最终回复...");
      const finalResponse = await this.llmWithTools!.invoke(updatedMessages);
      return finalResponse.content.toString();
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

  async addTools(tools: ToolInterface[]): Promise<void> {
    if (tools && tools.length > 0) {
      this.tools = tools;
      
      try {
        if (this.model && typeof (this.model as any).bindTools === 'function') {
          this.llmWithTools = (this.model as any).bindTools(tools);
          this.hasToolsCapability = true;
          console.log(`[${this.constructor.name}] 成功使用原生方法绑定了 ${tools.length} 个工具`);
        }
      } catch (error) {
        console.error(`[${this.constructor.name}] 绑定工具失败:`, error);
        this.hasToolsCapability = false;
      }
    }
  }
}

