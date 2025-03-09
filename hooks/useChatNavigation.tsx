import { useLayoutEffect } from 'react';
import { View, TouchableOpacity, Platform } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { FontAwesome5, FontAwesome } from '@expo/vector-icons';
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
  toggleSettings?: () => void; // 添加切换设置的回调
  showSettings?: boolean; // 添加显示设置的状态
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
      headerTitleAlign: 'center',
      title: isSelectMode
        ? `${selectedMessagesCount} ${i18n.t('chat.selectedCount')}`
        : botName || 'Chat',
      headerStyle: {
        height: headerHeight,
      },
      headerTitleStyle: {
        fontSize: isSelectMode ? 16 : 17,
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
            <TouchableOpacity
              onPress={() => setShowDeleteDialog(true)}
              style={styles.headerButton}
            >
              <FontAwesome5 name="trash" size={16} color={errorColor} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.headerElementContainer}>
            {/* 添加设置按钮 */}
            {toggleSettings && (
              <TouchableOpacity
                onPress={toggleSettings}
                style={styles.headerButton}
              >
                <FontAwesome5 
                  name="cog" 
                  size={16} 
                  color={showSettings ? '#2196F3' : iconColor}
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={manualRefresh}
              style={styles.headerButton}
            >
              <FontAwesome name="refresh" size={16} color={iconColor} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push(`/editBot/${botId}`)}
              style={styles.headerButton}
            >
              <FontAwesome name="navicon" size={16} color={iconColor} />
            </TouchableOpacity>
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
            <TouchableOpacity
              onPress={handleCancelSelect}
              style={styles.headerButton}
            >
              <FontAwesome5 name="times" size={18} color={iconColor} />
            </TouchableOpacity>
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
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginHorizontal: 4,
  },
});
