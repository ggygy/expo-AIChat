import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
  StyleProp,
  GestureResponderEvent,
  DimensionValue,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends TouchableOpacityProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  hapticFeedback?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: TextStyle;
  children: React.ReactNode;
  onLongPress?: () => void;
  delayLongPress?: number;
  longPressHaptic?: boolean;  // 长按触觉反馈
}

// 修改样式类型定义
const getButtonStyles = (
  baseStyles: StyleProp<ViewStyle>[],
  variantStyle: ViewStyle,
  isFullWidth?: boolean,
  isDisabled?: boolean,
  customStyle?: StyleProp<ViewStyle>
): StyleProp<ViewStyle> => {
  const fullWidthStyle: ViewStyle | null = isFullWidth ? { width: '100%' as DimensionValue } : null;
  const disabledStyle: ViewStyle | null = isDisabled ? { opacity: Platform.select({ ios: 0.4, android: 0.5 }) } : null;

  return [
    ...baseStyles,
    variantStyle,
    fullWidthStyle,
    disabledStyle,
    customStyle,
  ].filter(Boolean) as StyleProp<ViewStyle>;
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  loadingText,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  hapticFeedback = true,
  style,
  textStyle,
  children,
  onPress,
  onLongPress,
  delayLongPress = 500,
  longPressHaptic = true,
  ...props
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const buttonColors = colors.button;

  const handlePress = React.useCallback(
    async (event: GestureResponderEvent) => {
      if (hapticFeedback && Platform.OS === 'ios') {
        await Haptics.impactAsync(
          variant === 'danger' 
            ? Haptics.ImpactFeedbackStyle.Heavy 
            : Haptics.ImpactFeedbackStyle.Light
        );
      }
      onPress?.(event);
    },
    [onPress, hapticFeedback, variant]
  );

  const handleLongPress = React.useCallback(async () => {
    if (longPressHaptic && Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onLongPress?.();
  }, [onLongPress, longPressHaptic]);

  const getVariantStyles = (): ViewStyle & { color?: string } => {
    const variantStyles = {
      primary: {
        backgroundColor: buttonColors.primary.background,
        shadowColor: buttonColors.primary.shadow,
        color: buttonColors.primary.text,
      },
      secondary: {
        backgroundColor: buttonColors.secondary.background,
        shadowColor: buttonColors.secondary.shadow,
        color: buttonColors.secondary.text,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: buttonColors.outline.border,
        color: buttonColors.outline.text,
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
      },
      ghost: {
        backgroundColor: 'transparent',
        color: buttonColors.ghost.text,
      },
      danger: {
        backgroundColor: buttonColors.danger.background,
        shadowColor: buttonColors.danger.shadow,
        color: buttonColors.danger.text,
      },
    };

    return variantStyles[variant];
  };

  const getDisabledStyles = () => ({
    backgroundColor: buttonColors[variant].disabled,
    opacity: Platform.select({ ios: 0.7, android: 0.5 }),
  });

  const buttonStyles = getButtonStyles(
    [styles.button, styles[size]],
    getVariantStyles(),
    fullWidth,
    disabled,
    style
  );

  const textStyles: StyleProp<TextStyle> = [
    styles.text,
    styles[`${size}Text`],
    { color: getVariantStyles().color },
    disabled && { color: colors.secondaryText },
    textStyle,
  ];

  const LoadingIndicator = () => (
    <ActivityIndicator
      color={variant === 'primary' || variant === 'danger' ? '#fff' : colors.text}
      size={size === 'small' ? 'small' : 'small'}
      style={styles.loadingIndicator}
    />
  );

  const renderContent = () => {
    if (typeof children === 'string') {
      return <Text style={textStyles}>{children}</Text>;
    }
    return <View>{children}</View>;
  };

  return (
    <TouchableOpacity
      style={buttonStyles}
      disabled={disabled || isLoading}
      activeOpacity={Platform.select({ ios: 0.6, android: 0.7 })}
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={delayLongPress}
      {...props}
    >
      {isLoading ? (
        <>
          <LoadingIndicator />
          {loadingText && <Text style={textStyles}>{loadingText}</Text>}
        </>
      ) : (
        <>
          {leftIcon}
          {renderContent()}
          {rightIcon}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  // 尺寸样式
  small: {
    paddingVertical: Platform.select({ ios: 10, android: 8 }),
    paddingHorizontal: Platform.select({ ios: 14, android: 12 }),
  },
  smallText: {
    fontSize: 14,
  },
  medium: {
    paddingVertical: Platform.select({ ios: 14, android: 12 }),
    paddingHorizontal: Platform.select({ ios: 18, android: 16 }),
  },
  mediumText: {
    fontSize: 16,
  },
  large: {
    paddingVertical: Platform.select({ ios: 18, android: 16 }),
    paddingHorizontal: Platform.select({ ios: 26, android: 24 }),
  },
  largeText: {
    fontSize: 18,
  },
  // 禁用状态
  disabled: {
    opacity: Platform.select({ ios: 0.4, android: 0.5 }),
  },
  fullWidth: {
    width: '100%' as DimensionValue,
  },
  loadingIndicator: {
    marginRight: 8,
  },
});
