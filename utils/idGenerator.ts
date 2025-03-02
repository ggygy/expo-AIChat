/**
 * 生成随机ID字符串
 * @param length ID长度，默认为8
 * @returns 随机字符串
 */
export function getRandomId(length: number = 8): string {
  return Math.random().toString(36).substring(2, 2 + length);
}

/**
 * 生成带前缀的唯一ID
 * @param prefix ID前缀
 * @returns 带时间戳和随机字符串的唯一ID
 */
export function generateUniqueId(prefix: string): string {
  const timestamp = Date.now();
  const random = getRandomId(6);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * 生成用户消息ID
 * @returns 用户消息ID
 */
export function generateUserMessageId(): string {
  return generateUniqueId('user');
}

/**
 * 生成助手消息ID
 * @returns 助手消息ID
 */
export function generateAssistantMessageId(): string {
  return generateUniqueId('assistant');
}

/**
 * 生成系统消息ID
 * @returns 系统消息ID
 */
export function generateSystemMessageId(): string {
  return generateUniqueId('system');
}
