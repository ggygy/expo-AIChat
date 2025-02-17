import { StyleSheet, ScrollView } from 'react-native';
import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/ThemedView';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Picker } from '@/components/ui/Picker';
import { useProviderStore } from '@/store/useProviderStore';
import { useBotStore } from '@/store/useBotStore';
import { MODEL_PROVIDERS } from '@/constants/ModelProviders';
import Toast from 'react-native-toast-message';
import i18n from '@/i18n/i18n';
import { ThemedText } from '@/components/ThemedText';

export default function NewBotScreen() {
  const router = useRouter();
  const providers = useProviderStore(state => state.providers);
  const addBot = useBotStore(state => state.addBot);
  
  const [name, setName] = useState('');
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [selectedModelId, setSelectedModelId] = useState('');
  const [temperature, setTemperature] = useState('0.7');
  const [maxContextLength, setMaxContextLength] = useState('4');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 获取激活的提供商列表
  const providerItems = useMemo(() => {
    const activeProviders = providers.filter(provider => provider.isActive);
    return activeProviders.map(provider => {
      const providerInfo = MODEL_PROVIDERS.find(p => p.id === provider.id);
      return {
        label: providerInfo?.name || provider.id,
        value: provider.id,
      };
    });
  }, [providers]);

  // 获取选中提供商的可用模型
  const modelItems = useMemo(() => {
    const selectedProvider = providers.find(p => p.id === selectedProviderId);
    if (!selectedProvider?.isActive) return [];
    
    return selectedProvider.enabledModels.map(modelId => ({
      label: modelId,
      value: modelId,
    }));
  }, [selectedProviderId, providers]);

  const isValid = name.trim() && selectedProviderId && selectedModelId;

  const handleCreateBot = useCallback(async () => {
    if (!isValid) {
      Toast.show({
        type: 'error',
        text1: i18n.t('common.error'),
        text2: i18n.t('bot.validateError'),
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const providerInfo = useProviderStore.getState().getProviderInfo(selectedProviderId);
      const modelInfo = providerInfo?.models.find(m => m.id === selectedModelId);
      
      addBot({
        name: name.trim(),
        providerId: selectedProviderId,
        modelId: selectedModelId,
        temperature: parseFloat(temperature),
        maxContextLength: parseInt(maxContextLength, 10),
        systemPrompt: systemPrompt.trim(),
        description: `${providerInfo?.displayName || selectedProviderId} - ${modelInfo?.name || selectedModelId}`,
        createdAt: Date.now(),
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
  }, [name, selectedProviderId, selectedModelId, temperature, maxContextLength, systemPrompt]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.form}>
          <Input 
            label={i18n.t('bot.name')}
            value={name}
            onChangeText={setName}
            placeholder={i18n.t('bot.namePlaceholder')}
            error={name.trim() ? undefined : i18n.t('bot.nameRequired')}
          />
          
          <ThemedView style={styles.pickerContainer}>
            <ThemedText style={styles.label}>{i18n.t('bot.provider')}</ThemedText>
            <Picker
              selectedValue={selectedProviderId}
              onValueChange={(value) => {
                setSelectedProviderId(value);
                setSelectedModelId(''); // 重置模型选择
              }}
              items={providerItems}
              enabled={!isSubmitting}
            />
            {providerItems.length === 0 && (
              <ThemedText style={styles.error}>
                {i18n.t('bot.noActiveProviders')}
              </ThemedText>
            )}
          </ThemedView>

          <ThemedView style={styles.pickerContainer}>
            <ThemedText style={styles.label}>{i18n.t('bot.model')}</ThemedText>
            <Picker
              selectedValue={selectedModelId}
              onValueChange={setSelectedModelId}
              items={modelItems}
              enabled={!isSubmitting && !!selectedProviderId}
            />
            {selectedProviderId && modelItems.length === 0 && (
              <ThemedText style={styles.error}>
                {i18n.t('bot.noEnabledModels')}
              </ThemedText>
            )}
          </ThemedView>

          <Input 
            label={i18n.t('bot.temperature')}
            value={temperature}
            onChangeText={setTemperature}
            keyboardType="decimal-pad"
            hint={i18n.t('bot.temperatureHint')}
          />

          <Input 
            label={i18n.t('bot.maxContext')}
            value={maxContextLength}
            onChangeText={setMaxContextLength}
            keyboardType="number-pad"
            hint={i18n.t('bot.maxContextHint')}
          />

          <Input 
            label={i18n.t('bot.systemPrompt')}
            value={systemPrompt}
            onChangeText={setSystemPrompt}
            multiline
            numberOfLines={4}
            hint={i18n.t('bot.systemPromptHint')}
          />

          <Button 
            variant="primary"
            disabled={!isValid || isSubmitting}
            isLoading={isSubmitting}
            onPress={handleCreateBot}
            fullWidth
          >
            {i18n.t('bot.create')}
          </Button>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  form: {
    padding: 16,
    gap: 16,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  error: {
    fontSize: 12,
    color: 'red',
    marginTop: 4,
  },
});
