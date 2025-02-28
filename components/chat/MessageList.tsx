import React, { memo, useCallback, useState, useMemo, useRef, useImperativeHandle, forwardRef } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Message } from '@/constants/chat';
import MessageCard from './MessageCard';
import { useThemeColor } from '@/hooks/useThemeColor';
import { FontAwesome } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import i18n from '@/i18n/i18n';
import Toast from 'react-native-toast-message';

interface MessageListProps {
  messages: Message[];
  onRetry?: (messageId: string) => void;
  onLoadMore?: () => void;
  isLoading?: boolean;
  onDeleteMessages?: (messageIds: string[]) => void;
  onStopGeneration?: () => void;
  isGenerating?: boolean;
  setShowDeleteDialog: (show: boolean) => void;
  handleCancelSelect: () => void;
  isSelectMode: boolean;
  selectedMessages: Set<string>;
  showDeleteDialog: boolean;
  setIsSelectMode: (value: boolean) => void;
  setSelectedMessages: (value: Set<string>) => void;
}

export interface MessageListRef {
  scrollToEnd: (animated?: boolean) => void;
}

const MessageList = forwardRef<MessageListRef, MessageListProps>(({
  messages,
  onRetry,
  onLoadMore,
  isLoading,
  onDeleteMessages,
  onStopGeneration,
  isGenerating,
  setShowDeleteDialog,
  handleCancelSelect,
  isSelectMode,
  selectedMessages,
  showDeleteDialog,
  setIsSelectMode,
  setSelectedMessages,
}, ref) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const iconColor = useThemeColor({}, 'text');
  const listRef = useRef<FlashList<Message>>(null);

  useImperativeHandle(ref, () => ({
    scrollToEnd: (animated = true) => {
      if (messages.length > 0) {
        listRef.current?.scrollToIndex({
          index: messages.length - 1,
          animated,
        });
      }
    }
  }));

  const handleLongPress = useCallback((message: Message) => {
    requestAnimationFrame(() => {
      setIsSelectMode(true);
      setSelectedMessages(new Set([message.id]));
    });
  }, [setIsSelectMode, setSelectedMessages]);

  const handleSelect = useCallback((message: Message) => {
    requestAnimationFrame(() => {
      setSelectedMessages(prev => {
        const newSet = new Set(prev);
        if (newSet.has(message.id)) {
          newSet.delete(message.id);
        } else {
          newSet.add(message.id);
        }
        return newSet;
      });
    });
  }, [setSelectedMessages]);

  const handleDeleteConfirm = useCallback(async () => {
    if (selectedMessages.size > 0) {
      setIsDeleting(true);
      try {
        await onDeleteMessages?.(Array.from(selectedMessages));
        Toast.show({
          type: 'success',
          text1: i18n.t('common.success'),
          text2: i18n.t('chat.deleteSuccess', { count: selectedMessages.size }),
        });
        handleCancelSelect();
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: i18n.t('common.error'),
          text2: i18n.t('chat.deleteFailed'),
        });
      } finally {
        setIsDeleting(false);
        setShowDeleteDialog(false);
      }
    }
  }, [selectedMessages, onDeleteMessages, handleCancelSelect]);

  const handleCancelDialog = useCallback(() => {
    if (!isDeleting) {
      setShowDeleteDialog(false);
    }
  }, [isDeleting]);

  const selectedMessagesStr = useMemo(() => 
    JSON.stringify(Array.from(selectedMessages)) + isSelectMode, 
    [selectedMessages, isSelectMode]
  );

  const renderMessage = useCallback(({ item }: { item: Message }) => (
    <MessageCard
      message={item}
      onRetry={item.status === 'error' ? () => onRetry?.(item.id) : undefined}
      onLongPress={() => handleLongPress(item)}
      onPress={() => isSelectMode && handleSelect(item)}
      isSelected={selectedMessages.has(item.id)}
      selectable={isSelectMode}
    />
  ), [onRetry, handleLongPress, handleSelect, selectedMessagesStr, isSelectMode]);

  // 使用 useMemo 缓存 footer 组件，避免不必要的重渲染和抖动
  const footerComponent = useMemo(() => {
    // 只有在真正需要显示加载或停止按钮时才返回内容
    if (!isLoading && !isGenerating) return null;
    
    return (
      <View style={styles.footerContainer}>
        {isLoading && (
          <View style={styles.loadingFooter}>
            <ActivityIndicator />
          </View>
        )}
        {isGenerating && (
          <TouchableOpacity 
            style={styles.stopButton}
            onPress={onStopGeneration}
          >
            <FontAwesome name="stop-circle" size={24} color={iconColor} />
          </TouchableOpacity>
        )}
      </View>
    );
  }, [isLoading, isGenerating, onStopGeneration, iconColor]);

  return (
    <View style={styles.container}>
      <FlashList
        ref={listRef}
        data={messages}
        renderItem={renderMessage}
        estimatedItemSize={100}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={footerComponent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        extraData={selectedMessagesStr}
        initialScrollIndex={messages.length > 0 ? messages.length - 1 : undefined}
      />

      <ConfirmDialog
        visible={showDeleteDialog}
        title={i18n.t('chat.deleteConfirmTitle')}
        message={i18n.t('chat.deleteConfirmMessage', { count: selectedMessages.size })}
        onConfirm={handleDeleteConfirm}
        onCancel={handleCancelDialog}
        confirmDisabled={isDeleting}
        confirmLoading={isDeleting}
        cancelDisabled={isDeleting}
        variant="danger"
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 16,
  },
  footerContainer: {
    padding: 16,
    alignItems: 'center',
    height: 72, // 固定高度，避免抖动
  },
  loadingFooter: {
    paddingVertical: 16,
  },
  stopButton: {
    padding: 8,
    borderRadius: 20,
  },
  selectionToolbar: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  toolbarInfo: {
    flex: 1,
    alignItems: 'center',
  },
});

export default memo(MessageList);
