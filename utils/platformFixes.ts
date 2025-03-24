import { Platform } from 'react-native';

/**
 * 判断当前环境是否需要特殊的滚动处理
 * 某些设备/平台组合可能需要特殊处理
 */
export function needsSpecialScrollHandling(): boolean {
  // Android 通常需要特殊处理
  return Platform.OS === 'android';
}

/**
 * 为滚动操作提供额外的延迟，基于平台调整滚动行为
 */
export function getScrollDelay(isAnimated: boolean): number {
  // 在 iOS 上不需要太长的延迟
  if (Platform.OS === 'ios') {
    return isAnimated ? 50 : 10;
  }
  
  // Android 需要更长的延迟以确保渲染
  return isAnimated ? 150 : 50;
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
 * 获取基于平台优化的 FlashList 属性
 * 返回符合当前平台特性的性能优化配置
 */
export function getPlatformOptimizedFlashListProps() {
  // 基础配置
  const baseProps = {
    estimatedItemSize: 300, // 估算每个项目的平均高度
    removeClippedSubviews: true, // 移除不在可视区域内的视图
    initialNumToRender: 10, // 初始渲染的项目数量
    maxToRenderPerBatch: 10, // 批量渲染的最大项目数量
    maintainVisibleContentPosition: {
      minIndexForVisible: 0,
      autoscrollToTopThreshold: 10 // 使用数值而非null
    }
  };

  // iOS 平台特定优化
  if (Platform.OS === 'ios') {
    return {
      ...baseProps,
      removeClippedSubviews: false, // iOS 上通常不启用此属性，因为可能导致渲染问题
      maxToRenderPerBatch: 12, // iOS 更新渲染较快，可以增加批量大小
    };
  }

  // Android 平台特定优化
  if (Platform.OS === 'android') {
    return {
      ...baseProps,
      // Android 特定优化，增加缓冲以提高滚动性能
      windowSize: 7,
      initialNumToRender: 8,
    };
  }

  // 默认返回基础配置
  return baseProps;
}
