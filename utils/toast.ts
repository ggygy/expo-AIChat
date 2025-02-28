import Toast from 'react-native-toast-message';
import i18n from '@/i18n/i18n';

/**
 * 显示成功提示
 * @param message 消息文本或本地化键
 * @param params 本地化参数
 */
export const showSuccess = (message: string, params?: Record<string, any>) => {
  const text = message.includes('.') ? i18n.t(message, params) : message;
  
  Toast.show({
    type: 'success',
    text1: i18n.t('common.success'),
    text2: text,
    visibilityTime: 2000,
    position: 'bottom'
  });
};

/**
 * 显示错误提示
 * @param message 消息文本或本地化键
 * @param params 本地化参数
 */
export const showError = (message: string, params?: Record<string, any>) => {
  const text = message.includes('.') ? i18n.t(message, params) : message;
  
  Toast.show({
    type: 'error',
    text1: i18n.t('common.error'),
    text2: text,
    visibilityTime: 3000,
    position: 'bottom'
  });
};

/**
 * 显示信息提示
 * @param message 消息文本或本地化键
 * @param params 本地化参数
 */
export const showInfo = (message: string, params?: Record<string, any>) => {
  const text = message.includes('.') ? i18n.t(message, params) : message;
  
  Toast.show({
    type: 'info',
    text1: i18n.t('common.info'),
    text2: text,
    visibilityTime: 2000,
    position: 'bottom'
  });
};

export default {
  showSuccess,
  showError,
  showInfo
};
