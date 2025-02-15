import React, { memo } from 'react';
import { Modal, View, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { ModelType } from '@/constants/ModelTypes';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';
import { AddModelForm } from './AddModelForm';
import i18n from '@/i18n/i18n';

interface Props {
  visible: boolean;
  onClose: () => void;
  onAdd: (model: { id: string; name: string; types: ModelType[] }) => void;
}

const AddModelModal = ({ visible, onClose, onAdd }: Props) => {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'input').border;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <TouchableOpacity style={styles.iconContainer} onPress={onClose}>
            <IconSymbol name="arrow-back" size={28} color={textColor} />
          </TouchableOpacity>
          <ThemedText style={styles.title}>{i18n.t('config.addNewModel')}</ThemedText>
          <View style={styles.backButton} />
        </View>

        <View style={styles.content}>
          <AddModelForm onAdd={onAdd} onCancel={onClose} />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

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
  iconContainer: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
});

export default memo(AddModelModal);