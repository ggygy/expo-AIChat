import { fetch as fetchPolyfill } from 'react-native-fetch-api';

/**
 * 为 LangChain 创建的 fetch 适配器，支持 SSE 流式响应
 * 
 * LangChain 使用自定义的 fetch 方法进行 API 请求，但在 React Native 环境中
 * 默认的 fetch 不能正确处理 SSE 流。此适配器使用 react-native-fetch-api
 * 来确保流式请求正常工作。
 */
export const langchainFetchAdapter = (input: RequestInfo | URL, init?: RequestInit) => {
  // 确保配置中启用了文本流
  const enhancedInit = {
    ...init,
    reactNative: {
      textStreaming: true,
      ...((init as any)?.reactNative || {})
    }
  };
  
  // 使用增强的 polyfill fetch 发送请求
  return fetchPolyfill(input, enhancedInit);
};

/**
 * 配置全局变量，使 LangChain 使用我们的适配器
 */
export function configureLangChainFetch() {
  // 设置全局变量，LangChain 会检查这个变量
  if (typeof globalThis !== 'undefined') {
    // @ts-ignore - LangChain 内部会检查这个属性
    globalThis.fetch = langchainFetchAdapter;
    console.log('已配置 LangChain fetch 适配器');
  } else {
    console.warn('无法设置全局 fetch，LangChain 可能无法正常工作');
  }
}

/**
 * 为 LangChain 创建特定的请求处理器
 * 可以在初始化 LangChain 模型时通过 configuration 传入
 */
export const langchainFetchOptions = {
  fetch: langchainFetchAdapter
};
