import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { ProviderConfig } from '@/store/useConfigStore';
import { ModelProvider } from '@/constants/ModelProviders';
import i18n from '@/i18n/i18n';
import { useThemeColor } from '@/hooks/useThemeColor';

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
  return (
    <View style={[styles.providerCard, { backgroundColor }]}>
      <ThemedText style={styles.providerName}>{providerInfo.name}</ThemedText>
      <View style={styles.buttonRow}>
        <Button
          onPress={onConfigureModels}
          style={styles.configButton}
          variant="secondary"
        >
          {i18n.t('config.configureModels')}
        </Button>
        <Button
          onPress={onToggleActive}
          style={[styles.button, provider.isActive && styles.activeButton]}
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
  providerName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  configButton: {
    flex: 1,
    marginRight: 8,
  },
  button: {
    flex: 1,
    marginLeft: 8,
  },
  activeButton: {
    backgroundColor: '#4CAF50',
  },
});

export default memo(ProviderCard);