import { StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import i18n from '@/i18n/i18n';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { useBotStore } from '@/store/useBotStore';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useState } from 'react';
import { type ModelProviderId } from '@/constants/ModelProviders';
import Toast from 'react-native-toast-message';
import BotCard from '@/components/bot/BotCard';
import { useLanguageStore } from '@/store/useLanguageStore';
import { messageDb } from '@/database';
import { showError, showSuccess } from '@/utils/toast';

export default function HomeScreen() {
  const router = useRouter();
  const bots = useBotStore(state => state.bots);
  const deleteBot = useBotStore(state => state.deleteBot);
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);

  const handleBotPress = (id: string) => {
    router.navigate(`/chat/${id}`);
  };

  const handleCreateBot = () => {
    router.push('/newBot');
  };

  const handleEditBot = (botId: string) => {
    router.push(`/editBot/${botId}`);
  };

  const handleDeleteBot = (botId: string) => {
    setSelectedBotId(botId);
    setDeleteDialogVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedBotId) {
      try {
        await messageDb.deleteMessages(selectedBotId);
        deleteBot(selectedBotId);
        showSuccess('bot.deleteSuccess');
      } catch (error) {
        console.error('删除机器人及聊天记录失败:', error);
        showError('bot.deleteFailed');
      }
    }
    setDeleteDialogVisible(false);
    setSelectedBotId(null);
  };

  const handleCancelDelete = () => {
    setDeleteDialogVisible(false);
    setSelectedBotId(null);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.container}>
          <ThemedView style={styles.header}>
            <ThemedText type="subtitle">{i18n.t('home.title')}</ThemedText>
          </ThemedView>

          {bots.length === 0 ? (
            <ThemedView style={styles.emptyState}>
              <ThemedText>{i18n.t('home.noBots')}</ThemedText>
              <ThemedText>{i18n.t('home.createBotPrompt')}</ThemedText>
              <Button 
                variant="primary"
                onPress={handleCreateBot}
              >
                {i18n.t('bot.create')}
              </Button>
            </ThemedView>
          ) : (
            <>
              <FlatList
                data={bots}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <BotCard
                    {...item}
                    description={item.description || `${item.modelId}`}
                    onPress={() => handleBotPress(item.id)}
                    onEdit={() => handleEditBot(item.id)}
                    onDelete={() => handleDeleteBot(item.id)}
                    providerId={item.providerId as ModelProviderId}
                  />
                )}
                contentContainerStyle={styles.list}
              />
              <Button 
                variant="primary"
                style={styles.floatingButton}
                onPress={handleCreateBot}
              >
                {i18n.t('bot.create')}
              </Button>
            </>
          )}
        </ThemedView>
      </SafeAreaView>
      <ConfirmDialog
        visible={deleteDialogVisible}
        title={i18n.t('bot.deleteConfirmTitle')}
        message={i18n.t('bot.deleteConfirmMessage')}
        confirmText={i18n.t('common.delete')}
        cancelText={i18n.t('common.cancel')}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        variant="danger"
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 16,
  },
  subtitle: {
    marginTop: 8,
  },
  list: {
    gap: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  floatingButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    borderRadius: 28,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
