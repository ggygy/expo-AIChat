import { useCallback, useMemo, useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useProviderStore } from '@/store/useProviderStore';
import { useBotStore } from '@/store/useBotStore';
import { BotForm, BotFormData } from '@/components/bot/BotForm';
import { showError, showSuccess } from '@/utils/toast';
import { Platform, SafeAreaView } from 'react-native';
import i18n from '@/i18n/i18n';


export default function EditBotScreen() {
  const router = useRouter();
  const { botId } = useLocalSearchParams<{ botId: string }>();
  const providers = useProviderStore(state => state.providers);
  const updateBot = useBotStore(state => state.updateBot);
  const getBotInfo = useBotStore(state => state.getBotInfo);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialData, setInitialData] = useState<Partial<BotFormData>>();

  useEffect(() => {
    if (!botId) return;
    const botInfo = getBotInfo(botId);
    if (!botInfo) {
      showError('bot.notFound');
      router.back();
      return;
    }

    setInitialData(botInfo);
  }, [botId, getBotInfo, router]);

  const providerItems = useMemo(() => {
    const activeProviders = providers.filter(provider => provider.isActive);
    return activeProviders.map(provider => ({
      label: provider.id,
      value: provider.id,
    }));
  }, [providers]);

  const handleProviderChange = useCallback((providerId: string) => {
    const selectedProvider = providers.find(p => p.id === providerId);
    if (!selectedProvider?.isActive) return [];

    return selectedProvider.enabledModels.map(modelId => {
      const model = [...selectedProvider.availableModels, ...selectedProvider.customModels].find(m => m.id === modelId);
      return {
        label: model?.name || modelId,
        value: modelId,
      };
    });
  }, [providers]);

  const handleUpdateBot = useCallback(async (data: BotFormData) => {
    if (!botId) return;

    setIsSubmitting(true);
    try {
      const providerInfo = providers.find(p => p.id === data.providerId);

      updateBot(botId, {
        ...data,
        description: `${providerInfo?.id || data.providerId} - ${data.modelId}`,
      });

      showSuccess('bot.updateSuccess');
      router.back();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'common.unknownError');
    } finally {
      setIsSubmitting(false);
    }
  }, [botId, updateBot, providers, router]);

  if (!initialData) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <BotForm
        initialData={initialData}
        providerItems={providerItems}
        onProviderChange={handleProviderChange}
        onSubmit={handleUpdateBot}
        submitText={i18n.t('bot.update')}
        isSubmitting={isSubmitting}
      />
    </SafeAreaView>
  );
}

const styles = {
  safeArea: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 44 : 56,
  },
};