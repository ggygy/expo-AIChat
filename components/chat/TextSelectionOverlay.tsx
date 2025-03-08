import { View, StyleSheet, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { ThemedText } from '../ThemedText';
import { FontAwesome } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import i18n from '@/i18n/i18n';

interface TextSelectionOverlayProps {
  visible: boolean;
  content: string;
  thinkingContent?: string;
  onClose: () => void;
}

const TextSelectionOverlay: React.FC<TextSelectionOverlayProps> = ({
  visible,
  content,
  thinkingContent,
  onClose
}) => {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const headerBgColor = useThemeColor({}, 'card');
  const hasThinkingContent = thinkingContent && thinkingContent.trim().length > 0;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
    <ScrollView style={[styles.container, { backgroundColor }]}>
        <View style={[styles.header, { backgroundColor: headerBgColor }]}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <FontAwesome name="times" size={20} color={textColor} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>{i18n.t('chat.selectText')}</ThemedText>
          <View style={styles.headerRight}></View>
        </View>
        
        <View style={styles.contentContainer}>
          {/* 思考内容，如果存在 */}
          {hasThinkingContent && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>{i18n.t('chat.thinking')}</ThemedText>
              <View style={styles.thinkingContainer}>
                <ThemedText selectable={true} style={styles.textContent}>
                  {thinkingContent}
                </ThemedText>
              </View>
            </View>
          )}
          
          {/* 主要内容 */}
          <View style={styles.section}>
            {hasThinkingContent && (
              <ThemedText style={styles.sectionTitle}>{i18n.t('chat.answer')}</ThemedText>
            )}
            <ThemedText selectable={true} style={styles.textContent}>
              {content}
            </ThemedText>
          </View>
        </View>
        
        <View style={[styles.footer, { backgroundColor: headerBgColor }]}>
          <ThemedText style={styles.footerText}>
            {i18n.t('chat.selectTextHint')}
          </ThemedText>
        </View>
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  headerRight: {
    width: 36, // 保持标题居中
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  thinkingContainer: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  textContent: {
    fontSize: 15,
    lineHeight: 22,
  },
  footer: {
    padding: 12,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  footerText: {
    fontSize: 12,
    opacity: 0.6,
  },
});

export default TextSelectionOverlay;
