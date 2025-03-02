import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Platform, LayoutAnimation, UIManager } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { showSuccess } from '@/utils/toast';
import i18n from '@/i18n/i18n';
import SimpleCodeHighlighter from './SimpleCodeHighlighter';

// 启用 LayoutAnimation 在 Android 上工作
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
  literal: string;
  language?: string;
}

const CodeBlock = ({ literal, language }: Props) => {
  // console.log('CodeBlock', literal, language);
  
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // 处理语言标识符 - 修复潜在的undefined问题
  const normalizedLanguage = language ? 
    language
      .toLowerCase()
      .replace(/^\s*language-/, '')
      .replace(/^\s*lang-/, '')
      .trim() 
    : '';
  
  // 显示的语言名称
  const displayLanguage = normalizedLanguage || '';
  
  // 复制代码到剪贴板
  const copyToClipboard = async () => {
    if (literal) {
      await Clipboard.setStringAsync(literal);
      showSuccess('common.copySuccess');
      setCopied(true);
      
      // 3秒后重置复制状态
      setTimeout(() => setCopied(false), 3000);
    }
  };
  
  // 切换折叠状态
  const toggleCollapse = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCollapsed(!collapsed);
  };
  
  return (
    <View style={[
      styles.container,
      { borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }
    ]}>
      {/* 语言标识和复制按钮 */}
      <TouchableOpacity 
        onPress={toggleCollapse}
        activeOpacity={isDark ? 0.7 : 1}
        style={[
          styles.header,
          { backgroundColor: isDark ? '#2d333b' : '#f6f8fa' }
        ]}
      >
        <View style={styles.headerLeft}>
          <FontAwesome
            name={collapsed ? "chevron-right" : "chevron-down"}
            size={12}
            color={isDark ? '#8b949e' : '#57606a'}
            style={styles.collapseIcon}
          />
          {displayLanguage ? (
            <Text style={[
              styles.language,
              { color: isDark ? '#8b949e' : '#57606a' }
            ]}>
              {displayLanguage}
            </Text>
          ) : (
            <Text style={[
              styles.language,
              { color: isDark ? '#8b949e' : '#57606a' }
            ]}>
              {"plain text"}
            </Text>
          )}
        </View>
        
        <TouchableOpacity 
          onPress={copyToClipboard} 
          style={styles.copyButton}
          activeOpacity={0.7}
        >
          <FontAwesome
            name={copied ? "check" : "clipboard"}
            size={14}
            color={copied ? "#4CAF50" : isDark ? "#8b949e" : "#57606a"}
          />
          <Text style={[
            styles.copyText, 
            {color: copied ? "#4CAF50" : isDark ? "#8b949e" : "#57606a"}
          ]}>
            {copied ? i18n.t('common.copySuccess') : i18n.t('common.copy')}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
      
      {/* 代码内容 - 使用自定义语法高亮组件 */}
      {!collapsed && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          style={[
            styles.scrollView,
            { backgroundColor: isDark ? '#282c34' : '#f8f8f8' }
          ]}
        >
          <View style={styles.codeContainer}>
            <SimpleCodeHighlighter
              code={literal || ''}
              language={normalizedLanguage}
              isDark={isDark}
            />
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(127, 127, 127, 0.2)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  collapseIcon: {
    marginRight: 8,
  },
  language: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(127, 127, 127, 0.1)',
  },
  copyText: {
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '500',
  },
  scrollView: {
    maxHeight: 400,
  },
  codeContainer: {
    minWidth: '100%',
  },
});

export default CodeBlock;
