import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { usePairStore } from '@/store/pairStore';
import { useEntryStore } from '@/store/entryStore';
import { getReceivedEntries } from '@/lib/supabase/entries';
import { ReceivedEntry, Entry } from '@/types';
import { Colors } from '@/constants/Colors';

export default function HomeScreen() {
  const { profile } = useAuthStore();
  const { pair, partner, fetchPair } = usePairStore();
  const { entries, fetchEntries, isLoading } = useEntryStore();
  const [receivedEntries, setReceivedEntries] = useState<ReceivedEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const todayEntry = entries.find(
    (e) => e.created_at.startsWith(today)
  );
  const recentEntries = entries.slice(0, 3).filter((e) => !e.created_at.startsWith(today));

  useEffect(() => {
    if (profile) {
      fetchPair(profile.id);
      fetchEntries();
      loadReceivedEntries();
    }
  }, [profile]);

  const loadReceivedEntries = async () => {
    const { receivedEntries: data } = await getReceivedEntries();
    if (data) setReceivedEntries(data as ReceivedEntry[]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchEntries(),
      loadReceivedEntries(),
      profile ? fetchPair(profile.id) : Promise.resolve(),
    ]);
    setRefreshing(false);
  };

  const newReceivedCount = receivedEntries.filter(
    (r) => r.is_visible && !r.is_visible
  ).length;
  const hasNewEntry = receivedEntries.some((r) => r.is_visible);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
      }
    >
      {/* New entry banner */}
      {hasNewEntry && (
        <TouchableOpacity
          style={styles.banner}
          onPress={() => router.push('/(tabs)/couple')}
        >
          <Text style={styles.bannerText}>❤️ 作品が届いています</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
        </TouchableOpacity>
      )}

      {/* Greeting */}
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>
          こんにちは、{profile?.display_name ?? 'さん'} 👋
        </Text>
        <Text style={styles.dateText}>
          {new Date().toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'short',
          })}
        </Text>
      </View>

      {/* Today's entry */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>今日の記録</Text>
        {todayEntry ? (
          <TouchableOpacity
            style={styles.entryCard}
            onPress={() => router.push(`/entry/${todayEntry.id}`)}
          >
            {todayEntry.generated_image_url ? (
              <Image
                source={{ uri: todayEntry.generated_image_url }}
                style={styles.entryImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.entryImagePlaceholder}>
                <Ionicons name="image-outline" size={40} color={Colors.textLight} />
              </View>
            )}
            <View style={styles.entryCardContent}>
              <Text style={styles.entryText} numberOfLines={2}>
                {todayEntry.text}
              </Text>
              <View style={styles.moodTags}>
                {todayEntry.mood_tags.slice(0, 3).map((tag) => (
                  <View key={tag} style={styles.moodTag}>
                    <Text style={styles.moodTagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.emptyEntry}
            onPress={() => router.push('/entry/create')}
          >
            <Ionicons name="add-circle-outline" size={40} color={Colors.primary} />
            <Text style={styles.emptyEntryText}>今日はまだ記録がありません</Text>
            <Text style={styles.emptyEntrySubtext}>タップして今日の気持ちを記録しよう</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Recent entries */}
      {recentEntries.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>最近の記録</Text>
          <View style={styles.recentList}>
            {recentEntries.map((entry) => (
              <TouchableOpacity
                key={entry.id}
                style={styles.recentCard}
                onPress={() => router.push(`/entry/${entry.id}`)}
              >
                {entry.generated_image_url ? (
                  <Image
                    source={{ uri: entry.generated_image_url }}
                    style={styles.recentImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.recentImage, styles.recentImagePlaceholder]}>
                    <Ionicons name="image-outline" size={24} color={Colors.textLight} />
                  </View>
                )}
                <View style={styles.recentContent}>
                  <Text style={styles.recentDate}>
                    {new Date(entry.created_at).toLocaleDateString('ja-JP', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                  <Text style={styles.recentText} numberOfLines={2}>
                    {entry.text}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Create new entry FAB */}
      {todayEntry && (
        <View style={styles.fabContainer}>
          <TouchableOpacity
            style={styles.fab}
            onPress={() => router.push('/entry/create')}
          >
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: 100,
  },
  banner: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  bannerText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  greeting: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
    gap: 4,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  },
  dateText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  entryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  entryImage: {
    width: '100%',
    height: 200,
  },
  entryImagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryCardContent: {
    padding: 16,
    gap: 10,
  },
  entryText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  moodTags: {
    flexDirection: 'row',
    gap: 6,
  },
  moodTag: {
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  moodTagText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  emptyEntry: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  emptyEntryText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  emptyEntrySubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  recentList: {
    gap: 10,
  },
  recentCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  recentImage: {
    width: 80,
    height: 80,
  },
  recentImagePlaceholder: {
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentContent: {
    flex: 1,
    padding: 12,
    gap: 6,
  },
  recentDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  recentText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
});
