/**
 * 调试工具函数
 */

/**
 * 打印消息内容，用于调试
 * @param message 要调试的消息对象
 */
export function debugMessageContent(message: any) {
  if (!message) {
    console.log('消息对象为空');
    return;
  }
  
  console.group('消息内容调试');
  console.log('消息ID:', message.id);
  console.log('角色:', message.role);
  console.log('内容长度:', message.content?.length || 0);
  console.log('思考内容长度:', message.thinkingContent?.length || 0);
  console.log('内容类型:', message.contentType);
  console.log('思考内容展开状态:', message.isThinkingExpanded);
  console.log('状态:', message.status);
  
  if (message.content) {
    console.log('内容前50个字符:', message.content.substring(0, 50) + '...');
  }
  
  if (message.thinkingContent) {
    console.log('思考内容前50个字符:', message.thinkingContent.substring(0, 50) + '...');
  }
  console.groupEnd();
}

/**
 * 调试思考内容的提取和处理
 * @param content 内容
 * @param thinkingContent 思考内容
 */
export function debugThinkingContent(content: string, thinkingContent: string) {
  console.group('思考内容处理');
  
  // 检查内容中是否包含思考相关标记
  const patterns = [
    '思考：', '思考:', 'Thinking:', '# 思考过程', 'Reasoning:'
  ];
  
  patterns.forEach(pattern => {
    const index = content.indexOf(pattern);
    if (index !== -1) {
      console.log(`在内容中发现 "${pattern}" 标记，位置: ${index}`);
    }
  });
  
  // 检查思考内容是否正确格式化
  if (thinkingContent) {
    const isFormatted = patterns.some(p => thinkingContent.includes(p));
    console.log('思考内容已格式化:', isFormatted);
    console.log('思考内容前50个字符:', thinkingContent.substring(0, 50) + '...');
  } else {
    console.log('没有思考内容');
  }
  
  console.groupEnd();
}
