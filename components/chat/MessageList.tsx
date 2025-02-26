import React, { memo, useCallback, useState, useMemo } from 'react';
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

const MessageList: React.FC<MessageListProps> = ({
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
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const iconColor = useThemeColor({}, 'text');

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
      handleCancelSelect();
    }
  }, [isDeleting, handleCancelSelect]);

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

  const renderFooter = useCallback(() => {
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
        data={messages}
        renderItem={renderMessage}
        estimatedItemSize={100}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        extraData={selectedMessagesStr}
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
};

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
