import { StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import i18n from '@/i18n/i18n';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { BotCard } from '@/components/BotCard';
import { useBotStore } from '@/store/useBotStore';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useLanguageStore } from '@/store/useLanguageStore';

export default function HomeScreen() {
  const router = useRouter();
  const bots = useBotStore(state => state.bots);
  const availableBots = useBotStore(state => state.getAvailableBots());
  const subtitleColor = useThemeColor({}, 'secondaryText');
  const currentLanguage = useLanguageStore(state => state.currentLanguage);

  const handleBotPress = (botId: string) => {
    router.navigate(`/chat/${botId}`);
  };

  const handleCreateBot = () => {
    router.push('/newBot');
  };

  return (
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
                  description={item.description || `${item.providerId} - ${item.modelId}`}
                  icon="robot"
                  onPress={() => handleBotPress(item.id)}
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
    gap: 10,
    paddingVertical: 5,
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
