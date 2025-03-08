import React, { useState, useRef, useEffect, memo } from 'react';
import { 
  StyleSheet, View, Text, ScrollView, TouchableOpacity, 
  Platform, LayoutAnimation, UIManager, PanResponder, GestureResponderEvent 
} from 'react-native';
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
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [contentWidth, setContentWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollOffsetRef = useRef(0);
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
  
  // 检查内容是否需要水平滚动
  const needsHorizontalScroll = contentWidth > containerWidth;

  // 跟踪滚动位置并更新按钮显示状态
  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    scrollOffsetRef.current = offsetX;
    
    // 更新滚动按钮显示状态
    setShowLeftButton(offsetX > 5); // 稍微偏移时就显示左按钮
    setShowRightButton(offsetX < contentWidth - containerWidth - 5); // 未滚动到尽头时显示右按钮
  };

  // 按钮控制滚动
  const scrollLeft = () => {
    if (scrollViewRef.current) {
      // 向左滚动一小段距离
      const newOffset = Math.max(0, scrollOffsetRef.current - containerWidth / 2);
      scrollViewRef.current.scrollTo({ x: newOffset, animated: true });
    }
  };

  const scrollRight = () => {
    if (scrollViewRef.current) {
      // 向右滚动一小段距离
      const newOffset = Math.min(
        contentWidth - containerWidth, 
        scrollOffsetRef.current + containerWidth / 2
      );
      scrollViewRef.current.scrollTo({ x: newOffset, animated: true });
    }
  };

  // 内容变化时重置滚动状态
  useEffect(() => {
    if (!needsHorizontalScroll) {
      setShowLeftButton(false);
      setShowRightButton(false);
    } else {
      setShowRightButton(true);
    }
  }, [needsHorizontalScroll, contentWidth, containerWidth]);
  
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
        <View 
          style={styles.scrollContainer}
          onLayout={(event) => {
            setContainerWidth(event.nativeEvent.layout.width);
          }}
        >
          {needsHorizontalScroll && (
            <View style={styles.scrollIndicator}>
              <Text style={[
                styles.scrollHint,
                { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }
              ]}>
                ← {i18n.t('common.scrollCode')} →
              </Text>
            </View>
          )}

          {/* 左滚动按钮 */}
          {needsHorizontalScroll && showLeftButton && (
            <TouchableOpacity 
              style={[
                styles.scrollButton, 
                styles.leftButton,
                { backgroundColor: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(200,200,200,0.6)' }
              ]}
              onPress={scrollLeft}
              activeOpacity={0.7}
            >
              <FontAwesome 
                name="chevron-left" 
                size={16} 
                color={isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)'}
              />
            </TouchableOpacity>
          )}

          {/* 右滚动按钮 */}
          {needsHorizontalScroll && showRightButton && (
            <TouchableOpacity 
              style={[
                styles.scrollButton, 
                styles.rightButton,
                { backgroundColor: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(200,200,200,0.6)' }
              ]}
              onPress={scrollRight}
              activeOpacity={0.7}
            >
              <FontAwesome 
                name="chevron-right" 
                size={16} 
                color={isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)'}
              />
            </TouchableOpacity>
          )}

          <ScrollView
            ref={scrollViewRef}
            horizontal={true}
            showsHorizontalScrollIndicator={true}
            style={[
              styles.scrollView,
              { backgroundColor: isDark ? '#282c34' : '#f8f8f8' }
            ]}
            contentContainerStyle={styles.scrollViewContent}
            scrollEventThrottle={16}
            indicatorStyle={isDark ? 'white' : 'black'}
            onScroll={handleScroll}
            keyboardShouldPersistTaps="handled"
            directionalLockEnabled={true}
          >
            <View 
              style={styles.codeContainer}
              onLayout={(event) => {
                setContentWidth(event.nativeEvent.layout.width);
              }}
            >
              <SimpleCodeHighlighter
                code={literal || ''}
                language={normalizedLanguage}
                isDark={isDark}
              />
            </View>
          </ScrollView>
        </View>
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
  scrollContainer: {
    position: 'relative',
  },
  scrollIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingVertical: 3,
    zIndex: 5,
    alignItems: 'center',
  },
  scrollHint: {
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.7,
  },
  scrollView: {
    maxHeight: 400,
  },
  scrollViewContent: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingTop: 24, // 为滚动指示器留出空间
  },
  codeContainer: {
    // 不设置最小宽度，避免影响水平滚动
  },
  scrollHintOverlay: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.7,
  },
  scrollButton: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    top: '50%',
    marginTop: -15,
    opacity: 0.75,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 3,
  },
  leftButton: {
    left: 5,
  },
  rightButton: {
    right: 5,
  },
});

export default memo(CodeBlock);
