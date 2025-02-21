import { useCallback, useMemo, useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useProviderStore } from '@/store/useProviderStore';
import { useBotStore } from '@/store/useBotStore';
import Toast from 'react-native-toast-message';
import i18n from '@/i18n/i18n';
import { BotForm, BotFormData } from '@/components/bot/BotForm';

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
      Toast.show({
        type: 'error',
        text1: i18n.t('bot.notFound'),
      });
      router.back();
      return;
    }

    setInitialData(botInfo);
  }, [botId]);

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

    return selectedProvider.enabledModels.map(modelId => ({
      label: modelId,
      value: modelId,
    }));
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
      
      Toast.show({
        type: 'success',
        text1: i18n.t('bot.updateSuccess'),
      });
      router.back();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: i18n.t('common.error'),
        text2: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [botId, updateBot, providers]);

  if (!initialData) return null;

  return (
    <BotForm
      initialData={initialData}
      providerItems={providerItems}
      onProviderChange={handleProviderChange}
      onSubmit={handleUpdateBot}
      submitText={i18n.t('bot.update')}
      isSubmitting={isSubmitting}
    />
  );
}
