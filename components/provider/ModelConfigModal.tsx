import React, { memo, useState } from 'react';
import { View, StyleSheet, Modal, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { MODEL_PROVIDERS } from '@/constants/ModelProviders';
import { useConfigStore } from '@/store/useConfigStore';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ModelType } from '@/constants/ModelTypes';
import { AddModelForm } from './AddModelForm';
import ModelTypeSelector from './ModelTypeSelector';
import ModelItem from './ModelItem';
import i18n from '@/i18n/i18n';
import AddModelModal from './AddModelModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface Props {
  providerId: string;
  visible: boolean;
  onClose: () => void;
}

function ModelConfigModal({ providerId, visible, onClose }: Props) {
  const { providers, updateProvider, toggleModel, addCustomModel, deleteCustomModel } = useConfigStore();
  const [showAddModelModal, setShowAddModelModal] = useState(false);
  const [deleteModelId, setDeleteModelId] = useState<string | null>(null);
  const provider = MODEL_PROVIDERS.find(p => p.id === providerId);
  const config = providers.find(p => p.id === providerId);
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'input').border;

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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <TouchableOpacity style={styles.iconContainer} onPress={onClose}>
            <IconSymbol name="arrow-back" size={28} color={textColor} />
          </TouchableOpacity>
          <ThemedText style={styles.title}>{provider.name}</ThemedText>
          <View style={styles.backButton} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* API 配置部分 */}
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
          </View>

          {/* 模型列表部分 */}
          <ThemedText style={styles.sectionTitle}>{i18n.t('config.modelList')}</ThemedText>
          
          {/* 内置模型 */}
          {provider.availableModels.map(model => (
            <ModelItem
              key={model.id}
              model={model}
              isEnabled={config.enabledModels.includes(model.id)}
              onToggle={() => toggleModel(providerId, model.id)}
            />
          ))}

          {/* 自定义模型 */}
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

          {/* 添加模型按钮 */}
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
          title={i18n.t('config.deleteModel')}
          message={i18n.t('common.confirm')}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteModelId(null)}
          variant="danger"
        />
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
    marginBottom: 20,
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
});

export default memo(ModelConfigModal);