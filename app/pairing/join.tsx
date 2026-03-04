import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { joinPair } from '@/lib/supabase/pairs';
import { usePairStore } from '@/store/pairStore';
import { useAuthStore } from '@/store/authStore';
import { Colors } from '@/constants/Colors';

export default function JoinPairingScreen() {
  const { inviter } = useLocalSearchParams<{ inviter: string }>();
  const { profile } = useAuthStore();
  const { fetchPair } = usePairStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleJoin = async () => {
    if (!inviter) {
      Alert.alert('エラー', '無効な招待リンクです');
      return;
    }

    setIsLoading(true);
    try {
      const { pair, error } = await joinPair(inviter);
      if (error) throw error;

      setIsSuccess(true);
      if (profile) await fetchPair(profile.id);

      setTimeout(() => {
        router.replace('/(tabs)/couple');
      }, 2000);
    } catch (err: any) {
      Alert.alert('エラー', err.message ?? 'ペアリングに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <View style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.title}>ペアリング完了！</Text>
          <Text style={styles.description}>
            二人の日記を始めましょう
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.emoji}>💕</Text>
        <Text style={styles.title}>ペアリングの招待</Text>
        <Text style={styles.description}>
          パートナーからの招待が届いています。{'\n'}
          タップしてペアリングを完了しましょう。
        </Text>
      </View>

      {!inviter ? (
        <View style={styles.errorBox}>
          <Ionicons name="warning-outline" size={32} color={Colors.warning} />
          <Text style={styles.errorText}>無効な招待リンクです</Text>
        </View>
      ) : (
        <View style={styles.confirmBox}>
          <Ionicons name="link" size={32} color={Colors.primary} />
          <Text style={styles.confirmText}>
            招待を受け入れると、{'\n'}お互いの作品を共有できるようになります。
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.joinButton, (!inviter || isLoading) && styles.joinButtonDisabled]}
          onPress={handleJoin}
          disabled={!inviter || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="heart" size={20} color="#FFFFFF" />
              <Text style={styles.joinButtonText}>ペアリングする</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>キャンセル</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.notes}>
        <View style={styles.noteItem}>
          <Ionicons name="shield-checkmark-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.noteText}>ペアリングは1対1限定です</Text>
        </View>
        <View style={styles.noteItem}>
          <Ionicons name="eye-off-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.noteText}>日記は二人以外には公開されません</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 24,
    gap: 32,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    gap: 12,
  },
  emoji: { fontSize: 64 },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  errorBox: {
    backgroundColor: '#FFF3CD',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    fontSize: 15,
    color: Colors.text,
    textAlign: 'center',
  },
  confirmBox: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary + '44',
  },
  confirmText: {
    fontSize: 15,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 24,
  },
  actions: {
    gap: 12,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  notes: {
    gap: 12,
  },
  noteItem: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
