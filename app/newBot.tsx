import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useProviderStore } from '@/store/useProviderStore';
import { useBotStore } from '@/store/useBotStore';
import Toast from 'react-native-toast-message';
import i18n from '@/i18n/i18n';
import { BotForm, BotFormData } from '@/components/bot/BotForm';

export default function NewBotScreen() {
  const router = useRouter();
  const providers = useProviderStore(state => state.providers);
  const addBot = useBotStore(state => state.addBot);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleCreateBot = useCallback(async (data: BotFormData) => {
    setIsSubmitting(true);
    try {
      const providerInfo = providers.find(p => p.id === data.providerId);
      
      addBot({
        ...data,
        description: `${data.modelId}`,
        lastMessageAt: undefined,
        lastMessagePreview: undefined,
        messagesCount: undefined,
      }); 
      
      Toast.show({
        type: 'success',
        text1: i18n.t('bot.createSuccess'),
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
  }, [addBot, providers]);

  return (
    <BotForm
      providerItems={providerItems}
      onProviderChange={handleProviderChange}
      onSubmit={handleCreateBot}
      submitText={i18n.t('bot.create')}
      isSubmitting={isSubmitting}
    />
  );
}
