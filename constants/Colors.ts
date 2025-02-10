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
    secondaryText: '#687076',
    
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
        disabled: '#B3E5FC',  // 添加较淡的蓝色作为禁用状态
      },
      ghost: {
        text: tintColorLight,
        disabled: '#B3E5FC',  // 同样添加较淡的蓝色作为禁用状态
      },
      danger: {
        background: '#FF5252',
        text: '#ffffff',
        shadow: '#FF525240',
        disabled: '#FF525280',
      },
    },
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    settingItemBackground: '#1A1D1E',
    secondaryText: '#9BA1A6',
    
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
  },
};
