import React, { useState } from 'react';
import { View, TouchableOpacity, Modal, StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { IconSymbol } from './IconSymbol';
import { Ionicons } from '@expo/vector-icons';

interface PickerProps {
  selectedValue: string;
  onValueChange: (value: string) => void;
  enabled?: boolean;
  style?: any;
  items: Array<{
    label: string;
    value: string;
  }>;
}

export const Picker = ({ selectedValue, onValueChange, enabled = true, style, items }: PickerProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');

  const selectedItem = items.find(item => item.value === selectedValue);

  return (
    <>
      <TouchableOpacity 
        onPress={() => enabled && setModalVisible(true)}
        style={[
          styles.pickerButton,
          { borderColor},
          style
        ]}
        activeOpacity={0.6}
      >
        <ThemedText style={styles.selectedText}>
          {selectedItem?.label || items[0]?.label}
        </ThemedText>
        <Ionicons name="chevron-down" size={20} color={textColor} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor }]}>
            <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <IconSymbol name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
            
            <ScrollView>
              {items.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  activeOpacity={0.5}
                  style={[
                    styles.option,
                    selectedValue === item.value && styles.selectedOption
                  ]}
                  onPress={() => {
                    onValueChange(item.value);
                    setModalVisible(false);
                  }}
                >
                  <ThemedText style={styles.optionText}>
                    {item.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    height: 50,
  },
  selectedText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '70%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  option: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  selectedOption: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  optionText: {
    fontSize: 16,
  },
});
