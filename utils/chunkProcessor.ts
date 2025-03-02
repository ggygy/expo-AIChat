import { MessageType } from '@/constants/chat';

// 定义 token 使用信息类型
export interface TokenUsage {
  total_tokens?: number;
  prompt_tokens?: number;
  completion_tokens?: number;
}

// 修改处理 chunk 后的结果类型，添加思考内容
export interface ProcessedChunk {
  content: string;
  thinkingContent?: string; // 新增：思考内容
  messageType: MessageType;
  tokenUsage?: TokenUsage;
}

/**
 * 处理 AI 模型返回的流式响应 chunk
 * @param chunk 从 AI 模型返回的原始 chunk 数据
 * @param currentContent 当前消息内容
 * @param currentThinking 当前思考内容
 * @param currentTokens 当前的 token 计数器
 * @returns 处理后的 chunk 内容、思考内容和更新后的 token 信息
 */
export function processChunk(
  chunk: any, 
  currentContent: string = '',
  currentThinking: string = '',
  currentTokens: TokenUsage = {}
): ProcessedChunk {
  let chunkContent: string | undefined;
  let chunkType: MessageType = 'normal';
  let totalTokens = currentTokens.total_tokens || 0;
  let promptTokens = currentTokens.prompt_tokens || 0;
  let completionTokens = currentTokens.completion_tokens || 0;
  
  // 尝试从chunk中提取tokens信息
  if (chunk.response_metadata?.tokenUsage) {
    const { total_tokens, prompt_tokens, completion_tokens } = chunk.response_metadata.tokenUsage;
    if (total_tokens) totalTokens = total_tokens;
    if (prompt_tokens) promptTokens = prompt_tokens;
    if (completion_tokens) completionTokens = completion_tokens;
    console.log(`Token使用情况更新: 总计=${total_tokens}, 提示=${prompt_tokens}, 完成=${completion_tokens}`);
  }
  
  // 处理常规内容
  if (typeof chunk.content === 'string') {
    chunkContent = chunk.content;
  } 
  
  // 处理思考过程 - 检查additional_kwargs.reasoning_content
  let thinkingContent = '';
  if (chunk.additional_kwargs?.reasoning_content) {
    // 发现推理内容，设置为思考类型
    chunkType = 'thinking';
    thinkingContent = chunk.additional_kwargs.reasoning_content;
    console.log('检测到推理内容:', thinkingContent.substring(0, 20) + '...');
  } 
  
  // 处理其他格式的消息数据
  if (!chunkContent && !thinkingContent && chunk.content && typeof chunk.content === 'object') {
    try {
      // 移除可能导致类型警告的字段
      const cleanChunk = { ...chunk };
      if (cleanChunk.hasOwnProperty('total_tokens')) {
        totalTokens = Number(cleanChunk.total_tokens) || 0;
        delete cleanChunk.total_tokens;
      }
      if (cleanChunk.hasOwnProperty('completion_tokens')) {
        completionTokens = Number(cleanChunk.completion_tokens) || 0;
        delete cleanChunk.completion_tokens;
      }
      if (cleanChunk.hasOwnProperty('prompt_tokens')) {
        promptTokens = Number(cleanChunk.prompt_tokens) || 0;
        delete cleanChunk.prompt_tokens;
      }
      
      // 检查特殊格式的消息块
      if (typeof cleanChunk.content === 'object' && cleanChunk.content !== null) {
        // 处理 {"content":"内容", "type":"text"} 和 {"content":"内容", "type":"thinking"} 格式
        if ('content' in cleanChunk.content && 'type' in cleanChunk.content) {
          const contentType = cleanChunk.content.type;
          const contentText = String(cleanChunk.content.content || '');
          
          if (contentType === 'thinking') {
            thinkingContent = contentText;
          } else {
            chunkContent = contentText;
          }
        } else if ('text' in cleanChunk.content) {
          chunkContent = String(cleanChunk.content.text);
        } else if ('reasoning' in cleanChunk.content) {
          // 也处理直接包含reasoning字段的情况
          thinkingContent = String(cleanChunk.content.reasoning);
        } else {
          // 降级为JSON字符串
          chunkContent = JSON.stringify(cleanChunk.content);
        }
      } else {
        chunkContent = String(cleanChunk.content);
      }
    } catch (e) {
      console.warn('处理流式响应块失败:', e);
      chunkContent = String(chunk.content) || '';
    }
  }
  
  // 更新内容，将新块追加到现有内容
  const updatedContent = chunkContent ? currentContent + chunkContent : currentContent;
  const updatedThinking = thinkingContent ? currentThinking + thinkingContent : currentThinking;
  
  return {
    content: updatedContent,
    thinkingContent: updatedThinking || undefined,
    messageType: 'normal', // 总是返回normal类型，思考内容由thinkingContent字段表示
    tokenUsage: {
      total_tokens: totalTokens,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens
    }
  };
}

/**
 * 增强系统提示以支持思维链功能
 * @param systemPrompt 原始系统提示
 * @param chainOfThoughtLevel 思维链级别 (0-3)
 * @returns 增强后的系统提示
 */
export function enhanceSystemPrompt(systemPrompt: string, chainOfThoughtLevel: number): string {
  if (!chainOfThoughtLevel || chainOfThoughtLevel <= 0) {
    return systemPrompt;
  }
  
  let finalSystemPrompt = systemPrompt || '';
  
  // 根据 chainOfThought 级别添加相应的提示语
  switch (chainOfThoughtLevel) {
    case 1: // 基础思考能力
      finalSystemPrompt += finalSystemPrompt ? '\n\n' : '';
      finalSystemPrompt += '当遇到复杂问题时，请先分步骤思考，然后再给出最终答案。';
      break;
    case 2: // 增强思考能力
      finalSystemPrompt += finalSystemPrompt ? '\n\n' : '';
      finalSystemPrompt += '请使用以下格式回答需要深入思考的问题：\n' + 
                          '思考: [这里写你的分析过程，包括步骤和逻辑推导]\n' +
                          '回答: [这里写你的最终答案]';
      break;
    case 3: // 专家思考能力
      finalSystemPrompt += finalSystemPrompt ? '\n\n' : '';
      finalSystemPrompt += '你是一位擅长批判性思维的专家。对于复杂问题，请使用以下思考框架：\n' +
                          '1. 问题分析: 确定真正需要解决的问题\n' +
                          '2. 思考路径: 列出所有可能的解决方案\n' + 
                          '3. 分析评估: 评估每个方案的优缺点\n' +
                          '4. 结论: 给出最合适的答案并解释原因';
      break;
  }
  
  console.log(`应用思维链级别 ${chainOfThoughtLevel}: 系统提示已增强`);
  return finalSystemPrompt;
}
