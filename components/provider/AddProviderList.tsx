import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { ModelProvider } from '@/constants/ModelProviders';
import i18n from '@/i18n/i18n';

interface Props {
  availableProviders: ModelProvider[];
  onAddProvider: (providerId: string) => void;
}

export function AddProviderList({ availableProviders, onAddProvider }: Props) {
  if (availableProviders.length === 0) return null;

  return (
    <>
      <ThemedText style={styles.sectionTitle}>{i18n.t('config.addProvider')}</ThemedText>
      <View style={styles.providerList}>
        {availableProviders.map(provider => (
          <Button
            key={provider.id}
            onPress={() => onAddProvider(provider.id)}
            style={styles.addButton}
          >
            {provider.name}
          </Button>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 16,
  },
  providerList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  addButton: {
    flex: 1,
    minWidth: '45%',
  },
});
