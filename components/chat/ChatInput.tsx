import React, { memo, useState, useRef } from 'react';
import { 
  TextInput, 
  StyleSheet, 
  Platform, 
  KeyboardAvoidingView, 
  TouchableOpacity, 
  Keyboard,
  LayoutAnimation,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Entypo, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '../ThemedView';
import { ThemedText } from '../ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import i18n from '@/i18n/i18n';
import { SafeAreaBottomPadding } from '../ui/SafeAreaBottomPadding';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  onVoiceInput?: (status: 'start' | 'end') => void;
  onFileUpload: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onVoiceInput,
  onFileUpload,
}) => {
  const [inputText, setInputText] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputHeight, setInputHeight] = useState(40);
  const [contentHeight, setContentHeight] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const inputColors = colors.input;
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const shouldShowExpand = contentHeight > 80;

  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage(inputText.trim());
      setInputText('');
      setIsExpanded(false);
      setInputHeight(40);
      Keyboard.dismiss();
    }
  };

  const toggleInputMode = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsVoiceMode(!isVoiceMode);
  };

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      inputRef.current?.focus();
    }
  };

  const handleVoicePress = (status: 'start' | 'end') => {
    onVoiceInput?.(status);
  };

  const handleContentSizeChange = (event: any) => {
    const newHeight = event.nativeEvent.contentSize.height;
    setContentHeight(newHeight);
    
    if (!isExpanded) {
      setInputHeight(Math.min(Math.max(40, newHeight), 80));
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
    setIsExpanded(false);
  };

  const handleInputPress = (event: any) => {
    event.stopPropagation(); // 防止触发背景点击事件
  };

  const renderLeftIcon = () => {
    if (isExpanded) return null;
    if (isFocused) return null;
    if (inputText.trim().length > 0) return null;
    
    return (
      <TouchableOpacity onPress={toggleInputMode} style={styles.iconButton}>
        <FontAwesome5
          name={isVoiceMode ? 'keyboard' : 'microphone'}
          size={20}
          color={iconColor}
        />
      </TouchableOpacity>
    );
  };

  const renderRightIcons = () => {
    return (
      <>
        {!isExpanded && (
          <TouchableOpacity onPress={onFileUpload} style={styles.iconButton}>
            <Entypo name="upload" size={20} color={iconColor} />
          </TouchableOpacity>
        )}
        
        {!isVoiceMode && !isExpanded && shouldShowExpand && (
          <TouchableOpacity onPress={toggleExpand} style={styles.iconButton}>
            <FontAwesome5 name="expand-alt" size={20} color={iconColor} />
          </TouchableOpacity>
        )}

        {(!isVoiceMode && inputText.trim().length > 0 || isExpanded) && (
          <TouchableOpacity 
            onPress={handleSend} 
            style={[
              styles.iconButton,
              isExpanded && styles.expandedSendButton
            ]}
          >
            <FontAwesome5 name="paper-plane" size={20} color={iconColor} />
          </TouchableOpacity>
        )}
      </>
    );
  };

  return (
    <View style={styles.wrapper}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}
        style={styles.keyboardView}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <ThemedView style={[
            styles.outerContainer,
            { backgroundColor } // 确保背景色正确
          ]}>
            <ThemedView
              style={[
                styles.container,
                { 
                  borderColor: inputColors.border,
                  ...(isExpanded && styles.expandedContainer)
                }
              ]}
            >
              {renderLeftIcon()}

              {isVoiceMode && !isExpanded ? (
                <View style={styles.inputContainer}>
                  <TouchableOpacity 
                    onPressIn={() => handleVoicePress('start')}
                    onPressOut={() => handleVoicePress('end')}
                    style={[styles.voiceButton, { backgroundColor: inputColors.background }]}
                    activeOpacity={0.5}
                  >
                    <ThemedText style={styles.voiceText}>
                      {i18n.t('chat.holdToSpeak')}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableWithoutFeedback onPress={handleInputPress}>
                  <View 
                    style={[
                      styles.inputContainer, 
                      { height: isExpanded ? '100%' : inputHeight }
                    ]}
                  >
                    <TextInput
                      ref={inputRef}
                      style={[
                        styles.input,
                        { 
                          color: textColor,
                          height: isExpanded ? '100%' : inputHeight,
                        }
                      ]}
                      value={inputText}
                      onChangeText={setInputText}
                      placeholder={i18n.t('chat.inputPlaceholder')}
                      placeholderTextColor={inputColors.placeholder}
                      multiline
                      onContentSizeChange={handleContentSizeChange}
                      onBlur={() => {
                        !isExpanded && setInputHeight(40);
                        setIsFocused(false);
                      }}
                      onFocus={() => setIsFocused(true)}
                    />
                  </View>
                </TouchableWithoutFeedback>
              )}

              {renderRightIcons()}
            </ThemedView>
          </ThemedView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
  },
  keyboardView: {
    width: '100%',
  },
  outerContainer: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    width: '100%',
    paddingBottom: Platform.OS === 'ios' ? 8 : 12,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  inputContainer: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 43,
  },
  input: {
    fontSize: 16,
    textAlignVertical: 'center',
    paddingHorizontal: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  voiceButton: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  voiceText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  expandedContainer: {
    position: 'relative',
    height: '100%',
    paddingBottom: 50,
  },
  expandedSendButton: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    backgroundColor: 'transparent',
  },
});

export default memo(ChatInput);
