import React, { forwardRef, useState } from 'react';
import {
  TextInput,
  TextInputProps,
  StyleSheet,
  View,
  Text,
  Platform,
  StyleProp,
  ViewStyle,
  Pressable,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from './IconSymbol';

interface InputStyleProps {
  height?: number;
  fontSize?: number;
  paddingHorizontal?: number;
  borderRadius?: number;
}

interface InputProps extends TextInputProps {
  error?: string;
  label?: string;
  hint?: string;
  rightIcon?: React.ReactNode | ((props: { color: string; onPress?: () => void }) => React.ReactNode);
  rightAction?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  inputWrapperStyle?: StyleProp<ViewStyle>;
  styleProps?: InputStyleProps;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ error, label, hint, rightIcon, rightAction, containerStyle, inputWrapperStyle, style, secureTextEntry, styleProps, ...props }, ref) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const inputColors = colors.input;

    const handleRightAction = () => {
      if (rightAction) {
        if (Platform.OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        rightAction();
      }
    };

    const defaultStyles = {
      height: 40,
      fontSize: 15,
      paddingHorizontal: 12,
      borderRadius: 8,
    };

    const combinedStyleProps = {
      ...defaultStyles,
      ...styleProps,
    };

    const dynamicStyles = {
      label: {
        color: inputColors.label,
      },
      input: {
        height: combinedStyleProps.height,
        fontSize: combinedStyleProps.fontSize,
        paddingHorizontal: combinedStyleProps.paddingHorizontal,
        color: inputColors.text,
        backgroundColor: inputColors.background,
      },
      inputError: {
        borderColor: inputColors.error,
        shadowColor: inputColors.error,
      },
      errorText: {
        color: inputColors.error,
      },
      hint: {
        color: inputColors.hint,
      },
      inputWrapper: {
        height: combinedStyleProps.height,
        borderRadius: combinedStyleProps.borderRadius,
        backgroundColor: inputColors.background,
        borderColor: error ? inputColors.error : inputColors.border,
      },
      rightIcon: {
        color: inputColors.text,
      },
    };

    const renderRightIcon = () => {
      if (!rightIcon && !secureTextEntry) return null;

      if (secureTextEntry) {
        const handleToggleVisibility = () => {
          if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          setIsPasswordVisible(!isPasswordVisible);
        };

        return (
          <Pressable 
            onPress={handleToggleVisibility}
            style={[styles.rightIcon, { height: combinedStyleProps.height }]}
          >
            <IconSymbol
              name={isPasswordVisible ? "visibility-off" : "visibility"}
              size={24}
              color={inputColors.placeholder}
            />
          </Pressable>
        );
      }

      if (typeof rightIcon === 'function') {
        return rightIcon({ 
          color: inputColors.placeholder,
          onPress: rightAction
        });
      }

      return (
        <Pressable 
          onPress={rightAction}
          style={[styles.rightIcon, { height: combinedStyleProps.height }]}
        >
          {rightIcon}
        </Pressable>
      );
    };

    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <Text style={[styles.label, dynamicStyles.label]} numberOfLines={1}>
            {label}
          </Text>
        )}
        <View style={[styles.inputWrapper, dynamicStyles.inputWrapper, inputWrapperStyle]}>
          <TextInput
            ref={ref}
            style={[dynamicStyles.input, style]}
            placeholderTextColor={inputColors.placeholder}
            selectionColor={inputColors.tint}
            secureTextEntry={secureTextEntry && !isPasswordVisible}
            {...Platform.select({
              ios: {
                paddingVertical: 12,
              },
            })}
            {...props}
          />
          {renderRightIcon()}
        </View>
        {(error || hint) && (
          <Text style={[
            styles.subText,
            error ? [styles.errorText, dynamicStyles.errorText] : [styles.hintText, dynamicStyles.hint]
          ]}>
            {error || hint}
          </Text>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    marginBottom: 12, // 减小底部间距
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6, // 减小标签和输入框的间距
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    paddingHorizontal: 4,
    paddingVertical: 0,
    fontSize: 15,
    textAlignVertical: 'center',
    ...Platform.select({
      ios: {
        lineHeight: 20,
      },
    }),
  },
  rightIcon: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    marginLeft: -8,
  },
  visibilityButton: {
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  subText: {
    fontSize: 12,
    marginTop: 4,
  },
  hintText: {
    opacity: 0.7,
  },
  inputError: {
    ...Platform.select({
      ios: {
        shadowOpacity: 0.2,
      },
    }),
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
});
