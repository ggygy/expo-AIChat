import React, { memo } from 'react';
import { StyleSheet, View, ActivityIndicator, Pressable } from 'react-native';
import { FontAwesome, Feather } from '@expo/vector-icons';

/**
 * 消息列表指示器组件 - 统一处理所有指示器和按钮
 */
interface MessageIndicatorsProps {
  isLoading?: boolean;
  isGenerating?: boolean;
  showScrollToBottom?: boolean;
  onScrollToBottom?: () => void;
  onStopGeneration?: (e: any) => void;
  iconColor?: string;
}

const MessageIndicators = ({
  isLoading,
  isGenerating,
  showScrollToBottom,
  onScrollToBottom,
  onStopGeneration,
  iconColor = '#000'
}: MessageIndicatorsProps) => {
  return (
    <>
      {/* 加载指示器 */}
      {isLoading && (
        <View style={styles.loadingIndicator}>
          <ActivityIndicator size="small" color="#007AFF" />
        </View>
      )}
      
      {/* 滚动到底部按钮 */}
      {showScrollToBottom && !isGenerating && (
        <Pressable 
          style={styles.scrollToBottomButton}
          onPress={onScrollToBottom}
          hitSlop={10}
        >
          <Feather name="arrow-down" size={18} color="#FFFFFF" />
        </Pressable>
      )}
      
      {/* 停止生成按钮 */}
      {isGenerating && (
        <View style={styles.floatingFooterContainer}>
          <Pressable 
            style={styles.stopButton}
            onPress={onStopGeneration}
            hitSlop={20}
          >
            <FontAwesome name="stop-circle" size={24} color={iconColor} />
          </Pressable>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  // 加载指示器 - 对于反转列表，显示在顶部
  loadingIndicator: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 15,
    marginHorizontal: 140,
    zIndex: 10,
  },
  // 滚动到底部按钮样式
  scrollToBottomButton: {
    position: 'absolute',
    bottom: 60,
    right: 'auto',
    left: '50%',
    marginLeft: -20,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 10,
  },
  // 浮动在底部的停止按钮容器
  floatingFooterContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
    pointerEvents: 'box-none',
  },
  // 停止按钮样式
  stopButton: {
    padding: 9,
    borderRadius: 24,
    zIndex: 20,
  },
});

export default memo(MessageIndicators);
