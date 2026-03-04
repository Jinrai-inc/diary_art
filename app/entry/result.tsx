import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
  Share,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEntryStore } from '@/store/entryStore';
import { usePairStore } from '@/store/pairStore';
import { useAuthStore } from '@/store/authStore';
import { shareEntry, withdrawEntry } from '@/lib/supabase/entries';
import { Colors } from '@/constants/Colors';
import { MOOD_OPTIONS } from '@/constants/Moods';

const { width, height } = Dimensions.get('window');

export default function ResultScreen() {
  const { currentEntry, retryGenerate, isGenerating, retryCount, maxRetries, resetDraft, updateEntry } =
    useEntryStore();
  const { partner } = usePairStore();
  const { profile } = useAuthStore();
  const [isSent, setIsSent] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoCountdown = useRef(5);

  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    };
  }, []);

  if (!currentEntry) {
    router.replace('/(tabs)');
    return null;
  }

  const moodLabels = currentEntry.mood_tags
    .map((tag) => MOOD_OPTIONS.find((m) => m.tag === tag))
    .filter(Boolean);

  const handleSave = () => {
    resetDraft();
    Alert.alert('保存しました', '作品をプライベートとして保存しました', [
      { text: 'OK', onPress: () => router.replace('/(tabs)') },
    ]);
  };

  const handleShare = async () => {
    if (!partner) {
      Alert.alert('ペアリングが必要です', 'パートナーとペアリングしてから共有できます');
      return;
    }

    const { error } = await shareEntry(currentEntry.id, partner.id as string);
    if (error) {
      Alert.alert('エラー', '送信に失敗しました');
      return;
    }

    setIsSent(true);
    setCanUndo(true);

    undoTimeoutRef.current = setTimeout(() => {
      setCanUndo(false);
      resetDraft();
      router.replace('/(tabs)');
    }, 5000);
  };

  const handleUndo = async () => {
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    setCanUndo(false);
    setIsSent(false);

    await withdrawEntry(currentEntry.id);
    updateEntry({ ...currentEntry, is_shared: false, is_withdrawn: true });
    Alert.alert('取り消しました', '送信を取り消しました');
  };

  const handleSNSShare = async () => {
    if (!currentEntry.generated_image_url) return;
    await Share.share({
      message: `今日の気持ちを水彩画にしました ✨\n${currentEntry.text}`,
      url: currentEntry.generated_image_url,
    });
  };

  const handleRetry = async () => {
    if (retryCount >= maxRetries) {
      Alert.alert(
        'リトライ上限',
        'リトライ回数の上限に達しました。Premiumにアップグレードするとリトライ回数が増えます。'
      );
      return;
    }
    await retryGenerate(currentEntry.id);
  };

  return (
    <View style={styles.container}>
      {/* Artwork */}
      <View style={styles.artworkContainer}>
        {currentEntry.generated_image_url ? (
          <Image
            source={{ uri: currentEntry.generated_image_url }}
            style={styles.artwork}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.artworkPlaceholder}>
            <Text style={styles.placeholderEmoji}>🎨</Text>
            <Text style={styles.placeholderText}>生成中...</Text>
          </View>
        )}

        {/* Retry button */}
        {!isSent && retryCount < maxRetries && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRetry}
            disabled={isGenerating}
          >
            <Ionicons
              name="refresh"
              size={20}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Entry info */}
      <View style={styles.infoSection}>
        <Text style={styles.entryText} numberOfLines={3}>
          {currentEntry.text}
        </Text>
        <View style={styles.tagRow}>
          {moodLabels.map((mood) => (
            <View
              key={mood!.tag}
              style={[styles.moodChip, { backgroundColor: mood!.color + '44' }]}
            >
              <Text style={styles.moodEmoji}>{mood!.emoji}</Text>
              <Text style={styles.moodLabel}>{mood!.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Undo button (5 second window) */}
      {canUndo && (
        <TouchableOpacity style={styles.undoButton} onPress={handleUndo}>
          <Ionicons name="arrow-undo" size={16} color={Colors.textSecondary} />
          <Text style={styles.undoText}>取り消す（5秒以内）</Text>
        </TouchableOpacity>
      )}

      {/* Action buttons */}
      {!isSent && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.saveButtonText}>保存（非公開）</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="heart" size={20} color="#FFFFFF" />
            <Text style={styles.shareButtonText}>
              {partner ? `${partner.display_name}に送る` : '相手に送る'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.snsButton} onPress={handleSNSShare}>
            <Ionicons name="share-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.snsButtonText}>SNSに書き出し</Text>
          </TouchableOpacity>
        </View>
      )}

      {isSent && !canUndo && (
        <View style={styles.sentMessage}>
          <Text style={styles.sentEmoji}>💌</Text>
          <Text style={styles.sentText}>送信しました</Text>
        </View>
      )}

      {isSent && canUndo && (
        <View style={styles.sentMessage}>
          <Text style={styles.sentEmoji}>💌</Text>
          <Text style={styles.sentText}>
            {partner?.display_name ?? 'パートナー'}に送りました
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  artworkContainer: {
    position: 'relative',
    flex: 1,
    maxHeight: height * 0.55,
  },
  artwork: {
    width: '100%',
    height: '100%',
  },
  artworkPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  placeholderEmoji: { fontSize: 48 },
  placeholderText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  retryButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(250,245,240,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  entryText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  moodEmoji: { fontSize: 14 },
  moodLabel: {
    fontSize: 13,
    color: Colors.text,
  },
  undoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: 20,
    marginTop: 12,
    paddingVertical: 10,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 20,
  },
  undoText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  actions: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
    gap: 12,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 50,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  saveButtonText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  shareButton: {
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
  shareButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  snsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 50,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  snsButtonText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  sentMessage: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  sentEmoji: { fontSize: 48 },
  sentText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
});
