import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getEntryById, withdrawEntry } from '@/lib/supabase/entries';
import { Entry } from '@/types';
import { MOOD_OPTIONS } from '@/constants/Moods';
import { Colors } from '@/constants/Colors';
import { useEntryStore } from '@/store/entryStore';

const { width } = Dimensions.get('window');

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const removeEntry = useEntryStore((s) => s.removeEntry);

  useEffect(() => {
    if (id) loadEntry();
  }, [id]);

  const loadEntry = async () => {
    setIsLoading(true);
    const { entry: data } = await getEntryById(id);
    setEntry(data as Entry);
    setIsLoading(false);
  };

  const handleDelete = () => {
    Alert.alert('削除', 'この記録を削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          await removeEntry(id);
          router.back();
        },
      },
    ]);
  };

  const handleWithdraw = () => {
    if (!entry?.is_shared) return;
    Alert.alert('取り下げ', '共有した作品を取り下げますか？\n相手側ではぼかし表示になります。', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '取り下げる',
        style: 'destructive',
        onPress: async () => {
          const { entry: updated } = await withdrawEntry(id);
          if (updated) setEntry(updated as Entry);
          Alert.alert('取り下げました');
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (!entry) {
    return (
      <View style={styles.loading}>
        <Text style={styles.errorText}>記録が見つかりません</Text>
      </View>
    );
  }

  const moodLabels = entry.mood_tags
    .map((tag) => MOOD_OPTIONS.find((m) => m.tag === tag))
    .filter(Boolean);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen
        options={{
          title: '日記の詳細',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={22} color={Colors.primary} />
              <Text style={styles.backButtonText}>戻る</Text>
            </TouchableOpacity>
          ),
        }}
      />
      {/* Artwork */}
      {entry.generated_image_url ? (
        <Image
          source={{ uri: entry.generated_image_url }}
          style={styles.artwork}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.artworkPlaceholder}>
          <Ionicons name="image-outline" size={48} color={Colors.textLight} />
          <Text style={styles.noArtworkText}>画像なし</Text>
        </View>
      )}

      {/* Status badges */}
      <View style={styles.badges}>
        {entry.is_shared && !entry.is_withdrawn && (
          <View style={styles.badge}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
            <Text style={styles.badgeText}>共有済み</Text>
          </View>
        )}
        {entry.is_withdrawn && (
          <View style={[styles.badge, styles.withdrawnBadge]}>
            <Ionicons name="eye-off-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.badgeText}>取り下げ済み</Text>
          </View>
        )}
        {!entry.is_shared && (
          <View style={[styles.badge, styles.privateBadge]}>
            <Ionicons name="lock-closed-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.badgeText}>非公開</Text>
          </View>
        )}
      </View>

      {/* Date */}
      <Text style={styles.date}>
        {new Date(entry.created_at).toLocaleDateString('ja-JP', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'long',
        })}
      </Text>

      {/* Text */}
      <Text style={styles.entryText}>{entry.text}</Text>

      {/* Mood tags */}
      <View style={styles.moodSection}>
        <Text style={styles.moodTitle}>気分</Text>
        <View style={styles.moodRow}>
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

      {/* Actions */}
      <View style={styles.actionsSection}>
        {entry.is_shared && !entry.is_withdrawn && (
          <TouchableOpacity style={styles.actionButton} onPress={handleWithdraw}>
            <Ionicons name="arrow-undo-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.actionButtonText}>取り下げる</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={18} color={Colors.error} />
          <Text style={styles.deleteButtonText}>削除する</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: 40,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingLeft: 4,
  },
  backButtonText: {
    fontSize: 17,
    color: Colors.primary,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  artwork: {
    width,
    height: width * 1.3,
  },
  artworkPlaceholder: {
    width,
    height: width,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  noArtworkText: {
    fontSize: 16,
    color: Colors.textLight,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
  },
  withdrawnBadge: {
    backgroundColor: Colors.surfaceSecondary,
  },
  privateBadge: {
    backgroundColor: Colors.surfaceSecondary,
  },
  badgeText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  date: {
    paddingHorizontal: 20,
    paddingTop: 12,
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  entryText: {
    paddingHorizontal: 20,
    paddingTop: 12,
    fontSize: 18,
    color: Colors.text,
    lineHeight: 28,
  },
  moodSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 10,
  },
  moodTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  moodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  moodEmoji: { fontSize: 16 },
  moodLabel: {
    fontSize: 14,
    color: Colors.text,
  },
  actionsSection: {
    paddingHorizontal: 20,
    paddingTop: 32,
    gap: 12,
  },
  actionButton: {
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
  actionButtonText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  deleteButton: {
    borderColor: Colors.error + '44',
    backgroundColor: Colors.error + '0A',
  },
  deleteButtonText: {
    fontSize: 15,
    color: Colors.error,
  },
});
