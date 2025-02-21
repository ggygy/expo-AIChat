import React, { memo, useState, useMemo } from 'react';
import { View, StyleSheet, Modal, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { MODEL_PROVIDERS, ModelProviderId } from '@/constants/ModelProviders';
import { useProviderStore } from '@/store/useProviderStore';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ModelType } from '@/constants/ModelTypes';
import ModelItem from './ModelItem';
import i18n from '@/i18n/i18n';
import AddModelModal from './AddModelModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import Toast from 'react-native-toast-message';
import { Picker } from '@/components/ui/Picker';
import { ProviderFactory } from '@/provider/ProviderFactory';

interface Props {
  providerId: string;
  visible: boolean;
  onClose: () => void;
}

function ModelConfigModal({ providerId, visible, onClose }: Props) {
  const { providers, updateProvider, toggleModel, addCustomModel, deleteCustomModel } = useProviderStore();
  const [showAddModelModal, setShowAddModelModal] = useState(false);
  const [deleteModelId, setDeleteModelId] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const provider = providers.find(p => p.id === providerId);
  const config = providers.find(p => p.id === providerId);
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'input').border;

  const availableModels = useMemo(() => {
    if (!provider || !config) return [];
    return [
      ...provider.availableModels,
      ...config.customModels
    ].filter(model => config.enabledModels.includes(model.id));
  }, [provider, config]);

  if (!provider || !config || !visible) return null;

  const handleAddModel = (model: { id: string; name: string; types: ModelType[] }) => {
    addCustomModel(providerId, model);
    setShowAddModelModal(false);
  };

  const handleDeleteModel = (modelId: string) => {
    setDeleteModelId(modelId);
  };

  const handleConfirmDelete = () => {
    if (deleteModelId) {
      deleteCustomModel(providerId, deleteModelId);
      setDeleteModelId(null);
    }
  };

  const handleTestApi = async () => {
    if (!config.apiKey || !config.baseUrl) {
      Toast.show({
        type: 'error',
        text1: i18n.t('config.apiKey') + '/' + i18n.t('config.baseUrl') + i18n.t('common.error'),
      });
      return;
    }

    if (!selectedModelId) {
      Toast.show({
        type: 'error',
        text1: i18n.t('config.selectModelFirst'),
      });
      return;
    }

    setIsTesting(true);
    Toast.show({
      type: 'info',
      text1: i18n.t('config.testing'),
    });

    try {
      const provider = ProviderFactory.createProvider(providerId as ModelProviderId);
      provider.initialize({
        vendor: providerId as ModelProviderId,
        apiKey: config.apiKey,
        modelName: selectedModelId,
        baseUrl: config.baseUrl,
      });

      const result = await provider.testModel();
      
      setIsTesting(false);
      
      if (result.success) {
        Toast.show({
          type: 'success',
          text1: i18n.t('config.testSuccess'),
        });
      } else {
        const errorCode = result.error?.code || 'unknown';
        Toast.show({
           type: 'error',
          text1: i18n.t('config.testFailed'),
          text2: i18n.t(`config.${errorCode}`, { defaultValue: result.error?.message }),
        });
      }
    } catch (error) {
      setIsTesting(false);
      Toast.show({
        type: 'error',
        text1: i18n.t('config.testFailed'),
        text2: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const renderApiTestSection = () => (
    <View style={styles.apiConfig}>
      <ThemedText style={styles.sectionTitle}>{i18n.t('config.baseUrl')}</ThemedText>
      <Input
        value={config.baseUrl}
        onChangeText={(text) => updateProvider(providerId, { baseUrl: text })}
        placeholder={i18n.t('config.baseUrlPlaceholder')}
        style={styles.apiInput}
      />

      <ThemedText style={styles.sectionTitle}>{i18n.t('config.apiKey')}</ThemedText>
      <Input
        value={config.apiKey}
        onChangeText={(text) => updateProvider(providerId, { apiKey: text })}
        placeholder={i18n.t('config.apiKeyPlaceholder')}
        secureTextEntry
        style={styles.apiInput}
      />

      <ThemedText style={styles.sectionTitle}>{i18n.t('config.testModel')}</ThemedText>
      <View style={styles.modelSelector}>
        <Picker
          selectedValue={selectedModelId}
          onValueChange={setSelectedModelId}
          enabled={!isTesting}
          style={styles.picker}
          items={[
            { label: i18n.t('config.selectModelForTest'), value: '' },
            ...availableModels.map(model => ({
              label: model.name,
              value: model.id
            }))
          ]}
        />
      </View>

      <Button
        onPress={handleTestApi}
        disabled={isTesting || !selectedModelId}
        size="medium"
        variant="secondary"
        style={styles.testButton}
      >
        {i18n.t('config.testApi')}
      </Button>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <TouchableOpacity style={styles.iconContainer} onPress={onClose}>
            <IconSymbol name="arrow-back" size={28} color={textColor} />
          </TouchableOpacity>
          <ThemedText style={styles.title}>{provider.id}</ThemedText>
          <View style={styles.backButton} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderApiTestSection()}
          <ThemedText style={styles.sectionTitle}>{i18n.t('config.modelList')}</ThemedText>

          {provider.availableModels.map(model => (
            <ModelItem
              key={model.id}
              model={model}
              isEnabled={config.enabledModels.includes(model.id)}
              onToggle={() => toggleModel(providerId, model.id)}
            />
          ))}

          {config.customModels.map(model => (
            <ModelItem
              key={model.id}
              model={model}
              isEnabled={config.enabledModels.includes(model.id)}
              onToggle={() => toggleModel(providerId, model.id)}
              onDelete={() => handleDeleteModel(model.id)}
              isCustom
            />
          ))}

          <View style={styles.addModelSection}>
            <Button
              onPress={() => setShowAddModelModal(true)}
              size="medium"
              variant="primary"
              style={styles.addModelButton}
            >
              {i18n.t('config.addNewModel')}
            </Button>
          </View>
        </ScrollView>

        <AddModelModal
          visible={showAddModelModal}
          onClose={() => setShowAddModelModal(false)}
          onAdd={(model) => {
            handleAddModel(model);
            setShowAddModelModal(false);
          }}
        />

        <ConfirmDialog
          visible={!!deleteModelId}
          title={i18n.t('config.deleteModel') + ' ' + deleteModelId}
          message={i18n.t('confirmDialog.deleteModelMsg')}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteModelId(null)}
          variant="danger"
        />

        <Toast />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },
  backButton: {
    minWidth: 48,
    height: 48,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  apiConfig: {
    marginBottom: 0,
  },
  apiInput: {
    fontSize: 16,
  },
  iconContainer: {
    padding: 8,
  },
  input: {
    marginBottom: 16,
  },
  addModelSection: {
    marginVertical: 20,
    paddingTop: 20,
  },
  addModelButton: {
    width: '100%',
  },
  addModelForm: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  testButton: {
    marginTop: 16,
    marginBottom: 24,
  },
  modelSelector: {
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  picker: {
    height: 50,
  },
});

export default memo(ModelConfigModal);