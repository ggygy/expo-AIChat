import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';

/**
 * 获取最后一轮对话，以减少工具调用错误风险
 * @param messages 完整消息列表 
 * @returns 过滤后的消息列表，包含系统消息和最后一条人类消息
 */
export function getLastConversationTurn(messages: BaseMessage[]): BaseMessage[] {
  // 获取所有系统消息
  const systemMessages = messages.filter(m => m instanceof SystemMessage);
  console.log(`找到系统消息数量: ${systemMessages.length}`);
  
  // 找到最后一条人类消息
  let lastHumanMessage: HumanMessage | null = null;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i] instanceof HumanMessage) {
      lastHumanMessage = messages[i] as HumanMessage;
      break;
    }
  }
  
  if (!lastHumanMessage) {
    console.log("没有找到人类消息，只返回系统消息");
    return systemMessages;
  }
  
  // 构建最终消息列表：系统消息 + 最后一条人类消息
  const finalMessages = [...systemMessages, lastHumanMessage];
  
  // 验证没有AI消息
  const aiMessages = finalMessages.filter(m => m instanceof AIMessage);
  if (aiMessages.length > 0) {
    console.warn("警告：过滤后的消息中仍包含AI消息，将被移除");
    return finalMessages.filter(m => !(m instanceof AIMessage));
  }
  
  return finalMessages;
}

/**
 * 清理消息列表，移除重复的系统消息
 * @param messages 消息列表
 * @returns 清理后的消息列表
 */
export function cleanupMessageList(messages: BaseMessage[]): BaseMessage[] {
  if (!messages || messages.length === 0) {
    return [];
  }

  // 移除重复的系统消息（保留最后一个）
  const systemMessages = messages.filter(m => m instanceof SystemMessage);
  const nonSystemMessages = messages.filter(m => !(m instanceof SystemMessage));

  let result: BaseMessage[] = [];
  
  // 如果有系统消息，只保留最后一个
  if (systemMessages.length > 0) {
    console.log(`原始消息中有 ${systemMessages.length} 个系统消息，只保留最后一个`);
    result.push(systemMessages[systemMessages.length - 1]);
  }
  
  // 添加非系统消息
  result = result.concat(nonSystemMessages);
  
  return result;
}

/**
 * 为 Reasoning 模型处理消息，确保消息交替
 * @param messages 消息列表
 * @param isReasoner 是否是 Reasoner 模型
 * @returns 处理后的消息列表
 */
export async function processMessagesForReasoner(
  messages: BaseMessage[], 
  isReasoner: boolean = false
): Promise<BaseMessage[]> {
  // 如果不是 reasoner 模型，直接返回原消息
  if (!isReasoner) {
    return messages;
  }

  const processedMessages: BaseMessage[] = [];
  let lastMessageType: string | null = null;

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const currentType = message instanceof HumanMessage ? 'human' :
      message instanceof AIMessage ? 'ai' :
        message instanceof SystemMessage ? 'system' : 'unknown';

    if (currentType === 'system') {
      processedMessages.push(message);
      continue;
    }

    if (lastMessageType === currentType && (currentType === 'human' || currentType === 'ai')) {
      if (currentType === 'human') {
        processedMessages.push(new AIMessage({ content: "" }));
        console.log('发现连续的用户消息，添加空的AI消息进行分隔');
      } else if (currentType === 'ai') {
        processedMessages.push(new HumanMessage({ content: "Please continue." }));
        console.log('发现连续的AI消息，添加用户提示消息进行分隔');
      }
    }

    processedMessages.push(message);
    lastMessageType = currentType;
  }

  const lastMessage = processedMessages[processedMessages.length - 1];
  if (lastMessage instanceof AIMessage) {
    console.log('最后一条消息是AI消息，添加一个用户提示消息');
    processedMessages.push(new HumanMessage({ content: "Please continue." }));
  }

  return processedMessages;
}
