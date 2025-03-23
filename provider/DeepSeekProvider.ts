import { BaseMessage, AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatDeepSeek } from '@langchain/deepseek';
import { BaseProvider, ModelConfig } from './BaseProvider';
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
    let model = new ChatDeepSeek(modelOptions);
    this.model = model;
    
    // 使用bindTools方法绑定工具，而不是在初始化选项中传递
    if (config.tools && config.tools.length > 0) {
      console.log(`DeepSeek Provider 绑定工具，数量: ${config.tools.length}`);
      let llmWithTools = model.bindTools(config.tools);
      this.llmWithTools = llmWithTools;
    }

    // 如果有系统提示，创建系统消息
    if (config.systemPrompt) {
      this.systemMessage = new SystemMessage({ content: config.systemPrompt });
    }
  }
}