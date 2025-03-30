import React, { FC } from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '../ThemedText';
import { IconSymbol } from '../ui/IconSymbol';
import { TokenUsage } from '@/constants/chat';
import i18n from '@/i18n/i18n';

interface TokenUsageInfoProps {
  tokenUsage: TokenUsage | undefined;
  textColor: string;
}

const TokenUsageInfo: FC<TokenUsageInfoProps> = ({ tokenUsage, textColor }) => {
  
  if (!tokenUsage) return null;
  
  return (
    <View style={styles.metadataSection}>
      <View style={styles.metadataHeader}>
        <IconSymbol name="token" type="material" size={14} color={textColor} />
        <ThemedText style={[styles.metadataTitle, { color: textColor }]}>
          {i18n.t('chat.tokenUsage')}
        </ThemedText>
      </View>
      <View style={styles.tokenUsageContainer}>
        <View style={styles.tokenItem}>
          <ThemedText style={[styles.tokenLabel, { color: textColor }]}>
            {i18n.t('chat.tokenTotal')}
          </ThemedText>
          <ThemedText style={[styles.tokenValue, { color: textColor }]}>
            {tokenUsage.total_tokens || 0}
          </ThemedText>
        </View>
        <View style={styles.tokenItem}>
          <ThemedText style={[styles.tokenLabel, { color: textColor }]}>
            {i18n.t('chat.tokenInput')}
          </ThemedText>
          <ThemedText style={[styles.tokenValue, { color: textColor }]}>
            {tokenUsage.prompt_tokens || 0}
          </ThemedText>
        </View>
        <View style={styles.tokenItem}>
          <ThemedText style={[styles.tokenLabel, { color: textColor }]}>
            {i18n.t('chat.tokenOutput')}
          </ThemedText>
          <ThemedText style={[styles.tokenValue, { color: textColor }]}>
            {tokenUsage.completion_tokens || 0}
          </ThemedText>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  metadataSection: {
    marginVertical: 4,
    padding: 6,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 6,
  },
  metadataHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metadataTitle: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
    flex: 1,
  },
  tokenUsageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  tokenItem: {
    alignItems: 'center',
    flex: 1,
  },
  tokenLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  tokenValue: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default TokenUsageInfo;
