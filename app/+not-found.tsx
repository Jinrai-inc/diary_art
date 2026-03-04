import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🔍</Text>
      <Text style={styles.title}>ページが見つかりません</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.replace('/(tabs)')}>
        <Text style={styles.buttonText}>ホームへ戻る</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  emoji: { fontSize: 48 },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 50,
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
