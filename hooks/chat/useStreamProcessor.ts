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
    // 初始化变量，仅用于内容累积
    let content = '';
    let thinkingContent = '';
    let lastSaveLength = 0;
    let lastThinkingLength = 0;
    
    // 保存原始chunks以便在流结束时一次性处理元数据
    const chunksCollector: any[] = [];
    
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
      let uiUpdateCount = 0;
      let hasReceivedThinkingContent = false;
      
      for await (const chunk of stream) {
        // 将每个chunk保存起来，用于最后的元数据提取
        chunksCollector.push(chunk);
        
        // 检查是否已中止生成
        if (!isGeneratingRef.current) {
          console.log('流式生成被中止，将保存当前内容');
          break;
        }
        
        // 处理流式内容（只关注文本内容和思考内容的提取）
        const processedChunk = processChunk(
          chunk, 
          content, 
          thinkingContent,
          undefined // 不传递token信息，等最后一次性计算
        );
        
        // 只提取和更新文本内容
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
        
        // 减少日志输出频率
        if (content !== '' && content.length % 300 === 0) {
          console.log(`流式更新 #${++updateCount}: 内容长度=${content.length}`);
        }
        
        // 仅在内容确实变化时才更新UI和数据库
        if ((hasContentChanged || hasThinkingChanged) && (content !== '' || thinkingContent !== '')) {
          const now = Date.now();
          
          // 简化的消息对象，只包含文本内容
          const updatedAssistantMessage: Message = {
            ...assistantMessage,
            content,
            contentType: 'markdown' as ContentType,
            status: 'streaming' as MessageStatus,
            thinkingContent: thinkingContent || undefined,
            isThinkingExpanded: thinkingContent ? true : undefined
          };
          
          // 控制UI更新频率
          if (now - lastUiUpdateTime > 120) {
            scheduleUiUpdate([userMsg, updatedAssistantMessage], onUpdate);
            lastUiUpdateTime = now;
            uiUpdateCount++;
            
            if (uiUpdateCount % 10 === 0) {
              console.log(`已发送 ${uiUpdateCount} 次UI更新, 内容长度=${content.length}`);
            }
          }
          
          // 定期保存内容到数据库，仅当有显著变化时，且仅保存文本内容
          const contentChanged = content.length - lastSaveLength > 250;
          const thinkingChanged = thinkingContent.length - lastThinkingLength > 250;
          
          if (contentChanged || thinkingChanged) {
            lastSaveLength = content.length;
            lastThinkingLength = thinkingContent.length;
            
            scheduleDbUpdate(content, thinkingContent, 'streaming', undefined);
          }
        }
        
        // 添加一个延时，让UI线程有机会执行其他操作
        if (content.length % 50 === 0) {
          await new Promise(resolve => setTimeout(resolve, 50));
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

    console.log('流式生成结束，开始提取元数据...');
    console.log(`收集到 ${chunksCollector.length} 个数据块`);
    
    // 流结束后，一次性从所有chunks中提取完整元数据
    let totalTokens = 0;
    let promptTokens = 0;
    let completionTokens = 0;
    let toolCalls: any[] = [];
    let invalidToolCalls: any[] = [];
    let metadata: any = {};
    
    // 提取最后一个chunk或最高级别的token信息
    for (const chunk of chunksCollector) {
      // 处理每个chunk，但只关注元数据提取
      const processResult = processChunk(chunk, '', '', {
        total_tokens: totalTokens,
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens
      });
      
      // 记录最大的token值
      if (processResult.tokenUsage) {
        const { total_tokens, prompt_tokens, completion_tokens } = processResult.tokenUsage;
        if (total_tokens && total_tokens > totalTokens) totalTokens = total_tokens;
        if (prompt_tokens && prompt_tokens > promptTokens) promptTokens = prompt_tokens;
        if (completion_tokens && completion_tokens > completionTokens) completionTokens = completion_tokens;
      }
      
      // 合并工具调用（去重）
      if (processResult.toolCalls?.length) {
        for (const call of processResult.toolCalls) {
          if (!toolCalls.some(existing => 
              existing.id === call.id || JSON.stringify(existing) === JSON.stringify(call))) {
            toolCalls.push(call);
          }
        }
      }
      
      // 合并无效工具调用（去重）
      if (processResult.invalidToolCalls?.length) {
        for (const call of processResult.invalidToolCalls) {
          if (!invalidToolCalls.some(existing => JSON.stringify(existing) === JSON.stringify(call))) {
            invalidToolCalls.push(call);
          }
        }
      }
    }
    
    console.log(`完成元数据提取: tokens=${totalTokens}, 工具调用=${toolCalls.length}`);
    
    // 构建统一的token使用信息对象
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
    
    // 直接同步执行最终消息保存（包含所有元数据）
    console.log('开始保存最终消息（包含完整元数据）...');
    try {
      // 保存最终消息，包括思考内容和所有元数据
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
    
    // 最终消息包含所有元数据
    const finalAssistantMessage: Message = {
      ...assistantMessage,
      content,
      contentType: 'markdown' as ContentType,
      status: statusToSave,
      thinkingContent: thinkingContent || undefined,
      isThinkingExpanded: thinkingContent ? true : undefined,
      tokenUsage: tokenInfo,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      invalidToolCalls: invalidToolCalls.length > 0 ? invalidToolCalls : undefined,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined
    };
    
    console.log('流式生成完成，更新UI和保存最终内容');
    // 最后一次更新 UI - 使用包含所有元数据的最终消息
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
