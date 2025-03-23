import React, { memo, useState, useRef, useEffect } from 'react';
import { 
  TextInput, 
  StyleSheet, 
  Platform, 
  KeyboardAvoidingView, 
  Pressable,
  Keyboard,
  LayoutAnimation,
  TouchableWithoutFeedback,
  View,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { Entypo, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '../ThemedView';
import { ThemedText } from '../ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import i18n from '@/i18n/i18n';

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
  const [isListening, setIsListening] = useState(false); // 添加语音状态
  const pulseAnim = useRef(new Animated.Value(1)).current; // 用于麦克风脉冲动画
  const inputRef = useRef<TextInput>(null);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const inputColors = colors.input;
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'text');
  const accentColor = useThemeColor({}, 'tint'); // 用于麦克风活跃状态
  const shouldShowExpand = contentHeight > 80;
  const MIN_INPUT_HEIGHT = 45;

  // 麦克风脉冲动画
  useEffect(() => {
    let animation: Animated.CompositeAnimation;
    
    if (isListening) {
      // 创建循环动画
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          })
        ])
      );
      animation.start();
    } else {
      // 重置动画
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }).start();
    }

    return () => {
      if (animation) {
        animation.stop();
      }
    };
  }, [isListening, pulseAnim]);

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

  // 更新语音输入处理函数
  const handleVoicePress = (status: 'start' | 'end') => {
    if (status === 'start') {
      setIsListening(true);
    } else {
      setIsListening(false);
    }
    onVoiceInput?.(status);
  };

  const handleContentSizeChange = (event: any) => {
    const newHeight = event.nativeEvent.contentSize.height;
    setContentHeight(newHeight);
    
    if (!isExpanded) {
      setInputHeight(Math.min(Math.max(MIN_INPUT_HEIGHT, newHeight), 80));
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
    setIsExpanded(false);
  };

  const handleInputPress = (event: any) => {
    event.stopPropagation();
  };

  const renderLeftIcon = () => {
    if (isExpanded) return null;
    if (isFocused) return null;
    if (inputText.trim().length > 0) return null;
    
    return (
      <Pressable 
        onPress={toggleInputMode} 
        style={({pressed}) => [
          styles.iconButton,
          pressed && styles.buttonPressed
        ]}
        android_ripple={{color: inputColors.pressEffect || 'rgba(0, 0, 0, 0.1)', borderless: true, radius: 20}}
      >
        <FontAwesome5
          name={isVoiceMode ? 'keyboard' : 'microphone'}
          size={20}
          color={iconColor}
        />
      </Pressable>
    );
  };

  const renderRightIcons = () => {
    return (
      <>
        {!isExpanded && (
          <Pressable 
            onPress={onFileUpload} 
            style={({pressed}) => [
              styles.iconButton,
              pressed && styles.buttonPressed
            ]}
            android_ripple={{color: inputColors.pressEffect || 'rgba(0, 0, 0, 0.1)', borderless: true, radius: 20}}
          >
            <Entypo name="upload" size={20} color={iconColor} />
          </Pressable>
        )}
        
        {!isVoiceMode && !isExpanded && shouldShowExpand && (
          <Pressable 
            onPress={toggleExpand} 
            style={({pressed}) => [
              styles.iconButton,
              pressed && styles.buttonPressed
            ]}
            android_ripple={{color: inputColors.pressEffect || 'rgba(0, 0, 0, 0.1)', borderless: true, radius: 20}}
          >
            <FontAwesome5 name="expand-alt" size={20} color={iconColor} />
          </Pressable>
        )}

        {(!isVoiceMode && inputText.trim().length > 0 || isExpanded) && (
          <Pressable 
            onPress={handleSend} 
            style={({pressed}) => [
              styles.iconButton,
              isExpanded && styles.expandedSendButton,
              pressed && styles.buttonPressed
            ]}
            android_ripple={{color: inputColors.pressEffect || 'rgba(0, 0, 0, 0.1)', borderless: true, radius: 20}}
          >
            <FontAwesome5 name="paper-plane" size={20} color={iconColor} />
          </Pressable>
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
          <View style={[
            styles.outerContainer,
          ]}>
            <ThemedView
              style={[
                styles.container,
                { 
                  borderColor: inputColors.border,
                  minHeight: MIN_INPUT_HEIGHT + 10,
                  ...(isExpanded && styles.expandedContainer)
                }
              ]}
            >
              {renderLeftIcon()}

              {isVoiceMode && !isExpanded ? (
                <View style={styles.inputContainer}>
                  <Pressable 
                    onPressIn={() => handleVoicePress('start')}
                    onPressOut={() => handleVoicePress('end')}
                    style={({pressed}) => [
                      styles.voiceButton, 
                      { backgroundColor: inputColors.background },
                      pressed && styles.voiceButtonPressed
                    ]}
                    android_ripple={{color: inputColors.pressEffect || 'rgba(0, 0, 0, 0.1)'}}
                  >
                    {isListening ? (
                      <View style={styles.listeningContainer}>
                        <Animated.View style={{
                          transform: [{ scale: pulseAnim }],
                        }}>
                          <FontAwesome5 
                            name="microphone" 
                            size={22} 
                            color={accentColor}
                            style={styles.listeningIcon}
                          />
                        </Animated.View>
                        <ThemedText style={styles.listeningText}>
                          {i18n.t('chat.listening')}
                        </ThemedText>
                      </View>
                    ) : (
                      <ThemedText style={styles.voiceText}>
                        {i18n.t('chat.holdToSpeak')}
                      </ThemedText>
                    )}
                  </Pressable>
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
          </View>
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
    paddingBottom: Platform.OS === 'ios' ? 4 : 6,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 4,
    width: '100%',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
    minHeight: 55,
  },
  inputContainer: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 45,
  },
  input: {
    fontSize: 16,
    textAlignVertical: 'center',
    paddingHorizontal: 8,
    minHeight: 45,
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
    height: 45,
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
  buttonPressed: {
    opacity: 0.7,
    backgroundColor: Platform.OS === 'ios' ? 'rgba(0,0,0,0.1)' : undefined,
    transform: [{ scale: 0.96 }],
  },
  voiceButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  listeningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listeningIcon: {
    marginRight: 8,
  },
  listeningText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default memo(ChatInput);
