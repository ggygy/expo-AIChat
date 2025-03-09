import { useCallback } from 'react';
import { ContentType, Message } from '@/constants/chat';
import { messageDb } from '@/database';
import i18n from '@/i18n/i18n';

type MessageStatus = 'sending' | 'streaming' | 'sent' | 'error';

export function useMessagePersistence(botId: string) {
  // 创建并持久化初始消息
  const persistMessages = useCallback(async (userMessage: Message) => {
    // 确保用户消息 ID 唯一
    const userMessageId = userMessage.id || `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const userMsg = {
      ...userMessage,
      id: userMessageId
    };

    // 准备 AI 助手的回复消息
    const assistantMessageId = `assistant_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      thinkingContent: '',
      isThinkingExpanded: true,
      timestamp: Date.now(),
      contentType: 'markdown' as ContentType,
      status: 'streaming' as MessageStatus
    };

    try {
      console.log('开始保存用户消息:', userMsg);
      // 先检查消息是否已存在
      const existingMessages = await messageDb.getMessages(botId, 1, 0);
      
      // 如果消息不存在，则保存
      if (existingMessages.length === 0) {
        console.log('保存用户消息到数据库...');
        const userSaveResult = await messageDb.addMessage(botId, userMsg);
        console.log('用户消息保存结果:', userSaveResult);
        if (!userSaveResult.success && !userSaveResult.skipped) {
          console.error('保存用户消息失败:', userSaveResult.error);
        } else {
          console.log('用户消息保存成功，ID:', userMsg.id);
        }
      } else {
        console.log('用户消息已存在，跳过保存');
      }
      
      // 保存助手消息到数据库
      console.log('保存助手消息到数据库...');
      const assistantSaveResult = await messageDb.addMessage(botId, assistantMessage);
      console.log('助手消息保存结果:', assistantSaveResult);
      if (!assistantSaveResult.success && !assistantSaveResult.skipped) {
        console.error('保存助手消息失败:', assistantSaveResult.error);
      } else {
        console.log('助手消息保存成功，ID:', assistantMessage.id);
      }
    } catch (dbError) {
      console.error('保存消息到数据库时出错:', dbError);
      // 即使数据库保存失败，我们仍然继续处理对话
    }
    
    return { userMsg, assistantMessage };
  }, [botId]);
  
  // 更新消息内容
  const updateMessageContent = useCallback(async (
    messageId: string, 
    content: string, 
    status: MessageStatus, 
    thinkingContent?: string, 
    tokenInfo?: any
  ) => {
    try {
      if (thinkingContent) {
        console.log(`保存完整内容: 内容=${content.length}字符, 思考=${thinkingContent.length}字符`);
        await messageDb.updateMessageWithThinking(
          messageId, content, thinkingContent, status, 'markdown', tokenInfo
        );
      } else {
        console.log(`保存完整内容: 内容=${content.length}字符`);
        await messageDb.updateMessageContent(messageId, content, status, 'markdown');
      }
      console.log('消息内容保存成功，ID:', messageId);
    } catch (error) {
      console.error('更新消息内容失败:', error);
    }
  }, []);
  
  // 保存错误消息
  const saveErrorMessage = useCallback(async (error: any, userMessage: Message) => {
    const errorMessage: Message = {
      id: `error_${Date.now()}`,
      role: 'assistant',
      content: i18n.t('chat.errorResponse'),
      timestamp: Date.now(),
      contentType: 'text' as ContentType,
      status: 'error' as MessageStatus,
      error: error instanceof Error 
        ? `${error.message} ${error.stack ? `\n${error.stack}` : ''}` 
        : i18n.t('common.unknownError')
    };
    
    // 保存错误消息
    try {
      await messageDb.addMessage(botId, errorMessage);
      console.log('错误消息保存成功');
    } catch (dbError) {
      console.error('保存错误消息失败:', dbError);
    }
    
    return errorMessage;
  }, [botId]);
  
  return {
    persistMessages,
    updateMessageContent,
    saveErrorMessage
  };
}
