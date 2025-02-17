import { StyleSheet, TouchableOpacity, Platform, useColorScheme, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import i18n from '@/i18n/i18n';

export type BotCardProps = {
  id: string;
  name: string;
  description: string;
  icon: string;
  lastMessageAt?: number;
  messagesCount?: number;
  onPress: () => void;
};

export const BotCard = ({ 
  name, 
  description, 
  icon, 
  lastMessageAt,
  messagesCount,
  onPress 
}: BotCardProps) => {
  const iconColor = useThemeColor({}, 'text');
  const cardBackgroundColor = useThemeColor({}, 'cardBackground');
  const theme = useColorScheme();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <ThemedView 
        style={[
          styles.card, 
          { 
            backgroundColor: cardBackgroundColor,
            ...Platform.select({
              ios: {
                shadowColor: theme === 'light' ? '#000' : '#FFF',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
              },
              android: {
                elevation: theme === 'light' ? 2 : 0,
              },
            }),
          }
        ]}
      >
        <ThemedView style={styles.iconContainer}>
          <FontAwesome name={icon as any} size={24} color={iconColor} />
        </ThemedView>
        <View style={styles.cardContent}>
          <ThemedText type="subtitle">{name}</ThemedText>
          <ThemedText style={styles.description}>{description}</ThemedText>
          {lastMessageAt && (
            <ThemedText style={styles.lastMessage}>
              {`${i18n.t('bot.lastMessage')}: ${new Date(lastMessageAt).toLocaleString()}`}
            </ThemedText>
          )}
          {messagesCount !== undefined && (
            <ThemedText style={styles.messageCount}>
              {`${i18n.t('bot.messageCount')}: ${messagesCount}`}
            </ThemedText>
          )}
        </View>
      </ThemedView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  description: {
    marginTop: 4,
    fontSize: 14,
  },
  lastMessage: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  messageCount: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.7,
  },
});
