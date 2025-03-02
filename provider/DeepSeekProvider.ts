import { BaseMessage, AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatDeepSeek } from '@langchain/deepseek';
import { BaseProvider, ModelConfig } from './BaseProvider';
import { IterableReadableStream } from '@langchain/core/dist/utils/stream';
import { langchainFetchOptions } from '@/utils/langchainFetchAdapter';

export class DeepseekProvider extends BaseProvider {
  initialize(config: ModelConfig): void {
    // 保存maxTokens
    this.maxTokens = config.maxTokens;
    
    const modelOptions: any = {
      modelName: config.modelName,
      apiKey: config.apiKey,
      temperature: config.temperature ?? 0.7,
      topP: config.topP ?? 1,
      configuration: {
        ...langchainFetchOptions,
        baseURL: config.baseUrl
      }
    };
    
    // 只有当明确设置了maxTokens时才添加该参数
    if (config.maxTokens !== undefined) {
      modelOptions.maxTokens = config.maxTokens;
      console.log(`DeepSeek Provider 设置最大令牌数: ${config.maxTokens}`);
    }

    // 配置 DeepSeek Reasoner 模式
    // 检测是否是 deepseek-reasoner 模型
    if (config.modelName.includes('reasoner')) {
      console.log('使用 DeepSeek Reasoner 模型，启用前缀模式');
      modelOptions.prefixMessages = true; // 启用前缀模式
    }

    // 创建 ChatDeepseek 实例
    this.model = new ChatDeepSeek(modelOptions);

    // 如果有系统提示，创建系统消息
    if (config.systemPrompt) {
      this.systemMessage = new SystemMessage({ content: config.systemPrompt });
    }
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

  async chat(messages: BaseMessage[]): Promise<string> {
    const processedMessages = await this.processMessagesForReasoner(messages);
    const messageList = this.systemMessage
      ? [this.systemMessage, ...processedMessages]
      : processedMessages;

    const response = await this.model.invoke(messageList);
    return response.content.toString();
  }

  async stream(messages: BaseMessage[]): Promise<IterableReadableStream<any>> {
    const processedMessages = await this.processMessagesForReasoner(messages);
    const messageList = this.systemMessage
      ? [this.systemMessage, ...processedMessages]
      : processedMessages;

    return this.model.stream(messageList);
  }
}