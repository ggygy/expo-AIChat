import React from 'react';
import { View, StyleSheet, TextInput, Pressable, ToastAndroid, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import * as Clipboard from 'expo-clipboard';
import { IconSymbol } from '@/components/ui/IconSymbol';
import i18n from '@/i18n/i18n';

interface CodeEditorProps {
  value: string;
  onChangeText: (text: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  editable?: boolean;
  minHeight?: number;
  language?: 'json' | 'javascript' | 'text';
}

export const CodeEditor = ({
  value,
  onChangeText,
  label,
  placeholder,
  error,
  editable = true,
  minHeight = 200,
  language = 'text',
}: CodeEditorProps) => {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const lineNumberColor = useThemeColor({}, 'secondaryText');
  const editorBackgroundColor = useThemeColor({
    light: '#f9fafb' as any,
    dark: '#1f2937' as any
  }, 'background');
  const lineNumberBorderColor = useThemeColor({
    light: '#e5e7eb' as any,
    dark: '#374151' as any
  }, 'border');

  const handleCopy = async () => {
    await Clipboard.setStringAsync(value);
    if (Platform.OS === 'android') {
      ToastAndroid.show('已复制到剪贴板', ToastAndroid.SHORT);
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        {label && <ThemedText style={styles.label}>{label}</ThemedText>}
        <Pressable 
          onPress={handleCopy} 
          style={({ pressed }) => [
            styles.copyButton,
            pressed && styles.copyButtonPressed
          ]}
        >
          <IconSymbol name="copy" type={'fontAwesome'} size={12} color={lineNumberColor} />
          <ThemedText style={[styles.copyText, { color: lineNumberColor }]}>{i18n.t('common.copy')}</ThemedText>
        </Pressable>
      </View>
      
      <View style={[
        styles.editorContainer, 
        {
          borderColor: error ? '#ef4444' : borderColor,
          backgroundColor: editorBackgroundColor,
          minHeight
        }
      ]}>
        <View style={styles.editorContent}>
          <View style={[styles.lineNumbers, { borderRightColor: lineNumberBorderColor }]}>
            {value.split('\n').map((_, i) => (
              <ThemedText key={i} style={[styles.lineNumber, { color: lineNumberColor }]}>
                {i + 1}
              </ThemedText>
            ))}
          </View>
          
          <TextInput
            multiline
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            style={[
              styles.editor,
              { color: textColor, minHeight },
              { fontFamily: 'monospace' }
            ]}
            textAlignVertical="top"
            autoCapitalize="none"
            autoCorrect={false}
            editable={editable}
          />
        </View>
      </View>
      
      {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontWeight: '500',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderRadius: 4,
  },
  copyButtonPressed: {
    opacity: 0.7,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
  },
  copyText: {
    fontSize: 12,
    marginLeft: 4,
  },
  editorContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  editorContent: {
    flexDirection: 'row',
    flex: 1,
  },
  lineNumbers: {
    paddingTop: 10,
    paddingHorizontal: 8,
    borderRightWidth: 1,
  },
  lineNumber: {
    fontSize: 12,
    textAlign: 'right',
    minWidth: 25,
    lineHeight: 20,
  },
  editor: {
    flex: 1,
    padding: 10,
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    marginTop: 4,
    color: '#ef4444',
    fontSize: 12,
  },
});