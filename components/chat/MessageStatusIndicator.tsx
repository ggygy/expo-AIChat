import React, { memo } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { IconSymbol } from '../ui/IconSymbol';
import { ThemedText } from '../ThemedText';
import i18n from '@/i18n/i18n';

interface MessageStatusIndicatorProps {
  status: 'idle' | 'loading' | 'streaming' | 'error' | string;
  errorMessage?: string;
  tintColor: string;
  errorColor: string;
}

const MessageStatusIndicator = memo(({
  status,
  errorMessage,
  tintColor,
  errorColor
}: MessageStatusIndicatorProps) => {
  if (status === 'streaming') {
    return <ActivityIndicator size="small" color={tintColor} style={styles.statusIndicator} />;
  }
  
  if (status === 'error') {
    return (
      <View style={[styles.errorContainer, { borderColor: 'rgba(255, 0, 0, 0.1)' }]}>
        <IconSymbol type='fontAwesome' name="exclamation-circle" size={14} color={errorColor} style={styles.errorIcon} />
        <ThemedText style={[styles.errorText, { color: errorColor }]}>
          {errorMessage || i18n.t('chat.generateError')}
        </ThemedText>
      </View>
    );
  }
  
  return null;
});

const styles = StyleSheet.create({
  statusIndicator: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  errorContainer: {
    padding: 10,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.05)',
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
  },
  errorIcon: {
    marginRight: 8,
  },
  errorText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  }
});

export default MessageStatusIndicator;
