import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Button } from '../ui/Button';
import i18n from '@/i18n/i18n';

interface MessageActionsProps {
  isError?: boolean;
  onRetry?: () => void;
  onCopy: () => void;
  actionButtonColor?: string;
  retryButtonColor?: string;
  dividerColor?: string;
  showBottomRetryButton?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * 消息操作按钮组件
 * 包括内部操作（复制、重试）和底部独立重试按钮
 */
const MessageActions: React.FC<MessageActionsProps> = ({
  isError = false,
  onRetry,
  onCopy,
  actionButtonColor = '#000',
  retryButtonColor = '#f00',
  dividerColor = 'rgba(0,0,0,0.1)',
  showBottomRetryButton = false,
  style,
}) => {
  // 渲染内部操作按钮区域
  const renderInlineActions = () => {
    return (
      <View style={[styles.actionContainer, { borderTopColor: dividerColor }, style]}>
        <Button
          variant="ghost"
          size="small"
          leftIcon={<FontAwesome name="copy" size={14} color={actionButtonColor} />}
          onPress={onCopy}
          style={styles.actionButton}
          textStyle={{ color: actionButtonColor }}
        >
          {i18n.t('common.copy')}
        </Button>
        
        {isError && onRetry && (
          <Button
            variant="outline"
            size="small"
            leftIcon={<FontAwesome name="refresh" size={14} color={retryButtonColor} />}
            onPress={onRetry}
            style={[styles.actionButton, { borderColor: retryButtonColor }]}
            textStyle={{ color: retryButtonColor }}
          >
            {i18n.t('common.retry')}
          </Button>
        )}
      </View>
    );
  };

  // 渲染底部独立的重试按钮
  const renderBottomRetryButton = () => {
    if (!showBottomRetryButton || !isError || !onRetry) return null;
    
    return (
      <View style={styles.bottomRetryContainer}>
        <Button
          variant="primary"
          size="small"
          leftIcon={<FontAwesome name="refresh" size={14} color="#fff" />}
          onPress={onRetry}
        >
          {i18n.t('common.retry')}
        </Button>
      </View>
    );
  };

  return (
    <>
      {renderInlineActions()}
      {renderBottomRetryButton()}
    </>
  );
};

const styles = StyleSheet.create({
  actionContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    marginTop: 12,
  },
  actionButton: {
    marginLeft: 8,
    paddingHorizontal: 10,
    height: 36,
  },
  bottomRetryContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
    width: '100%',
  },
});

export default MessageActions;
