import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ModelType } from '@/constants/ModelTypes';
import { ThemedText } from '@/components/ThemedText';
import i18n from '@/i18n/i18n';
import ModelTypeSelector from './ModelTypeSelector';

interface Props {
  onAdd: (model: { id: string; name: string; types: ModelType[] }) => void;
  onCancel: () => void;
}

export const AddModelForm = ({ onAdd, onCancel }: Props) => {
  const [modelName, setModelName] = useState('');
  const [modelId, setModelId] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<ModelType[]>(['chat']);

  const handleAdd = () => {
    if (!modelId || !modelName || selectedTypes.length === 0) return;
    onAdd({
      id: modelId,
      name: modelName,
      types: selectedTypes
    });
    // 重置表单
    setModelName('');
    setModelId('');
    setSelectedTypes(['chat']);
  };

  return (
    <View style={styles.container}>
      <ThemedText style={styles.label}>{i18n.t('config.modelName')}</ThemedText>
      <Input
        value={modelName}
        onChangeText={setModelName}
        placeholder={i18n.t('config.modelNamePlaceholder')}
        style={styles.input}
      />
      
      <ThemedText style={styles.label}>{i18n.t('config.modelId')}</ThemedText>
      <Input
        value={modelId}
        onChangeText={setModelId}
        placeholder={i18n.t('config.modelIdPlaceholder')}
        style={styles.input}
      />
      
      <ThemedText style={styles.label}>{i18n.t('config.modelTypes')}</ThemedText>
      <ModelTypeSelector
        selectedTypes={selectedTypes}
        onToggleType={(type) => {
          setSelectedTypes(prev => 
            prev.includes(type)
              ? prev.filter(t => t !== type)
              : [...prev, type]
          );
        }}
      />
      
      <View style={styles.buttons}>
        <Button
          variant="secondary"
          onPress={onCancel}
          style={styles.button}
        >
          {i18n.t('common.cancel')}
        </Button>
        <Button
          variant="primary"
          onPress={handleAdd}
          style={styles.button}
          disabled={!modelId || !modelName || selectedTypes.length === 0}
        >
          {i18n.t('common.confirm')}
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 24,
  },
  button: {
    minWidth: 80,
  },
});
