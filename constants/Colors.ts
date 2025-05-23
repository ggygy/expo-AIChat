/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#2196F3';
const tintColorDark = '#42A5F5';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    settingItemBackground: '#f5f5f5',
    secondaryText: '#666666',
    divider: '#E0E0E0',
    border: '#E0E0E0',
    disabled: '#9E9E9E',
    placeholder: '#9E9E9E',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    link: tintColorLight,
    success: '#4caf50',
    error: '#f44336',
    warning: '#ff9800',
    info: '#2196f3',
    cardBackground: '#F5F5F5',
    
    // Input 组件颜色
    input: {
      background: '#ffffff',
      border: '#E0E0E0',
      text: '#333333',
      placeholder: '#9E9E9E',
      label: '#424242',
      error: '#FF5252',
      hint: '#757575',
      shadow: 'rgba(0, 0, 0, 0.1)',
      tint: tintColorDark,
      pressEffect: 'rgba(0, 0, 0, 0.1)',
    },
    
    // Button 组件颜色
    button: {
      primary: {
        background: tintColorLight,
        text: '#ffffff',
        shadow: `${tintColorLight}40`,
        disabled: `${tintColorLight}80`,
      },
      secondary: {
        background: '#b2b1b1',
        text: '#424242',
        shadow: 'rgba(0, 0, 0, 0.05)',
        disabled: '#EEEEEE',
      },
      outline: {
        border: tintColorLight,
        text: tintColorLight,
        disabled: '#B3E5FC',
      },
      ghost: {
        text: tintColorLight,
        disabled: '#B3E5FC',
      },
      danger: {
        background: '#FF5252',
        text: '#ffffff',
        shadow: '#FF525240',
        disabled: '#FF525280',
      },
    },
    
    // Chat 页面颜色
    chat: {
      userBubble: '#dcf8c6',
      botBubble: '#fff',
      thinkingBg: '#f5f5f5',
      userBubbleBorder: '#c7e6b8',
      botBubbleBorder: '#e0e0e0',
      timestamp: '#999999',
      sending: '#999999',
      sent: '#4fc3f7',
      error: '#ef5350',
      retryButton: '#ff5252',
      markdownCode: 'rgba(0,0,0,0.05)',
      divider: '#e0e0e0',
      tableBorder: '#e0e0e0',
      tableHeaderBg: '#f5f5f5',
      blockquoteBg: 'rgba(0,0,0,0.03)',
      actionButtonBg: 'rgba(0,0,0,0.03)',
      actionButtonActiveBg: 'rgba(0,0,0,0.08)',
      actionButtonText: '#333333',
      selectedBubbleBg: 'rgba(33, 150, 243, 0.05)',
      bubbleShadowColor: 'rgba(0,0,0,0.08)',
      thinkingBubble: '#f5f5f5',
      thinkingBubbleBorder: '#e0e0e0',
      thinkingText: '#666666',
      metadataBorder: '#e0e0e0',
      metadataBackground: '#f5f5f5',
      toolCallBorder: '#4e9bff',
    },
  },
  dark: {
    text: '#ECEDEE',
    background: '#000',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    settingItemBackground: '#1A1D1E',
    secondaryText: '#A0A0A0',
    divider: '#424242',
    border: '#424242',
    disabled: '#757575',
    placeholder: '#757575',
    backdrop: 'rgba(0, 0, 0, 0.7)',
    surface: '#121212',
    card: '#1E1E1E',
    link: tintColorDark,
    success: '#66bb6a',
    error: '#ef5350',
    warning: '#ffa726',
    info: '#42a5f5',
    cardBackground: '#000',
    
    // Input 组件颜色
    input: {
      background: '#1E1E1E',
      border: '#333333',
      text: '#FFFFFF',
      placeholder: '#666666',
      label: '#BBBBBB',
      error: '#FF6B6B',
      hint: '#888888',
      shadow: 'rgba(0, 0, 0, 0.2)',
      tint: tintColorDark,
      pressEffect: 'rgba(255, 255, 255, 0.2)',
    },
    
    // Button 组件颜色
    button: {
      primary: {
        background: tintColorDark,
        text: '#ffffff',
        shadow: `${tintColorDark}40`,
        disabled: `${tintColorDark}80`,
      },
      secondary: {
        background: '#b2b1b1',
        text: '#FFFFFF',
        shadow: 'rgba(0, 0, 0, 0.2)',
        disabled: '#222222',
      },
      outline: {
        border: tintColorDark,
        text: tintColorDark,
        disabled: '#1565C0',
      },
      ghost: {
        text: tintColorDark,
        disabled: '#1565C0',
      },
      danger: {
        background: '#FF5252',
        text: '#ffffff',
        shadow: '#FF525240',
        disabled: '#FF525280',
      },
    },
    
    // Chat 组件颜色
    chat: {
      userBubble: '#205c3b',
      botBubble: '#1e1e1e',
      thinkingBg: '#2a2a2a',
      userBubbleBorder: '#2d7a4f',
      botBubbleBorder: '#333333',
      timestamp: '#888888',
      sending: '#888888',
      sent: '#0288d1',
      error: '#d32f2f',
      retryButton: '#ff1744',
      markdownCode: 'rgba(255,255,255,0.1)',
      divider: '#424242',
      tableBorder: '#424242',
      tableHeaderBg: '#2c2c2c',
      blockquoteBg: 'rgba(255,255,255,0.03)',
      actionButtonBg: 'rgba(255,255,255,0.05)',
      actionButtonActiveBg: 'rgba(255,255,255,0.1)',
      actionButtonText: '#e0e0e0',
      selectedBubbleBg: 'rgba(66, 165, 245, 0.1)',
      bubbleShadowColor: 'rgba(0,0,0,0.2)',
      thinkingBubble: '#2a2a2a',
      thinkingBubbleBorder: '#3a3a3a',
      thinkingText: '#a0a0a0',
      metadataBorder: '#333333',
      metadataBackground: '#222222',
      toolCallBorder: '#4e9bff',
    },
  },
} as const;

// 类型定义
export type ColorScheme = keyof typeof Colors;
export type ColorKey = keyof (typeof Colors)['light'];
