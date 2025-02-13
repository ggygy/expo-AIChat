import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ModelType } from '@/constants/ModelTypes';
import i18n from '@/i18n/i18n';

interface Props {
  selectedTypes: ModelType[];
  onToggleType: (type: ModelType) => void;
}

const MODEL_TYPES: ModelType[] = ['chat', 'image', 'embedding', 'inference'];

const ModelTypeSelector = ({ selectedTypes, onToggleType }: Props) => {
  const backgroundColor = useThemeColor({}, 'settingItemBackground');
  const textColor = useThemeColor({}, 'secondaryText');
  const tintColor = useThemeColor({}, 'tint');

  return (
    <View style={styles.container}>
      {MODEL_TYPES.map(type => {
        const isSelected = selectedTypes.includes(type);
        return (
          <TouchableOpacity
            key={type}
            onPress={() => onToggleType(type)}
            style={[
              styles.typeButton,
              {
                backgroundColor: isSelected ? tintColor : backgroundColor,
                borderColor: isSelected ? tintColor : textColor,
              }
            ]}
            activeOpacity={0.6}
          >
            <ThemedText
              style={[
                styles.typeText,
                { color: isSelected ? '#fff' : textColor }
              ]}
            >
              {i18n.t(`modelTypes.${type}`)}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#000',
  },
  typeText: {
    fontSize: 14,
  },
});

export default ModelTypeSelector;