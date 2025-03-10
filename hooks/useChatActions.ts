import { useCallback } from 'react';
import { Message } from '@/constants/chat';
import { messageDb } from '@/database';
import { useAIChat } from '@/hooks/useAIChat';
import { useBotStore } from '@/store/useBotStore';
import i18n from '@/i18n/i18n';

// 定义消息状态的类型
type MessageStatus = 'sending' | 'streaming' | 'sent' | 'error';

export function useChatActions(
  chatId: string,
  messages: Message[],
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void,
  totalMessages: number,
  setTotalMessages: (count: number | ((prev: number) => number)) => void,
  addMessage?: (message: Message) => void // 新增可选参数
) {
  const { sendMessage, isGenerating, setIsGenerating } = useAIChat(chatId);
  const updateBotStats = useBotStore(state => state.updateBotStats);

  // 发送新消息
  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    
    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      contentType: 'text',
      status: 'sent'
    };
    
    try {
      // 立即添加用户消息并保存到数据库
      await messageDb.addMessage(chatId, userMessage);
      
      // 使用 addMessage 如果可用，否则回退到 setMessages
      if (addMessage) {
        addMessage(userMessage);
      } else {
        setMessages(prev => [...prev, userMessage]);
      }

      // 发送消息并处理响应
      await sendMessage(userMessage, async (updatedMessages) => {
        // 确保更新的消息中，用户消息和助手消息角色正确
        const validatedMessages = updatedMessages.map(msg => ({
          ...msg,
          role: msg.id === userMessage.id ? 'user' : 'assistant' as 'user' | 'assistant' | 'system'
        }));
        
        // 使用 addMessage 如果可用
        if (addMessage && validatedMessages.length > 0) {
          validatedMessages.forEach(msg => addMessage(msg));
        } else {
          // 原有逻辑
          setMessages(prev => {
            const filtered = prev.filter(msg => 
              !validatedMessages.find(m => m.id === msg.id)
            );
            return [...filtered, ...validatedMessages];
          });
        }
        
        // 更新消息总数和机器人统计
        const newTotal = totalMessages + 1;
        setTotalMessages(newTotal);
        
        if (validatedMessages.length > 0) {
          const botMessage = validatedMessages.find(m => m.role === 'assistant');
          if (botMessage) {
            updateBotStats(chatId, {
              messagesCount: newTotal,
              lastMessageAt: botMessage.timestamp,
              lastMessagePreview: botMessage.content.substring(0, 50) + (botMessage.content.length > 50 ? '...' : '')
            });
          }
        }
      });
      
      return true;
    } catch (error) {
      console.error('Failed to handle message:', error);
      return false;
    }
  }, [chatId, sendMessage, totalMessages, updateBotStats, setMessages, setTotalMessages, addMessage]);

  // 重试失败的消息
  const handleRetry = useCallback(async (messageId: string) => {
    const failedMessage = messages.find(m => m.id === messageId);
    if (!failedMessage) return false;
    
    // 找到前一条用户消息
    const userMessageIndex = messages.findIndex(m => m.id === messageId) - 1;
    if (userMessageIndex < 0) return false;
    
    const userMessage = messages[userMessageIndex];
    if (userMessage.role !== 'user') return false;
    
    // 更新消息状态为重试中
    await messageDb.updateMessageStatus(messageId, 'streaming');
    setMessages(prev => prev.map(m => 
      m.id === messageId ? {
        ...m, 
        status: 'streaming' as MessageStatus, 
        error: undefined
      } : m
    ));
    
    // 重新发送消息
    try {
      await sendMessage(userMessage, (updatedMessages) => {
        const validatedMessages = updatedMessages.map(msg => ({
          ...msg,
          role: msg.id === userMessage.id ? 'user' : 'assistant' as 'user' | 'assistant' | 'system'
        }));
        
        setMessages(prev => {
          const filtered = prev.filter(msg => 
            !validatedMessages.find(m => m.id === msg.id) && msg.id !== messageId
          );
          return [...filtered, ...validatedMessages];
        });
      });
      
      return true;
    } catch (error) {
      console.error('Retry failed:', error);
      await messageDb.updateMessageStatus(
        messageId, 
        'error', 
        error instanceof Error ? error.message : i18n.t('common.unknownError') // 使用本地化文本
      );
      setMessages(prev => prev.map(m => 
        m.id === messageId ? {
          ...m, 
          status: 'error' as MessageStatus, 
          error: error instanceof Error ? error.message : i18n.t('common.unknownError') // 使用本地化文本
        } : m
      ));
      return false;
    }
  }, [messages, sendMessage, setMessages]);

  // 停止生成 - 改进生成状态控制
  const handleStopGeneration = useCallback(() => {
    console.log('停止生成请求');
    setIsGenerating(false);
    // 查找当前正在生成的消息并将其状态更新为已发送
    const streamingMessage = messages.find(msg => msg.status === 'streaming');
    if (streamingMessage) {
      // 立即更新UI状态
      setMessages(prev => prev.map(m => 
        m.id === streamingMessage.id ? { ...m, status: 'sent' as MessageStatus } : m
      ));
      // 更新数据库状态
      messageDb.updateMessageStatus(streamingMessage.id, 'sent')
        .catch(err => console.error('更新消息状态失败:', err));
    }
  }, [setIsGenerating, messages, setMessages]);

  // 语音输入
  const handleVoiceInput = useCallback(() => {
    console.log('Voice input activated');
    // TODO: 实现语音输入逻辑
  }, []);

  // 文件上传
  const handleFileUpload = useCallback(() => {
    console.log('File upload triggered');
    // TODO: 实现文件上传逻辑
  }, []);

  return {
    handleSendMessage,
    handleRetry,
    handleStopGeneration,
    handleVoiceInput,
    handleFileUpload,
    isGenerating
  };
}
