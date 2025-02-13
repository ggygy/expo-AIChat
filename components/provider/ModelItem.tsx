import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import ModelTypeTag from './ModelTypeTag';
import i18n from '@/i18n/i18n';
import { ModelInfo } from '@/constants/ModelProviders';

interface Props {
  model: ModelInfo;
  isEnabled: boolean;
  onToggle: () => void;
  onDelete?: () => void;
  isCustom?: boolean;
}

const ModelItem = ({ model, isEnabled, onToggle, onDelete, isCustom }: Props) => {
  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <ThemedText style={styles.name}>{model.name}</ThemedText>
          <View style={styles.tagsRow}>
            {model.types.map(type => (
              <ModelTypeTag key={type} type={type} />
            ))}
          </View>
        </View>
      </View>
      <View style={styles.actions}>
        <Button
          onPress={onToggle}
          variant={isEnabled ? 'primary' : 'secondary'}
          size="small"
          style={styles.toggleButton}
        >
          {isEnabled ? i18n.t('config.enabled') : i18n.t('config.disabled')}
        </Button>
        {isCustom && onDelete && (
          <Button
            onPress={onDelete}
            variant="danger"
            size="small"
            style={styles.deleteButton}
          >
            {i18n.t('config.deleteModel')}
          </Button>
        )}
      </View>
    </View>
  );
};

ModelItem.displayName = 'ModelItem';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  info: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    minWidth: 80,
  },
  deleteButton: {
    minWidth: 60,
  },
});

export default memo(ModelItem);