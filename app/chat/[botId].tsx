import { useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

export default function ChatScreen() {
  const { providerId, modelId } = useLocalSearchParams<{
    providerId: string;
    modelId: string;
  }>();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">
        Chat with {providerId} - {modelId}
      </ThemedText>
      {/* 这里后续添加聊天界面的具体实现 */}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});
