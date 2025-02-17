import React, { memo } from 'react';
import { View, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { ProviderConfig } from '@/store/useProviderStore';
import { ModelProvider } from '@/constants/ModelProviders';
import i18n from '@/i18n/i18n';
import { useThemeColor } from '@/hooks/useThemeColor';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface Props {
  provider: ProviderConfig;
  providerInfo: ModelProvider;
  onConfigureModels: () => void;
  onToggleActive: () => void;
}

function ProviderCard({
  provider,
  providerInfo,
  onConfigureModels,
  onToggleActive,
}: Props) {
  const backgroundColor = useThemeColor({}, 'settingItemBackground');
  const linkColor = useThemeColor({}, 'link');

  const handleOpenLink = async () => {
    if (providerInfo.apiKeyUrl) {
      await Linking.openURL(providerInfo.apiKeyUrl);
    }
  };

  return (
    <View style={[styles.providerCard, { backgroundColor }]}>
      <View style={styles.headerRow}>
        <ThemedText style={styles.providerName}>
          {providerInfo.name}
        </ThemedText>
        {providerInfo.apiKeyUrl && (
          <TouchableOpacity onPress={handleOpenLink} style={styles.linkButton} activeOpacity={0.6}>
            <ThemedText style={[styles.description, { color: linkColor }]}>
              {i18n.t('config.getApiKey')}
            </ThemedText>
            <IconSymbol name="chevron-right" size={16} color={linkColor} />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.buttonRow}>
        <Button
          onPress={onConfigureModels}
          style={styles.configButton}
          variant="secondary"
          hapticFeedback={true}
          activeOpacity={0.7}
        >
          {i18n.t('config.configureModels')}
        </Button>
        <Button
          onPress={onToggleActive}
          style={[styles.button, provider.isActive && styles.activeButton]}
          variant={'primary'}
          hapticFeedback={true}
          activeOpacity={0.7}
        >
          {provider.isActive ? i18n.t('config.active') : i18n.t('config.activate')}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  providerCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  providerName: {
    fontSize: 18,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    marginRight: 2,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  button: {
    flex: 1,
    minHeight: 40,
    
  },
  configButton: {
    flex: 1,
    minHeight: 40,
  },
  activeButton: {
    backgroundColor: '#4CAF50',
  },
});

export default memo(ProviderCard);