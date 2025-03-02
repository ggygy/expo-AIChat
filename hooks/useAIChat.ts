import { useState, useCallback, useEffect, useRef } from 'react';
import { ContentType, Message, MessageType } from '@/constants/chat';
import { useBotStore } from '@/store/useBotStore';
import { useProviderStore } from '@/store/useProviderStore';
import { messageDb } from '@/database';
import { ProviderFactory } from '@/provider/ProviderFactory';
import { ModelProviderId } from '@/constants/ModelProviders';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import i18n from '@/i18n/i18n';
import { processChunk, enhanceSystemPrompt } from '@/utils/chunkProcessor';

type MessageUpdateCallback = (messages: Message[]) => void;
// 定义消息状态的类型以确保类型安全
type MessageStatus = 'sending' | 'streaming' | 'sent' | 'error';

export function useAIChat(botId: string) {
  const [isGenerating, setIsGenerating] = useState(false);
  // 使用ref来跟踪生成状态，确保异步操作可以访问到最新的状态值
  const isGeneratingRef = useRef(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const getBotInfo = useBotStore(state => state.getBotInfo);
  const { providers } = useProviderStore();
  
  // 使用ref来控制更新频率
  const lastUpdateTimeRef = useRef<number>(0);
  const pendingUpdateRef = useRef<{messages: Message[], callback: MessageUpdateCallback} | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // 更新 isGenerating 状态时，同时更新 ref
  useEffect(() => {
    isGeneratingRef.current = isGenerating;
  }, [isGenerating]);
  
  // 清理函数
  useEffect(() => {
    return () => {
      if (abortController) {
        abortController.abort();
      }
      
      // 清理任何剩余的定时器
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    };
  }, [abortController]);

  // 使用节流方式更新UI，确保UI保持响应
  const scheduleUiUpdate = useCallback((messages: Message[], callback: MessageUpdateCallback) => {
    const now = Date.now();
    // 存储最新的消息
    pendingUpdateRef.current = { messages, callback };
    
    // 如果没有定时器在运行，则创建一个
    if (!updateIntervalRef.current) {
      updateIntervalRef.current = setInterval(() => {
        // 如果有待更新的消息，则执行更新
        if (pendingUpdateRef.current) {
          const { messages, callback } = pendingUpdateRef.current;
          callback(messages);
          lastUpdateTimeRef.current = Date.now();
          pendingUpdateRef.current = null;
        } else {
          // 如果没有待更新的消息，清除定时器
          if (updateIntervalRef.current) {
            clearInterval(updateIntervalRef.current);
            updateIntervalRef.current = null;
          }
        }
      }, 50); // 每50毫秒检查一次是否有更新，这个值可以根据需要调整
    }
    
    // 如果距离上次更新时间超过100ms，立即执行一次更新
    if (now - lastUpdateTimeRef.current > 100) {
      callback(messages);
      lastUpdateTimeRef.current = now;
      pendingUpdateRef.current = null;
    }
  }, []);

  const sendMessage = useCallback(
    async (userMessage: Message, onUpdate: MessageUpdateCallback) => {
      try {
        const botInfo = getBotInfo(botId);
        if (!botInfo) {
          throw new Error('Bot configuration not found');
        }

        // 获取提供商配置
        const provider = providers.find(p => p.id === botInfo.providerId);
        if (!provider) {
          throw new Error('Provider not found');
        }

        // 确保用户消息 ID 唯一
        const userMessageId = userMessage.id || `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const userMsg = {
          ...userMessage,
          id: userMessageId
        };

        // 准备 AI 助手的回复消息 - 指定 markdown 类型并初始化思考内容
        const assistantMessageId = `assistant_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const assistantMessage: Message = {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          thinkingContent: '', // 初始化思考内容
          isThinkingExpanded: true, // 默认展开思考内容
          timestamp: Date.now(),
          contentType: 'markdown', // 将内容类型设置为 markdown
          status: 'streaming' as MessageStatus
        };

        try {
          // 保存用户消息到数据库 - 确保先保存用户消息
          const userSaveResult = await messageDb.addMessage(botId, userMsg);
          if (!userSaveResult.success && !userSaveResult.skipped) {
            console.error('保存用户消息失败:', userSaveResult.error);
          }
          
          // 保存助手消息到数据库
          const assistantSaveResult = await messageDb.addMessage(botId, assistantMessage);
          if (!assistantSaveResult.success && !assistantSaveResult.skipped) {
            console.error('保存助手消息失败:', assistantSaveResult.error);
          }
        } catch (dbError) {
          console.error('保存消息到数据库时出错:', dbError);
          // 即使数据库保存失败，我们仍然继续处理对话
        }
        
        // 更新消息列表 - 确保用户消息在前，助手消息在后
        onUpdate([userMsg, assistantMessage]);

        // 创建中止控制器
        const controller = new AbortController();
        setAbortController(controller);
        
        // 标记为正在生成
        setIsGenerating(true);
        isGeneratingRef.current = true; // 直接设置 ref 确保立即生效

        // 获取聊天历史
        let chatHistory = await messageDb.getMessages(botId, 50, 0);
        
        // 应用 maxContextLength 限制 - 仅保留最近的N轮对话
        if (botInfo.maxContextLength && botInfo.maxContextLength > 0) {
          // 一轮对话通常包含一条用户消息和一条助手回复
          // 因此需要计算需要保留的消息数量
          const maxMessages = botInfo.maxContextLength * 2;
          if (chatHistory.length > maxMessages) {
            console.log(`应用上下文长度限制: ${botInfo.maxContextLength}轮，保留最近的${maxMessages}条消息`);
            chatHistory = chatHistory.slice(-maxMessages);
          }
        }
        
        // 确保消息按时间顺序排序
        chatHistory.sort((a, b) => a.timestamp - b.timestamp);
        
        // 转换消息为 Langchain 消息格式
        const langchainMessages = chatHistory.map(msg => {
          switch (msg.role) {
            case 'user':
              return new HumanMessage({ content: msg.content });
            case 'assistant':
              return new AIMessage({ content: msg.content });
            case 'system':
              return new SystemMessage({ content: msg.content });
            default:
              return new HumanMessage({ content: msg.content });
          }
        });
        
        // 考虑系统提示
        if (botInfo.systemPrompt && !langchainMessages.some(msg => msg instanceof SystemMessage)) {
          const systemMessage = new SystemMessage({ content: botInfo.systemPrompt });
          langchainMessages.unshift(systemMessage);
        }

        // 创建模型提供商实例
        const modelProvider = ProviderFactory.createProvider(botInfo.providerId as ModelProviderId);
        if (!modelProvider) {
          throw new Error(`Unsupported provider: ${botInfo.providerId}`);
        }

        // 使用 enhanceSystemPrompt 工具函数增强系统提示
        const finalSystemPrompt = enhanceSystemPrompt(
          botInfo.systemPrompt || '', 
          botInfo.chainOfThought || 0
        );

        // 初始化模型
        modelProvider.initialize({
          vendor: botInfo.providerId as any,
          modelName: botInfo.modelId,
          apiKey: provider.apiKey,
          baseUrl: provider.baseUrl,
          temperature: botInfo.temperature,
          maxTokens: botInfo.enableMaxTokens ? botInfo.maxTokens : undefined,
          topP: botInfo.topP,
          streamOutput: botInfo.streamOutput,
          systemPrompt: finalSystemPrompt // 使用增强后的系统提示
        });

        // 如果支持流式输出
        if (botInfo.streamOutput) {
          let content = '';
          let thinkingContent = ''; // 单独存储思考内容
          let lastSaveLength = 0;
          let lastThinkingLength = 0;
          let totalTokens = 0;
          let promptTokens = 0;
          let completionTokens = 0;
          
          // 数据库更新的计时器
          let dbUpdateTimeout: NodeJS.Timeout | null = null;
          
          // 创建一个函数来处理数据库更新，避免频繁IO操作
          const scheduleDbUpdate = (content: string, thinkingContent: string, status: MessageStatus, tokenInfo?: any) => {
            if (dbUpdateTimeout) {
              clearTimeout(dbUpdateTimeout);
            }
            
            dbUpdateTimeout = setTimeout(() => {
              messageDb.updateMessageWithThinking(
                assistantMessage.id, 
                content,
                thinkingContent,
                status, 
                'markdown',
                tokenInfo
              ).catch(error => {
                console.error('保存内容到数据库失败:', error);
              });
              dbUpdateTimeout = null;
            }, 200); // 延迟200ms，减少数据库写入频率
          };
          
          const stream = await modelProvider.stream(langchainMessages);
          
          try {
            for await (const chunk of stream) {
              // 检查是否已中止生成
              if (!isGeneratingRef.current) {
                console.log('流式生成被中止');
                break;
              }
              
              // 使用修改后的 processChunk 处理 chunk，同时更新两种内容
              const processedChunk = processChunk(
                chunk, 
                content, 
                thinkingContent,
                {
                  total_tokens: totalTokens,
                  prompt_tokens: promptTokens,
                  completion_tokens: completionTokens
                }
              );
              
              // 提取处理后的内容
              content = processedChunk.content || content;
              thinkingContent = processedChunk.thinkingContent || thinkingContent;
              
              // 更新 token 计数
              if (processedChunk.tokenUsage) {
                totalTokens = processedChunk.tokenUsage.total_tokens || totalTokens;
                promptTokens = processedChunk.tokenUsage.prompt_tokens || promptTokens;
                completionTokens = processedChunk.tokenUsage.completion_tokens || completionTokens;
              }
              
              if (content !== '' || thinkingContent !== '') {
                // 更新助手消息，同时包含两种内容
                const updatedAssistantMessage = {
                  ...assistantMessage,
                  content: content,
                  thinkingContent: thinkingContent,
                  contentType: 'markdown' as ContentType,
                  tokenUsage: totalTokens > 0 ? {
                    total_tokens: totalTokens,
                    prompt_tokens: promptTokens,
                    completion_tokens: completionTokens
                  } : undefined
                };
                
                // 使用节流更新UI，确保不会阻塞
                scheduleUiUpdate([userMsg, updatedAssistantMessage], onUpdate);
                
                // 定期保存内容到数据库
                const contentChanged = content.length - lastSaveLength > 100;
                const thinkingChanged = thinkingContent.length - lastThinkingLength > 100;
                
                if (contentChanged || thinkingChanged) {
                  // 记录当前长度，避免重复保存相同内容
                  lastSaveLength = content.length;
                  lastThinkingLength = thinkingContent.length;
                  
                  // 使用定时器延迟数据库更新，避免频繁IO
                  const tokenInfo = totalTokens > 0 ? {
                    total_tokens: totalTokens,
                    prompt_tokens: promptTokens,
                    completion_tokens: completionTokens
                  } : undefined;
                  
                  // 计划数据库更新，不阻塞UI
                  scheduleDbUpdate(content, thinkingContent, 'streaming', tokenInfo);
                }
              }
              
              // 添加一个延时，让UI线程有机会执行其他操作
              // 这样可以确保按钮点击等交互能够被处理
              if (content.length % 20 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
              }
            }
          } catch (error) {
            console.error('流式生成错误:', error);
            if (isGeneratingRef.current) { // 只有在未主动中止时才视为错误
              throw error;
            }
          }

          // 取消任何待处理的数据库更新
          if (dbUpdateTimeout) {
            clearTimeout(dbUpdateTimeout);
            dbUpdateTimeout = null;
          }

          // 构建token使用信息对象
          const tokenInfo = totalTokens > 0 ? {
            total_tokens: totalTokens,
            prompt_tokens: promptTokens,
            completion_tokens: completionTokens
          } : undefined;
          
          try {
            // 保存最终消息，包括思考内容
            console.log(`保存完整内容: 内容=${content.length}字符, 思考=${thinkingContent.length}字符, tokens=${totalTokens}`);
            await messageDb.updateMessageWithThinking(
              assistantMessage.id, 
              content,
              thinkingContent, 
              'sent', 
              'markdown',
              tokenInfo
            );
          } catch (updateError) {
            console.error('更新消息内容失败:', updateError);
            // 即使更新失败，我们仍然继续更新UI
          }
          
          // 更新最终消息，包含两种内容
          const finalAssistantMessage: Message = {
            ...assistantMessage,
            content: content,
            thinkingContent: thinkingContent,
            contentType: 'markdown',
            status: 'sent' as MessageStatus,
            tokenUsage: tokenInfo
          };
          
          // 最后一次更新 UI
          onUpdate([userMessage, finalAssistantMessage]);
          
          // 清理任何剩余的定时器
          if (updateIntervalRef.current) {
            clearInterval(updateIntervalRef.current);
            updateIntervalRef.current = null;
          }
        } else {
          // 非流式输出
          const response = await modelProvider.chat(langchainMessages);
          console.log(`获取到非流式响应: ${response.length} 字符`);

          // 保存完整响应到数据库
          try {
            await messageDb.updateMessageContent(
              assistantMessage.id, 
              response, 
              'sent', 
              'markdown' // 传递内容类型
            );
          } catch (updateError) {
            console.error('更新非流式消息内容失败:', updateError);
            // 即使更新失败，我们仍然继续更新UI
          }
          
          // 更新助手消息
          const updatedAssistantMessage: Message = {
            ...assistantMessage,
            content: response,
            contentType: 'markdown', // 确保类型不变
            status: 'sent' as MessageStatus
          };
          
          // 更新 UI
          onUpdate([userMessage, updatedAssistantMessage]);
        }
      } catch (error) {
        console.error('AI chat error:', error);
        
        // 创建错误消息
        const errorMessage: Message = {
          id: `error_${Date.now()}`,
          role: 'assistant',
          content: i18n.t('chat.errorResponse'), // 使用本地化文本
          timestamp: Date.now(),
          contentType: 'text',
          status: 'error' as MessageStatus,
          error: error instanceof Error 
            ? `${error.message} ${error.stack ? `\n${error.stack}` : ''}` 
            : i18n.t('common.unknownError')
        };
        
        // 保存错误消息
        await messageDb.addMessage(botId, errorMessage);
        
        // 更新 UI
        onUpdate([userMessage, errorMessage]);
        
        throw error;
      } finally {
        // 重置生成状态和中止控制器
        setIsGenerating(false);
        isGeneratingRef.current = false;
        setAbortController(null);
        
        // 清理定时器
        if (updateIntervalRef.current) {
          clearInterval(updateIntervalRef.current);
          updateIntervalRef.current = null;
        }
      }
    },
    [botId, providers, getBotInfo, scheduleUiUpdate]
  );

  // 封装设置生成状态的函数，同时更新ref
  const setGeneratingState = useCallback((state: boolean) => {
    setIsGenerating(state);
    isGeneratingRef.current = state;
  }, []);

  return {
    sendMessage,
    isGenerating,
    setIsGenerating: setGeneratingState,
  };
}
