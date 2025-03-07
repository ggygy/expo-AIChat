import { StyleSheet, ScrollView, View, Switch } from 'react-native';
import { useState, useEffect } from 'react';
import { ThemedView } from '@/components/ThemedView';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Picker } from '@/components/ui/Picker';
import { ThemedText } from '@/components/ThemedText';
import { ValueSlider } from '@/components/ui/ValueSlider';
import i18n from '@/i18n/i18n';

export interface BotFormData {
  name: string;
  providerId: string;
  modelId: string;
  temperature: number;
  topP: number;
  maxContextLength: number;
  enableMaxTokens: boolean;
  maxTokens: number;
  streamOutput: boolean;
  chainOfThought: number;
  systemPrompt: string;
}

interface BotFormProps {
  initialData?: Partial<BotFormData>;
  providerItems: Array<{ label: string; value: string }>;
  onProviderChange: (providerId: string) => Array<{ label: string; value: string }>;
  onSubmit: (data: BotFormData) => Promise<void>;
  submitText: string;
  isSubmitting: boolean;
}

export function BotForm({
  initialData,
  providerItems,
  onProviderChange,
  onSubmit,
  submitText,
  isSubmitting
}: BotFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [selectedProviderId, setSelectedProviderId] = useState(initialData?.providerId || '');
  const [selectedModelId, setSelectedModelId] = useState(initialData?.modelId || '');
  const [temperature, setTemperature] = useState(initialData?.temperature?.toString() || '0.7');
  const [maxContextLength, setMaxContextLength] = useState(initialData?.maxContextLength?.toString() || '4');
  const [systemPrompt, setSystemPrompt] = useState(initialData?.systemPrompt || '');
  const [topP, setTopP] = useState(initialData?.topP || 1);
  const [enableMaxTokens, setEnableMaxTokens] = useState(initialData?.enableMaxTokens || false);
  const [maxTokens, setMaxTokens] = useState(initialData?.maxTokens || 2000);
  const [streamOutput, setStreamOutput] = useState(initialData?.streamOutput ?? true);
  const [chainOfThought, setChainOfThought] = useState(initialData?.chainOfThought || 0);
  const [modelItems, setModelItems] = useState<Array<{ label: string; value: string }>>([]);

  const isValid = name.trim() && selectedProviderId && selectedModelId;

  const handleSubmit = async () => {
    if (!isValid) return;
    
    await onSubmit({
      name: name.trim(),
      providerId: selectedProviderId,
      modelId: selectedModelId,
      temperature: parseFloat(temperature),
      topP,
      maxContextLength: parseInt(maxContextLength, 10),
      enableMaxTokens,
      maxTokens,
      streamOutput,
      chainOfThought,
      systemPrompt: systemPrompt.trim(),
    });
  };

  // 处理提供商变化
  const handleProviderChange = (value: string) => {
    setSelectedProviderId(value);
    setSelectedModelId('');
    setModelItems(onProviderChange(value));
  };

  // 初始化时设置模型列表
  useEffect(() => {
    if (initialData?.providerId) {
      setModelItems(onProviderChange(initialData.providerId));
    }
  }, [initialData?.providerId, onProviderChange]);

  return (
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
            onValueChange={handleProviderChange}
            items={providerItems}
            enabled={!isSubmitting}
            placeholder={i18n.t('bot.selectProvider')}
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
            placeholder={i18n.t('bot.selectModel')}
          />
          {selectedProviderId && modelItems.length === 0 && (
            <ThemedText style={styles.error}>
              {i18n.t('bot.noEnabledModels')}
            </ThemedText>
          )}
        </ThemedView>

        <ValueSlider
          label={i18n.t('bot.temperature')}
          value={parseFloat(temperature)}
          onSlidingComplete={(value) => setTemperature(value.toFixed(1))}
          minimumValue={0.1}
          maximumValue={1.0}
          step={0.1}
          hint={i18n.t('bot.temperatureHint')}
          formatValue={(v) => v.toFixed(1)}
        />

        <ValueSlider
          label={i18n.t('bot.topP')}
          value={topP}
          onSlidingComplete={setTopP}
          minimumValue={0}
          maximumValue={1}
          step={0.1}
          hint={i18n.t('bot.topPHint')}
          formatValue={(v) => v.toFixed(1)}
        />

        <ValueSlider
          label={i18n.t('bot.maxContext')}
          value={parseInt(maxContextLength)}
          onSlidingComplete={(value) => setMaxContextLength(Math.round(value).toString())}
          minimumValue={1}
          maximumValue={20}
          step={1}
          hint={i18n.t('bot.maxContextHint')}
          formatValue={(value) => Math.round(value).toString()}
        />

        <ValueSlider
          label={i18n.t('bot.chainOfThought')}
          value={chainOfThought}
          onSlidingComplete={setChainOfThought}
          minimumValue={0}
          maximumValue={5}
          step={1}
          hint={i18n.t('bot.chainOfThoughtHint')}
          formatValue={(value) => Math.round(value).toString()}
        />

        <ThemedView style={styles.switchContainer}>
          <ThemedView style={styles.switchContent}>
            <ThemedText style={styles.label}>{i18n.t('bot.streamOutput')}</ThemedText>
            <Switch value={streamOutput} onValueChange={setStreamOutput} />
          </ThemedView>
          <ThemedText style={styles.hint}>{i18n.t('bot.streamOutputHint')}</ThemedText>
        </ThemedView>

        <ThemedView style={styles.switchMaxTokensContainer}>
          <ThemedText style={styles.label}>{i18n.t('bot.enableMaxTokens')}</ThemedText>
          <Switch value={enableMaxTokens} onValueChange={setEnableMaxTokens} />
        </ThemedView>

        {enableMaxTokens && (
          <ValueSlider
            label={i18n.t('bot.maxTokens')}
            value={maxTokens}
            onSlidingComplete={setMaxTokens}
            minimumValue={100}
            maximumValue={8000}
            step={100}
            hint={i18n.t('bot.maxTokensHint')}
            formatValue={(value) => Math.round(value).toString()}
          />
        )}

        <Input
          label={i18n.t('bot.systemPrompt')}
          value={systemPrompt}
          onChangeText={setSystemPrompt}
          multiline={true}
          textAlignVertical="top"
          numberOfLines={6}
          style={styles.multilineInput}
          hint={i18n.t('bot.systemPromptHint')}
        />

        <Button
          variant="primary"
          disabled={!isValid || isSubmitting}
          isLoading={isSubmitting}
          onPress={handleSubmit}
          style={{ marginTop: 20 }}
          fullWidth
        >
          {submitText}
        </Button>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingTop: 16,
    paddingBottom: 150,
  },
  form: {
    paddingHorizontal: 16,
    gap: 3,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 3,
  },
  error: {
    fontSize: 12,
    color: 'red',
    marginTop: 4,
  },
  sliderContainer: {
    marginBottom: 16,
  },
  slider: {
    height: 40,
  },
  value: {
    textAlign: 'right',
    fontSize: 14,
    marginTop: 4,
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  switchContainer: {
    marginBottom: 16,
  },
  switchMaxTokensContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  switchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  multilineInput: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
});
