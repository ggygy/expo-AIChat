import React, { useState, useCallback } from 'react';
import { FlatList, StyleSheet, ListRenderItemInfo } from 'react-native';
import { Stack } from 'expo-router';
import { useConfigStore, ProviderConfig } from '@/store/useConfigStore';
import { MODEL_PROVIDERS } from '@/constants/ModelProviders';
import { AddProviderList } from '@/components/provider/AddProviderList';
import { ThemedText } from '@/components/ThemedText';
import ModelConfigModal from '@/components/provider/ModelConfigModal';
import ProviderCard from '@/components/provider/ProviderCard';
import i18n from '@/i18n/i18n';
import { useThemeColor } from '@/hooks/useThemeColor';

const AIConfigScreen = () => {
  const backgroundColor = useThemeColor({}, 'background');
  const { providers, addProvider, setActiveProvider } = useConfigStore();
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);

  const availableProviders = MODEL_PROVIDERS.filter(
    p => !providers.some(cp => cp.id === p.id)
  );

  const renderProvider = useCallback(({ item }: ListRenderItemInfo<ProviderConfig>) => {
    const providerInfo = MODEL_PROVIDERS.find(p => p.id === item.id);
    if (!providerInfo) return null;

    return (
      <ProviderCard
        provider={item}
        providerInfo={providerInfo}
        onConfigureModels={() => setSelectedProviderId(item.id)}
        onToggleActive={() => setActiveProvider(item.id)}
      />
    );
  }, [setActiveProvider]);

  const handleAddProvider = useCallback((providerId: string) => {
    addProvider({ 
      id: providerId, 
      apiKey: '', 
      baseUrl: MODEL_PROVIDERS.find(p => p.id === providerId)?.baseUrl || '',
      isActive: false 
    });
  }, [addProvider]);

  const ListHeader = useCallback(() => (
    <ThemedText style={styles.sectionTitle}>
      {i18n.t('config.providers')}
    </ThemedText>
  ), []);

  const ListFooter = useCallback(() => (
    <AddProviderList
      availableProviders={availableProviders}
      onAddProvider={handleAddProvider}
    />
  ), [availableProviders, handleAddProvider]);

  return (
    <>
      <Stack.Screen
        name="config"
        options={{
          animation: 'slide_from_right',
          presentation: 'card',
          title: i18n.t('settings.aiConfig.title'),
        }}
      />
      <FlatList
        style={[styles.container, { backgroundColor }]}
        data={providers}
        renderItem={renderProvider}
        keyExtractor={item => item.id}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
      />
      <ModelConfigModal
        providerId={selectedProviderId || ''}
        visible={!!selectedProviderId}
        onClose={() => setSelectedProviderId(null)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 16,
  },
});

export default AIConfigScreen;
