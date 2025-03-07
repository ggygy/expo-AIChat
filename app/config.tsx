import React, { useState, useCallback } from 'react';
import { FlatList, StyleSheet, ListRenderItemInfo, Platform } from 'react-native';
import { useProviderStore, ProviderConfig } from '@/store/useProviderStore';
import { MODEL_PROVIDERS } from '@/constants/ModelProviders';
import { AddProviderList } from '@/components/provider/AddProviderList';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { SafeAreaView } from 'react-native-safe-area-context';
import ModelConfigModal from '@/components/provider/ModelConfigModal';
import ProviderCard from '@/components/provider/ProviderCard';
import i18n from '@/i18n/i18n';


const ConfigScreen = () => {
  const backgroundColor = useThemeColor({}, 'background');
  
  const { providers, addProvider, setActiveProvider } = useProviderStore();
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
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        style={[styles.container, { backgroundColor }]}
        contentContainerStyle={styles.contentContainer}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 44 : 56,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 5,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 8,
  },
});

export default ConfigScreen;
