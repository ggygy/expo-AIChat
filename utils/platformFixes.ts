import { Platform } from 'react-native';

/**
 * 判断当前环境是否需要特殊的滚动处理
 * 某些设备/平台组合可能需要特殊处理
 */
export function needsSpecialScrollHandling(): boolean {
  // iOS在某些情况下的FlashList滚动需要特殊处理
  if (Platform.OS === 'ios') {
    return true;
  }
  
  // 检查是否为特定Android版本
  if (Platform.OS === 'android' && Platform.Version < 24) {
    return true;
  }
  
  return false;
}

/**
 * 为滚动操作提供额外的延迟，基于平台调整滚动行为
 */
export function getScrollDelay(animated: boolean = true): number {
  // iOS需要更长延迟
  if (Platform.OS === 'ios') {
    return animated ? 300 : 500;
  }
  
  // Android默认延迟
  return animated ? 150 : 250;
}

/**
 * 检查设备是否为低性能设备
 */
export function isLowPerformanceDevice(): boolean {
  // 旧版Android通常性能较低
  if (Platform.OS === 'android' && Platform.Version < 24) {
    return true;
  }
  
  return false;
}

/**
 * 获取特定平台优化的FlashList配置
 */
export function getPlatformOptimizedFlashListProps() {
  if (Platform.OS === 'ios') {
    return {
      estimatedItemSize: 120,
      initialNumToRender: 10, // 修改：初始渲染10条
      windowSize: 3,         // 减小窗口大小
      removeClippedSubviews: true,
      maxToRenderPerBatch: 5, // 减小批量渲染数
    };
  }
  
  if (Platform.OS === 'android') {
    return {
      estimatedItemSize: 100,
      initialNumToRender: 10, // 修改：初始渲染10条
      windowSize: 2,         // 减小窗口大小
      removeClippedSubviews: true,
      maxToRenderPerBatch: 3, // 减小批量渲染数
    };
  }
  
  // 默认值
  return {
    estimatedItemSize: 100,
    initialNumToRender: 10,  // 修改：初始渲染10条
    windowSize: 3,          // 减小窗口大小
    removeClippedSubviews: false,
    maxToRenderPerBatch: 4,  // 减小批量渲染数
  };
}
