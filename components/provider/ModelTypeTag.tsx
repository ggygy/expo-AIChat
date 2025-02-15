import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ModelType, MODEL_TYPES } from '@/constants/ModelTypes';
import i18n from '@/i18n/i18n';

interface Props {
  type: ModelType;
}

const ModelTypeTag = ({ type }: Props) => {
  const typeInfo = MODEL_TYPES.find(t => t.id === type);
  if (!typeInfo) return null;

  return (
    <View style={[styles.tag, { backgroundColor: `${typeInfo.color}20` }]}>
      <ThemedText style={[styles.text, { color: typeInfo.color }]}>
        {i18n.t(typeInfo.labelKey)}
      </ThemedText>
    </View>
  );
};

ModelTypeTag.displayName = 'ModelTypeTag';

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: 3,
    paddingVertical: 0,
    borderRadius: 4,
  },
  text: {
    fontSize: 11, 
  },
});

export default memo(ModelTypeTag);