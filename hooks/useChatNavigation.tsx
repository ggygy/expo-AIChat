import { useLayoutEffect } from 'react';
import { View, Pressable, Platform } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { StyleSheet } from 'react-native';
import i18n from '@/i18n/i18n';

interface UseChatNavigationProps {
  botName?: string;
  iconColor: string;
  errorColor: string;
  botId: string;
  isSelectMode: boolean;
  selectedMessagesCount: number;
  handleCancelSelect: () => void;
  setShowDeleteDialog: (show: boolean) => void;
  manualRefresh: () => void;
  headerHeight?: number;
  toggleSettings?: () => void;
  showSettings?: boolean;
}

export function useChatNavigation({
  botName,
  iconColor,
  errorColor,
  botId,
  isSelectMode,
  selectedMessagesCount,
  handleCancelSelect,
  setShowDeleteDialog,
  manualRefresh,
  headerHeight = Platform.OS === 'ios' ? 50 : 56,
  toggleSettings,
  showSettings = false
}: UseChatNavigationProps) {
  const navigation = useNavigation();
  const router = useRouter();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitleAlign: 'start',
      title: isSelectMode
        ? `${selectedMessagesCount} ${i18n.t('chat.selectedCount')}`
        : botName || 'Chat',
      headerStyle: {
        height: headerHeight,
      },
      headerTitleStyle: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: Platform.OS === 'ios' ? -4 : -2,
      },
      headerTitleContainerStyle: {
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: Platform.OS === 'ios' ? -4 : -2,
      },
      headerRight: () => (
        isSelectMode ? (
          <View style={styles.headerElementContainer}>
            <Pressable
              onPressIn={() => setShowDeleteDialog(true)}
              style={({ pressed }) => [
                styles.headerButton,
                pressed && styles.headerButtonPressed
              ]}
              android_ripple={{ color: 'rgba(255, 0, 0, 0.2)', borderless: true, radius: 20 }}
              hitSlop={{ top: 15, bottom: 15, left: 10, right: 10 }}
            >
              <IconSymbol type='fontAwesome5' name="trash" size={20} color={errorColor} />
            </Pressable>
          </View>
        ) : (
          <View style={styles.headerElementContainer}>
            {/* 添加设置按钮 */}
            {toggleSettings && (
              <Pressable
                onPressIn={toggleSettings}
                style={({ pressed }) => [
                  styles.headerButton,
                  pressed && styles.headerButtonPressed
                ]}
                android_ripple={{ color: 'rgba(33, 150, 243, 0.2)', borderless: true, radius: 20 }}
                hitSlop={{ top: 15, bottom: 15, left: 10, right: 10 }}
              >
                <IconSymbol 
                  name="cog" 
                  size={21} 
                  type='fontAwesome5'
                  color={showSettings ? '#2196F3' : iconColor}
                />
              </Pressable>
            )}
            <Pressable
              onPressIn={manualRefresh}
              style={({ pressed }) => [
                styles.headerButton,
                pressed && styles.headerButtonPressed
              ]}
              android_ripple={{ color: 'rgba(0, 0, 0, 0.2)', borderless: true, radius: 20 }}
              hitSlop={{ top: 15, bottom: 15, left: 10, right: 10 }}
            >
              <IconSymbol type='fontAwesome' name="refresh" size={21} color={iconColor} />
            </Pressable>
            <Pressable
              onPressIn={() => router.push(`/editBot/${botId}`)}
              style={({ pressed }) => [
                styles.headerButton,
                pressed && styles.headerButtonPressed
              ]}
              android_ripple={{ color: 'rgba(0, 0, 0, 0.2)', borderless: true, radius: 20 }}
              hitSlop={{ top: 15, bottom: 15, left: 10, right: 10 }}
            >
              <IconSymbol type='fontAwesome' name="navicon" size={21} color={iconColor} />
            </Pressable>
          </View>
        )
      ),
      // 调整右侧容器样式使其垂直居中
      headerRightContainerStyle: {
        justifyContent: 'center',
        // 微调右侧容器位置
        marginTop: Platform.OS === 'ios' ? -4 : -2,
      },
      headerLeft: () => (
        isSelectMode ? (
          <View style={styles.headerElementContainer}>
            <Pressable
              onPressIn={handleCancelSelect}
              style={({ pressed }) => [
                styles.headerButton,
                pressed && styles.headerButtonPressed
              ]}
              android_ripple={{ color: 'rgba(0, 0, 0, 0.2)', borderless: true, radius: 20 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <IconSymbol type='fontAwesome5' name="times" size={21} color={iconColor} />
            </Pressable>
          </View>
        ) : undefined
      ),
      // 调整左侧容器样式使其垂直居中
      headerLeftContainerStyle: {
        justifyContent: 'center',
        // 微调左侧容器位置
        marginTop: Platform.OS === 'ios' ? -4 : -2,
      },
    });
  }, [
    navigation,
    botName,
    iconColor,
    errorColor,
    botId,
    isSelectMode,
    selectedMessagesCount,
    handleCancelSelect,
    router,
    manualRefresh,
    setShowDeleteDialog,
    headerHeight,
    toggleSettings,
    showSettings
  ]);
  
  return {
    headerHeight
  };
}

const styles = StyleSheet.create({
  headerElementContainer: {
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // 微调垂直位置
    marginTop: Platform.OS === 'ios' ? -2 : 0,
  },
  headerButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButton: {
    paddingHorizontal: 6,
    marginHorizontal: 4,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  headerButtonPressed: {
    opacity: 0.7,
    backgroundColor: Platform.OS === 'ios' ? 'rgba(0,0,0,0.05)' : undefined,
    transform: [{ scale: 0.96 }],
  },
});
