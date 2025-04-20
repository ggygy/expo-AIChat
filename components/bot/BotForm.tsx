import { StyleSheet, ScrollView, View, Switch, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { ThemedView } from '@/components/ThemedView';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Picker } from '@/components/ui/Picker';
import { ThemedText } from '@/components/ThemedText';
import { ValueSlider } from '@/components/ui/ValueSlider';
import { usePromptStore } from '@/store/usePromptStore';
import { useToolStore } from '@/store/useToolStore';
import i18n from '@/i18n/i18n';
import { MODEL_PROVIDERS } from '@/constants/ModelProviders';

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
  // 添加新的字段
  promptTemplateId?: string;
  enabledToolIds?: string[];
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
  // 添加新的状态
  const [promptTemplateId, setPromptTemplateId] = useState(initialData?.promptTemplateId || '');
  const [enabledToolIds, setEnabledToolIds] = useState<string[]>(initialData?.enabledToolIds || []);
  
  const [modelItems, setModelItems] = useState<Array<{ label: string; value: string }>>([]);
  const [currentModelSupportsTools, setCurrentModelSupportsTools] = useState<boolean>(false);
  
  // 获取模板和工具
  const { templates } = usePromptStore();
  const { tools } = useToolStore();
  
  // 转换为选择器格式
  const promptItems = templates.map(t => ({ label: t.name, value: t.id }));
  
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
      // 新增字段
      promptTemplateId,
      enabledToolIds,
    });
  };

  // 处理提供商变化
  const handleProviderChange = (value: string) => {
    setSelectedProviderId(value);
    setSelectedModelId('');
    setModelItems(onProviderChange(value));
  };

  // 处理工具选择
  const handleToolToggle = (toolId: string) => {
    if (!currentModelSupportsTools) {
      Alert.alert(
        i18n.t('common.warning'),
        i18n.t('bot.modelToolsNotSupported'),
        [{ text: i18n.t('common.ok'), style: 'default' }]
      );
      return;
    }
    
    setEnabledToolIds(prev => 
      prev.includes(toolId)
        ? prev.filter(id => id !== toolId)
        : [...prev, toolId]
    );
  };

  // 处理模型变化，检查模型是否支持工具
  const handleModelChange = (modelId: string) => {
    setSelectedModelId(modelId);
    
    // 检查模型是否支持工具功能
    if (selectedProviderId && modelId) {
      const provider = MODEL_PROVIDERS.find(p => p.id === selectedProviderId);
      if (provider) {
        const model = provider.availableModels.find(m => m.id === modelId);
        const supportsTools = !!model?.supportTools;
        setCurrentModelSupportsTools(supportsTools);
        
        // 如果切换到不支持工具的模型，清空已启用的工具
        if (!supportsTools && enabledToolIds.length > 0) {
          Alert.alert(
            i18n.t('common.warning'),
            i18n.t('bot.modelToolsNotSupported'),
            [
              { 
                text: i18n.t('common.ok'), 
                onPress: () => setEnabledToolIds([])
              }
            ]
          );
        }
      }
    }
  };

  // 初始化时设置模型列表并检查工具支持
  useEffect(() => {
    if (initialData?.providerId) {
      const models = onProviderChange(initialData.providerId);
      setModelItems(models);
      
      // 如果有初始模型，检查其是否支持工具
      if (initialData.modelId) {
        const provider = MODEL_PROVIDERS.find(p => p.id === initialData.providerId);
        if (provider) {
          const model = provider.availableModels.find(m => m.id === initialData.modelId);
          setCurrentModelSupportsTools(!!model?.supportTools);
        }
      }
    }
  }, [initialData?.providerId, initialData?.modelId, onProviderChange]);

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
            onValueChange={handleModelChange}
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

        {/* 新增Prompt模板选择 */}
        <ThemedView style={styles.pickerContainer}>
          <ThemedText style={styles.label}>提示词模板</ThemedText>
          <Picker
            selectedValue={promptTemplateId}
            onValueChange={setPromptTemplateId}
            items={promptItems}
            enabled={!isSubmitting}
            placeholder="选择提示词模板（可选）"
          />
          <ThemedText style={styles.hint}>选择一个预设的提示词模板，或使用自定义系统提示词</ThemedText>
        </ThemedView>

        {/* 工具选择区域 */}
        <ThemedView style={styles.toolsContainer}>
          <ThemedText style={styles.label}>{i18n.t('bot.selectTools')}</ThemedText>
          {tools.map(tool => (
            <View key={tool.id} style={styles.toolItem}>
              <Switch 
                value={enabledToolIds.includes(tool.id)}
                onValueChange={() => handleToolToggle(tool.id)}
                disabled={!currentModelSupportsTools}
              />
              <View style={styles.toolInfo}>
                <ThemedText style={styles.toolName}>{tool.name}</ThemedText>
                <ThemedText style={styles.toolDescription}>{tool.description}</ThemedText>
              </View>
            </View>
          ))}
          <ThemedText style={styles.hint}>
            {currentModelSupportsTools 
              ? i18n.t('bot.selectToolsToUse')
              : i18n.t('bot.modelToolsNotSupported')}
          </ThemedText>
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
          hint={promptTemplateId ? "已选择提示词模板，此处内容将被忽略" : i18n.t('bot.systemPromptHint')}
          editable={!promptTemplateId} // 如果选择了模板，则禁用系统提示输入
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
    paddingBottom: 50,
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
  toolsContainer: {
    marginBottom: 16,
  },
  toolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  toolInfo: {
    marginLeft: 12,
    flex: 1,
  },
  toolName: {
    fontWeight: '500',
    fontSize: 16,
  },
  toolDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});
