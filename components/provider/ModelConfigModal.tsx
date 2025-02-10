import React, { memo, useState } from 'react';
import { View, StyleSheet, Modal, ScrollView, SafeAreaView, Platform, StatusBar, TouchableOpacity, Alert } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { MODEL_PROVIDERS } from '@/constants/ModelProviders';
import { useConfigStore } from '@/store/useConfigStore';
import { ThemedText } from '@/components/ThemedText';
import i18n from '@/i18n/i18n';
import { useThemeColor } from '@/hooks/useThemeColor';

interface Props {
  providerId: string;
  visible: boolean;
  onClose: () => void;
}

function ModelConfigModal({ providerId, visible, onClose }: Props) {
  const { providers, updateProvider, toggleModel, addCustomModel, deleteCustomModel } = useConfigStore();
  const [newModelName, setNewModelName] = useState('');
  const [newModelId, setNewModelId] = useState('');
  const [showAddModel, setShowAddModel] = useState(false);
  const provider = MODEL_PROVIDERS.find(p => p.id === providerId);
  const config = providers.find(p => p.id === providerId);
  const backgroundColor = useThemeColor({}, 'settingItemBackground');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'input').border;

  const renderModels = () => {
    const availableModels = provider?.availableModels || [];
    const customModels = config?.customModels || [];

    return (
      <>
        {/* 内置模型 */}
        {availableModels.map(model => (
          <View key={model.id} style={styles.modelItem}>
            <ThemedText style={styles.modelName}>{model.name}</ThemedText>
            <Button
              onPress={() => toggleModel(providerId, model.id)}
              variant={config?.enabledModels.includes(model.id) ? 'primary' : 'secondary'}
              size="small"
              style={styles.toggleButton}
            >
              {config?.enabledModels.includes(model.id) 
                ? i18n.t('config.enabled')
                : i18n.t('config.disabled')}
            </Button>
          </View>
        ))}

        {/* 自定义模型 */}
        {customModels.map(model => (
          <View key={model.id} style={styles.modelItem}>
            <ThemedText style={styles.modelName}>{model.name}</ThemedText>
            <View style={styles.modelActions}>
              <Button
                onPress={() => toggleModel(providerId, model.id)}
                variant={config?.enabledModels.includes(model.id) ? 'primary' : 'secondary'}
                size="small"
                style={styles.toggleButton}
              >
                {config?.enabledModels.includes(model.id) 
                  ? i18n.t('config.enabled')
                  : i18n.t('config.disabled')}
              </Button>
              <Button
                onPress={() => handleDeleteModel(model.id)}
                variant="danger"
                size="small"
                style={styles.deleteButton}
              >
                {i18n.t('config.deleteModel')}
              </Button>
            </View>
          </View>
        ))}
      </>
    );
  };

  // 提前返回 null 如果数据不完整
  if (!provider || !config || !visible) return null;

  const handleAddModel = () => {
    if (!newModelId || !newModelName) return;
    
    addCustomModel(providerId, {
      id: newModelId,
      name: newModelName
    });
    setNewModelId('');
    setNewModelName('');
    setShowAddModel(false);
  };

  const handleDeleteModel = (modelId: string) => {
    Alert.alert(
      i18n.t('config.deleteModel'),
      i18n.t('common.confirm'),
      [
        { text: i18n.t('common.cancel'), style: 'cancel' },
        { 
          text: i18n.t('common.confirm'),
          style: 'destructive',
          onPress: () => deleteCustomModel(providerId, modelId)
        }
      ]
    );
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
          <ThemedText style={styles.title}>
            {provider.name}
          </ThemedText>
          <View style={styles.backButton} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <ThemedText style={styles.sectionTitle}>
            {i18n.t('config.baseUrl')}
          </ThemedText>
          <Input
            value={config.baseUrl}
            onChangeText={(text) => updateProvider(providerId, { baseUrl: text })}
            placeholder={i18n.t('config.baseUrlPlaceholder')}
            style={styles.apiInput}
          />

          <ThemedText style={styles.sectionTitle}>
            {i18n.t('config.apiKey')}
          </ThemedText>
          <Input
            value={config.apiKey}
            onChangeText={(text) => updateProvider(providerId, { apiKey: text })}
            placeholder={i18n.t('config.apiKeyPlaceholder')}
            secureTextEntry
            style={styles.apiInput}
          />

          <View style={styles.modelListHeader}>
            <ThemedText style={styles.sectionTitle}>
              {i18n.t('config.modelList')}
            </ThemedText>
            <Button
              onPress={() => setShowAddModel(true)}
              size="small"
              variant="outline"
            >
              {i18n.t('config.addModel')}
            </Button>
          </View>

          {showAddModel && (
            <View style={styles.addModelForm}>
              <Input
                value={newModelName}
                onChangeText={setNewModelName}
                placeholder={i18n.t('config.modelNamePlaceholder')}
                style={styles.input}
              />
              <Input
                value={newModelId}
                onChangeText={setNewModelId}
                placeholder={i18n.t('config.modelIdPlaceholder')}
                style={styles.input}
              />
              <View style={styles.addModelButtons}>
                <Button
                  onPress={() => setShowAddModel(false)}
                  variant="secondary"
                  size="small"
                >
                  {i18n.t('common.cancel')}
                </Button>
                <Button
                  onPress={handleAddModel}
                  variant="primary"
                  size="small"
                >
                  {i18n.t('config.confirm')}
                </Button>
              </View>
            </View>
          )}

          {renderModels()}
        </ScrollView>
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
    padding: 0,
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
  apiInput: {
    fontSize: 16,
  },
  modelItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modelName: {
    fontSize: 16,
  },
  toggleButton: {
    minWidth: 100,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    marginBottom: 16,
  },
  modelListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addModelForm: {
    padding: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  addModelButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  modelActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    minWidth: undefined,
  },
});

export default memo(ModelConfigModal);