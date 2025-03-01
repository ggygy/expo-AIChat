import React from 'react';
import { StyleSheet, Text, Platform } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';

interface Props {
  literal: string;
}

const InlineCode = ({ literal }: Props) => {
  const colorScheme = useColorScheme();
  const fontFamily = Platform.OS === 'ios' ? 'Menlo' : 'monospace';
  
  console.log('InlineCode rendering:', literal);

  return (
    <Text style={[
      styles.inlineCode,
      { 
        backgroundColor: colorScheme === 'dark' ? '#282c34' : '#f6f8fa',
        color: colorScheme === 'dark' ? '#d19a66' : '#e06c75',
        fontFamily
      }
    ]}>
      {literal}
    </Text>
  );
};

const styles = StyleSheet.create({
  inlineCode: {
    fontSize: 14,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
});

export default InlineCode;
