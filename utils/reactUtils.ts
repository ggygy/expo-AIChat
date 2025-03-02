import { useCallback, useRef, useEffect } from 'react';

/**
 * 用于安全地在异步函数中更新状态的工具函数
 * 避免在组件卸载后继续更新状态导致的内存泄漏和警告
 */
export function useIsMounted() {
  const isMountedRef = useRef(false);
  
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  return useCallback(() => isMountedRef.current, []);
}

/**
 * 用于防抖执行函数的hook
 */
export function useDebounce(func: (...args: any[]) => void, delay: number) {
  const timer = useRef<NodeJS.Timeout | null>(null);
  
  const debouncedFunction = useCallback(
    (...args: any[]) => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
      
      timer.current = setTimeout(() => {
        func(...args);
      }, delay);
    },
    [func, delay]
  );
  
  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, []);
  
  return debouncedFunction;
}

/**
 * 用于安全地获取状态更新函数，避免在组件卸载后调用
 */
export function useSafeState<T>(setState: React.Dispatch<React.SetStateAction<T>>) {
  const isMounted = useIsMounted();
  
  return useCallback(
    (value: React.SetStateAction<T>) => {
      if (isMounted()) {
        setState(value);
        // 请求重绘以确保状态更新反映在UI上
        requestAnimationFrame(() => {});
      }
    },
    [isMounted, setState]
  );
}
