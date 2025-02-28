export type ErrorType = 
  | 'insufficient_balance'
  | 'rate_limit_exceeded'
  | 'invalid_api_key'
  | 'network_error'
  | 'server_error'
  | 'timeout'
  | 'unknown';

/**
 * 根据错误信息确定错误类型
 */
export function getErrorType(error: any): ErrorType {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // 检查余额不足错误
  if (errorMessage.includes('402') && errorMessage.includes('Insufficient Balance')) {
    return 'insufficient_balance';
  }
  
  // 检查 API 密钥错误
  if (errorMessage.includes('401') || errorMessage.includes('API key')) {
    return 'invalid_api_key';
  }
  
  // 检查频率限制错误
  if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
    return 'rate_limit_exceeded';
  }
  
  // 检查网络错误
  if (
    errorMessage.includes('network') || 
    errorMessage.includes('ECONNREFUSED') || 
    errorMessage.includes('fetch')
  ) {
    return 'network_error';
  }
  
  // 检查服务器错误
  if (errorMessage.includes('5') && /^5\d{2}/.test(errorMessage.substring(0, 3))) {
    return 'server_error';
  }
  
  // 检查超时
  if (errorMessage.includes('timeout')) {
    return 'timeout';
  }
  
  return 'unknown';
}

/**
 * 根据错误类型获取友好的错误消息
 */
export function getErrorMessage(errorType: ErrorType): string {
  switch (errorType) {
    case 'insufficient_balance':
      return '账户余额不足，请充值后再试';
    case 'invalid_api_key':
      return 'API 密钥无效或已过期';
    case 'rate_limit_exceeded':
      return '请求频率超限，请稍后再试';
    case 'network_error':
      return '网络连接错误，请检查您的网络';
    case 'server_error':
      return '服务器错误，请稍后再试';
    case 'timeout':
      return '请求超时，请稍后再试';
    case 'unknown':
    default:
      return '未知错误，请稍后再试';
  }
}
