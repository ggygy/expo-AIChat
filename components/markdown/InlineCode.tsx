import React from 'react';
import { StyleSheet, Text, Platform, View } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import SimpleCodeHighlighter from './SimpleCodeHighlighter';

interface Props {
  literal: string;
}

const InlineCode = ({ literal }: Props) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const fontFamily = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

  // 从literal中尝试推断语言
  const inferLanguage = (code: string): string => {
    // 检测常见语法特征
    if (code.includes('function') || code.includes('const') || code.includes('=>')) return 'javascript';
    if (code.includes('import') && code.includes('from')) return 'typescript';
    if (code.includes('def ') || code.includes(':') && code.includes('self')) return 'python';
    if (code.startsWith('#include') || code.includes('int main')) return 'c++';
    if (code.includes('public class') || code.includes('void main')) return 'java';
    return '';
  };

  // 单行代码使用简单版本
  if (!literal.includes('\n')) {
    return (
      <Text style={[
        styles.inlineCode,
        {
          color: isDark ? '#c5c8c6' : '#333',
          fontFamily
        }
      ]}>
        {literal}
      </Text>
    );
  }

  return (
    <View style={[
      styles.multilineContainer,
      {
        backgroundColor: isDark ? '#282c34' : '#f8f8f8',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
      }
    ]}>
      <SimpleCodeHighlighter
        code={literal}
        language={inferLanguage(literal)}
        isDark={isDark}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  inlineCode: {
    fontSize: 14,
    letterSpacing: 0.3,
  },
  multilineContainer: {
    borderRadius: 6,
    borderWidth: 1,
    overflow: 'hidden',
  }
});

export default InlineCode;
