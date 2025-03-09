import { useCallback, useRef } from 'react';
import { ContentType, Message } from '@/constants/chat';
import { messageDb } from '@/database';
import { processChunk } from '@/utils/chunkProcessor';

type MessageStatus = 'sending' | 'streaming' | 'sent' | 'error';
type MessageUpdateCallback = (messages: Message[]) => void;

export function useStreamProcessor(
  botId: string,
  scheduleUiUpdate: (messages: Message[], callback: MessageUpdateCallback) => void
) {
  // 手动停止的引用变量
  const isStoppedManuallyRef = useRef(false);
  
  // 处理流式响应
  const handleStreamResponse = useCallback(async (
    stream: AsyncIterable<any>,
    userMsg: Message,
    assistantMessage: Message,
    isGeneratingRef: { current: boolean },
    onUpdate: MessageUpdateCallback
  ) => {
    let content = '';
    let thinkingContent = '';
    let lastSaveLength = 0;
    let lastThinkingLength = 0;
    let totalTokens = 0;
    let promptTokens = 0;
    let completionTokens = 0;
    
    // 立即发送初始消息到UI，确保消息能立即显示
    console.log('流式响应开始：立即更新UI显示初始消息');
    onUpdate([userMsg, {
      ...assistantMessage,
      content: '思考中...' // 添加初始提示文本
    }]);
    
    // 数据库更新的计时器
    let dbUpdateTimeout: NodeJS.Timeout | null = null;
    
    // 创建一个函数来处理数据库更新，避免频繁IO操作
    const scheduleDbUpdate = (content: string, thinkingContent: string, status: MessageStatus, tokenInfo?: any) => {
      if (dbUpdateTimeout) {
        clearTimeout(dbUpdateTimeout);
      }
      
      dbUpdateTimeout = setTimeout(async () => {
        try {
          console.log(`计划保存内容: ${status}, 内容长度=${content.length}字符`);
          await messageDb.updateMessageWithThinking(
            assistantMessage.id, 
            content,
            thinkingContent,
            status, 
            'markdown',
            tokenInfo
          );
          
          if (status === 'sent') {
            console.log('最终状态消息已保存成功');
          }
        } catch (error) {
          console.error('保存内容到数据库失败:', error);
        } finally {
          dbUpdateTimeout = null;
        }
      }, 200); // 延迟200ms，减少数据库写入频率
    };
    
    try {
      let updateCount = 0;
      let lastUiUpdateTime = Date.now();
      
      // 添加UI更新计数，确保我们可以跟踪
      let uiUpdateCount = 0;
      
      // 正确初始化思考内容和内容
      let hasReceivedThinkingContent = false; // 跟踪是否收到了思考内容
      
      for await (const chunk of stream) {
        // 检查是否已中止生成
        if (!isGeneratingRef.current) {
          console.log('流式生成被中止，将保存当前内容');
          break;
        }
        
        // 处理chunk，更新内容
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
        const prevContentLength = content.length;
        const prevThinkingLength = thinkingContent.length;
        content = processedChunk.content || content;
        thinkingContent = processedChunk.thinkingContent || thinkingContent;
        
        // 检测内容是否有实际变化
        const hasContentChanged = content.length > prevContentLength;
        const hasThinkingChanged = thinkingContent.length > prevThinkingLength;
        
        if (hasThinkingChanged && !hasReceivedThinkingContent) {
          hasReceivedThinkingContent = true;
          console.log('首次接收到思考内容:', thinkingContent.substring(0, 30) + '...');
        }
        
        // 减少日志数量，只在特定条件记录
        if (content !== '' && content.length % 300 === 0) {
          console.log(`流式更新 #${++updateCount}: 内容长度=${content.length}`);
        }
        
        if ((content !== '' || thinkingContent !== '') && (hasContentChanged || hasThinkingChanged)) {
          const now = Date.now();
          // 更新助手消息，同时包含两种内容
          const updatedAssistantMessage = {
            ...assistantMessage,
            content: content,
            thinkingContent: thinkingContent,
            contentType: 'markdown' as ContentType,
            status: 'streaming' as MessageStatus,
            isThinkingExpanded: true, // 确保思考内容默认展开
            tokenUsage: totalTokens > 0 ? {
              total_tokens: totalTokens,
              prompt_tokens: promptTokens,
              completion_tokens: completionTokens
            } : undefined
          };
          
          // 控制UI更新频率，但确保不会太久不更新
          // 降低更新间隔，使得显示更加流畅
          if (now - lastUiUpdateTime > 120) {  // 降低到120ms
            scheduleUiUpdate([userMsg, updatedAssistantMessage], onUpdate);
            lastUiUpdateTime = now;
            uiUpdateCount++;
            
            if (uiUpdateCount % 10 === 0) {
              console.log(`已发送 ${uiUpdateCount} 次UI更新, 内容长度=${content.length}`);
            }
          }
          
          // 定期保存内容到数据库 - 增加思考内容变化的检测
          const contentChanged = content.length - lastSaveLength > 250;
          const thinkingChanged = thinkingContent.length - lastThinkingLength > 250;
          
          if (contentChanged || thinkingChanged) {
            // 记录当前长度，避免重复保存相同内容
            lastSaveLength = content.length;
            lastThinkingLength = thinkingContent.length;
            
            // 计划数据库更新
            const tokenInfo = totalTokens > 0 ? {
              total_tokens: totalTokens,
              prompt_tokens: promptTokens,
              completion_tokens: completionTokens
            } : undefined;
            
            scheduleDbUpdate(content, thinkingContent, 'streaming', tokenInfo);
          }
        }
        
        // 添加一个延时，让UI线程有机会执行其他操作
        if (content.length % 50 === 0) {
          await new Promise(resolve => setTimeout(resolve, 10));
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
    
    // 确保在流式生成停止时保存内容
    let statusToSave: MessageStatus = 'sent';
    
    // 如果是手动停止，使用特殊状态
    if (isStoppedManuallyRef.current) {
      console.log('手动停止生成，保存部分生成的内容');
      statusToSave = 'sent'; // 仍使用'sent'状态，保证UI显示正确
    }
    
    // 直接同步执行最终消息保存
    console.log('开始保存最终消息...');
    try {
      // 保存最终消息，包括思考内容
      console.log(`保存完整内容: 内容=${content.length}字符, 思考=${thinkingContent.length}字符, tokens=${totalTokens}`);
      await messageDb.updateMessageWithThinking(
        assistantMessage.id, 
        content,
        thinkingContent, 
        statusToSave, 
        'markdown',
        tokenInfo
      );
      
      console.log('最终消息保存成功，ID:', assistantMessage.id);
    } catch (updateError) {
      console.error('更新消息内容失败:', updateError);
    }
    
    // 更新最终消息，包含两种内容
    const finalAssistantMessage: Message = {
      ...assistantMessage,
      content: content,
      thinkingContent: thinkingContent,
      contentType: 'markdown' as ContentType, // 明确指定为ContentType类型
      status: statusToSave,
      isThinkingExpanded: true, // 确保思考内容默认展开
      tokenUsage: tokenInfo
    };
    
    console.log('流式生成完成，更新UI和保存最终内容');
    // 最后一次更新 UI - 使用正确的消息列表
    onUpdate([userMsg, finalAssistantMessage]);
    
    // 再发送一次最终更新，使用更长延时确保UI能正确显示完整内容
    setTimeout(() => {
      console.log('发送额外的最终UI更新');
      onUpdate([userMsg, finalAssistantMessage]);
    }, 500);
    
    return finalAssistantMessage;
  }, [botId, scheduleUiUpdate]);
  
  return {
    handleStreamResponse,
    isStoppedManuallyRef
  };
}
