import Toast from 'react-native-toast-message';
import i18n from '@/i18n/i18n';

/**
 * 判断字符串是否为 i18n 键格式
 * 格式应为："namespace.key" 或 "namespace.category.key"
 * @param message 要检查的字符串
 */
const isI18nKey = (message: string): boolean => {
  // 检查是否包含点号
  if (!message.includes('.')) return false;
  
  // 分割字符串，检查每个部分是否为有效的键名（不为空，只含字母、数字和下划线）
  const parts = message.split('.');
  
  // i18n 键至少包含两部分（namespace.key）
  if (parts.length < 2) return false;
  
  // 检查每个部分是否是有效的键名格式
  return parts.every(part => !!part && /^[a-zA-Z0-9_]+$/.test(part));
};

/**
 * 显示成功提示
 * @param message 消息文本或本地化键
 * @param params 本地化参数
 */
export const showSuccess = (message: string, params?: Record<string, any>) => {
  const text = isI18nKey(message) ? i18n.t(message, params) : message;
  
  Toast.show({
    type: 'success',
    text1: text,
    visibilityTime: 2000,
  });
};

/**
 * 显示错误提示
 * @param message 消息文本或本地化键
 * @param params 本地化参数
 */
export const showError = (message: string, params?: Record<string, any>) => {
  const text = isI18nKey(message) ? i18n.t(message, params) : message;
  
  Toast.show({
    type: 'error',
    text1: text,
    visibilityTime: 3000,
  });
};

/**
 * 显示信息提示
 * @param message 消息文本或本地化键
 * @param params 本地化参数
 */
export const showInfo = (message: string, params?: Record<string, any>) => {
  const text = isI18nKey(message) ? i18n.t(message, params) : message;
  
  Toast.show({
    type: 'info',
    text1: text,
    visibilityTime: 2000,
  });
};

export default {
  showSuccess,
  showError,
  showInfo
};
