import { StyleSheet, Animated, Platform, useColorScheme, View } from 'react-native';
import { Swipeable, TouchableOpacity } from 'react-native-gesture-handler';
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
  onEdit: () => void;
  onDelete: () => void;
};

const SWIPE_WIDTH = 80;

export const BotCard = ({ 
  name, 
  description, 
  icon, 
  lastMessageAt,
  messagesCount,
  onPress,
  onEdit,
  onDelete
}: BotCardProps) => {
  const iconColor = useThemeColor({}, 'text');
  const cardBackgroundColor = useThemeColor({}, 'cardBackground');
  const dangerColor = useThemeColor({}, 'error');
  const primaryColor = useThemeColor({}, 'tint');
  const theme = useColorScheme();

  const renderLeftActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [0, SWIPE_WIDTH],
      outputRange: [0, 1],
      extrapolate: 'clamp'
    });

    return (
      <View style={{ width: SWIPE_WIDTH }}>
        <Animated.View
          style={[
            styles.leftAction,
            {
              backgroundColor: primaryColor as string,
              transform: [{ scale }],
            },
          ]}
        >
          <TouchableOpacity onPress={onEdit} style={styles.actionButton}>
            <FontAwesome name="gear" size={24} color="white" />
            <ThemedText style={styles.actionText}>
              {i18n.t('bot.edit')}
            </ThemedText>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-SWIPE_WIDTH, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp'
    });

    return (
      <View style={{ width: SWIPE_WIDTH }}>
        <Animated.View
          style={[
            styles.rightAction,
            {
              backgroundColor: dangerColor,
              transform: [{ scale }],
            },
          ]}
        >
          <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
            <FontAwesome name="trash" size={24} color="white" />
            <ThemedText style={styles.actionText}>
              {i18n.t('bot.delete')}
            </ThemedText>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  return (
    <Swipeable
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      friction={2}
      leftThreshold={20}
      rightThreshold={20}
    >
      <TouchableOpacity 
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
        onPress={onPress}
        activeOpacity={0.8}
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
      </TouchableOpacity>
    </Swipeable>
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
  leftAction: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  rightAction: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  actionButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: SWIPE_WIDTH,
    gap: 4,
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});
