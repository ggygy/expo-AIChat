import React, { memo } from 'react';
import { StyleSheet, Animated, Platform, useColorScheme, View } from 'react-native';
import { Swipeable, TouchableOpacity } from 'react-native-gesture-handler';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { getProviderIcon, type IconNames } from '@/constants/IconType';
import { ModelProviderId } from '@/constants/ModelProviders';
import { IconSymbol } from '../ui/IconSymbol';
import CustomIcon from '../ui/CustomIcon';
import i18n from '@/i18n/i18n';


export type BotCardProps = {
  id: string;
  name: string;
  description: string;
  providerId: ModelProviderId;
  lastMessageAt?: number;
  messagesCount?: number;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

const SWIPE_WIDTH = 80;

const BotCard: React.FC<BotCardProps> = ({ 
  name, 
  description,
  lastMessageAt,
  messagesCount,
  providerId,
  onPress,
  onEdit,
  onDelete
}) => {
  const iconColor = useThemeColor({}, 'text');
  const cardBackgroundColor = useThemeColor({}, 'background');
  const dangerColor = useThemeColor({}, 'error');
  const primaryColor = useThemeColor({}, 'tint');
  const theme = useColorScheme();
  const iconConfig = getProviderIcon(providerId);

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
            <IconSymbol name="gear" type="fontAwesome" size={22} color="white" />
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
            <IconSymbol name="trash" type="fontAwesome" size={22} color="white" />
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
          <CustomIcon 
            name={iconConfig.name as IconNames} 
            size={iconConfig.size} 
            color={iconConfig.defaultColor || iconColor}
          />
        </ThemedView>
        <View style={styles.cardContent}>
          <View style={styles.titleRow}>
            <ThemedText type="subtitle" style={styles.name}>{name}</ThemedText>
            <ThemedText style={styles.description}>{description}</ThemedText>
          </View>
          {(lastMessageAt || messagesCount) ? (
            <View style={styles.statsRow}>
              {lastMessageAt && (
                <ThemedText style={styles.statsText}>
                  {new Date(lastMessageAt).toLocaleString()}
                </ThemedText>
              )}
              {messagesCount !== undefined && (
                <ThemedText style={styles.statsText}>
                  {`${messagesCount} ${i18n.t('bot.messages')}`}
                </ThemedText>
              )}
            </View>
          ): (
            <ThemedText style={styles.statsText}>
              {i18n.t('bot.noMessages')} - {i18n.t('bot.startChat')}
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
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    flex: 0,
  },
  description: {
    fontSize: 14,
    opacity: 0.7,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 12,
  },
  statsText: {
    fontSize: 12,
    opacity: 0.7,
  },
  leftAction: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  rightAction: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
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

export default memo(BotCard);
