import { useCallback, useRef } from 'react';
import { ContentType, Message } from '@/constants/chat';
import { messageDb } from '@/database';
import { IModelProvider } from '@/provider/BaseProvider';
import { extractToolCallsFromProvider } from './chat/useStreamProcessor';

type MessageStatus = 'sending' | 'streaming' | 'sent' | 'error';
type MessageUpdateCallback = (messages: Message[]) => void;

/**
 * 专门处理非流式聊天响应
 */
export function useChatProcessor(
  botId: string,
  scheduleUiUpdate: (messages: Message[], callback: MessageUpdateCallback) => void
) {
  // 手动停止的引用变量
  const isStoppedManuallyRef = useRef(false);
  
  /**
   * 处理非流式响应
   */
  const processNonStreamResponse = useCallback(async (
    response: any,
    userMsg: Message,
    assistantMessage: Message,
    onUpdate: MessageUpdateCallback,
    modelProvider?: IModelProvider
  ) => {
    console.log(`开始处理非流式响应: ${typeof response === 'string' ? response.length : '非字符串'} 字符`);
    
    // 立即更新UI显示"思考中"状态
    onUpdate([userMsg, {
      ...assistantMessage,
      content: '处理响应中...',
      status: 'streaming' as MessageStatus,
    }]);
    
    // 提取响应内容和思考内容
    let content = '';
    let thinkingContent = '';
    
    // 尝试提取思考内容
    const extractThinking = (text: string): { content: string; thinking: string } => {
      // 尝试匹配 <thinking>...</thinking> 标签
      const thinkingMatch = text.match(/<thinking>([\s\S]*?)<\/thinking>/);
      
      if (thinkingMatch) {
        // 提取思考内容并从主内容中移除
        const thinking = thinkingMatch[1].trim();
        const cleanContent = text.replace(/<thinking>[\s\S]*?<\/thinking>/g, '').trim();
        return { content: cleanContent, thinking };
      }
      
      // 尝试匹配 ```thinking ... ``` 格式
      const codeBlockMatch = text.match(/```thinking\s*([\s\S]*?)\s*```/);
      
      if (codeBlockMatch) {
        // 提取思考内容并从主内容中移除
        const thinking = codeBlockMatch[1].trim();
        const cleanContent = text.replace(/```thinking\s*[\s\S]*?\s*```/g, '').trim();
        return { content: cleanContent, thinking };
      }
      
      return { content: text, thinking: '' };
    };
    
    if (typeof response === 'string') {
      // 字符串响应，提取思考内容
      const { content: extractedContent, thinking } = extractThinking(response);
      content = extractedContent;
      thinkingContent = thinking;
    } else if (response && typeof response === 'object') {
      // 如果是对象（如AIMessageChunk）
      if ('content' in response) {
        // 提取content属性
        const rawContent = typeof response.content === 'string' 
          ? response.content 
          : JSON.stringify(response.content);
          
        // 从内容中提取思考内容
        const { content: extractedContent, thinking } = extractThinking(rawContent);
        content = extractedContent;
        thinkingContent = thinking;
        
        // 如果对象中有专门的thinking属性，优先使用
        if ('thinking' in response && response.thinking) {
          thinkingContent = typeof response.thinking === 'string'
            ? response.thinking
            : JSON.stringify(response.thinking);
        }
      } else {
        // 没有明确结构，转为JSON字符串
        content = JSON.stringify(response);
      }
    } else {
      // 其他类型转为字符串
      content = String(response);
    }
    
    console.log(`提取出响应内容: ${content.length} 字符`);
    if (thinkingContent) {
      console.log(`提取出思考内容: ${thinkingContent.length} 字符`);
    }
    
    // 短暂延迟，确保UI能够显示中间状态
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 从提供者获取工具调用信息
    let toolCalls: any[] | undefined = undefined;
    let invalidToolCalls: any[] | undefined = undefined;
    
    if (modelProvider) {
      const toolCallsInfo = extractToolCallsFromProvider(modelProvider);
      toolCalls = toolCallsInfo.toolCalls;
      invalidToolCalls = toolCallsInfo.invalidToolCalls;
      
      console.log(`从模型提供者获取工具调用信息: ${toolCalls?.length || 0} 个有效调用, ${invalidToolCalls?.length || 0} 个无效调用`);
    }
    
    // 保存最终消息到数据库
    try {
      console.log(`保存非流式响应到数据库: ${content.length} 字符${thinkingContent ? ', 思考内容: ' + thinkingContent.length + ' 字符' : ''}`);
      await messageDb.updateMessageWithThinking(
        assistantMessage.id, 
        content,
        thinkingContent, // 保存提取出的思考内容
        'sent', 
        'markdown',
        undefined, // 非流式响应通常没有token信息
        { toolCalls } // 传递工具调用信息对象
      );
      console.log('非流式响应已保存到数据库');
    } catch (error) {
      console.error('保存非流式响应失败:', error);
    }
    
    // 创建最终消息对象
    const finalAssistantMessage: Message = {
      ...assistantMessage,
      content,
      contentType: 'markdown' as ContentType,
      status: 'sent',
      thinkingContent: thinkingContent || undefined,
      isThinkingExpanded: thinkingContent ? true : undefined,
      toolCalls: toolCalls,
      invalidToolCalls: invalidToolCalls
    };
    
    // 更新UI显示最终消息
    console.log('更新UI显示非流式响应');
    onUpdate([userMsg, finalAssistantMessage]);
    
    // 额外确保UI更新到最终状态
    setTimeout(() => {
      console.log('发送额外的最终UI更新');
      onUpdate([userMsg, finalAssistantMessage]);
    }, 200);
    
    return finalAssistantMessage;
  }, [botId, scheduleUiUpdate]);

  return {
    processNonStreamResponse,
    isStoppedManuallyRef
  };
}