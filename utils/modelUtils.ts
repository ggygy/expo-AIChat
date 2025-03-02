import { ModelProviderId } from '@/constants/ModelProviders';
import { BaseMessage, AIMessage, HumanMessage } from '@langchain/core/messages';

/**
 * 判断是否为 DeepSeek Reasoner 模型
 */
export function isDeepSeekReasonerModel(providerId: ModelProviderId, modelId: string): boolean {
  return providerId === 'deepseek' && modelId.includes('reasoner');
}

/**
 * 为 DeepSeek Reasoner 模型准备消息列表
 * 确保最后一条是用户消息
 */
export function prepareMessagesForDeepSeekReasoner(messages: BaseMessage[]): BaseMessage[] {
  if (messages.length === 0) return messages;
  
  const lastMessage = messages[messages.length - 1];
  
  if (lastMessage instanceof AIMessage) {
    // 如果最后一条是AI消息，添加一个请求继续的用户消息
    return [...messages, new HumanMessage({ content: "Please continue." })];
  }
  
  return messages;
}

/**
 * 解析可能的JSON响应内容
 */
export function tryParseContentObject(content: any): string | undefined {
  if (typeof content === 'string') return content;
  
  try {
    if (content && typeof content === 'object') {
      if ('content' in content && 'type' in content) {
        return String(content.content || '');
      } else if ('text' in content) {
        return String(content.text);
      } else {
        return JSON.stringify(content);
      }
    }
  } catch (e) {
    console.error('解析内容对象失败:', e);
  }
  
  return String(content || '');
}
