import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useAuthStore } from '@/store/authStore';
import { usePairStore } from '@/store/pairStore';
import { getReceivedEntries } from '@/lib/supabase/entries';
import { ReceivedEntry } from '@/types';
import { Colors } from '@/constants/Colors';

const { width } = Dimensions.get('window');

export default function CoupleScreen() {
  const { profile } = useAuthStore();
  const { pair, partner, fetchPair } = usePairStore();
  const [receivedEntries, setReceivedEntries] = useState<ReceivedEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<ReceivedEntry | null>(null);

  useEffect(() => {
    if (profile) {
      fetchPair(profile.id);
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
      loadReceivedEntries(),
      profile ? fetchPair(profile.id) : Promise.resolve(),
    ]);
    setRefreshing(false);
  };

  // Anniversary counter
  const anniversaryDate = pair ? new Date(pair.paired_at) : null;
  const daysTogether = anniversaryDate
    ? Math.floor(
        (Date.now() - anniversaryDate.getTime()) / (1000 * 60 * 60 * 24)
      )
    : 0;

  if (!pair || !partner) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>💌</Text>
        <Text style={styles.emptyTitle}>パートナーとつながろう</Text>
        <Text style={styles.emptySubtext}>
          招待リンクを送って、{'\n'}二人だけの日記を始めよう
        </Text>
        <TouchableOpacity
          style={styles.inviteButton}
          onPress={() => router.push('/pairing/invite')}
        >
          <Ionicons name="link" size={18} color="#FFFFFF" />
          <Text style={styles.inviteButtonText}>招待リンクを作る</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.primary}
        />
      }
    >
      {/* Partner header */}
      <View style={styles.partnerHeader}>
        <View style={styles.partnerInfo}>
          <View style={styles.avatarContainer}>
            {partner.avatar_url ? (
              <Image
                source={{ uri: partner.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {(partner.display_name ?? '?')[0].toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <View>
            <Text style={styles.partnerName}>{partner.display_name}</Text>
            <Text style={styles.daysTogether}>
              ❤️ {daysTogether}日目
            </Text>
          </View>
        </View>
      </View>

      {/* Received entries */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>届いた作品</Text>
        {receivedEntries.length === 0 ? (
          <View style={styles.noEntries}>
            <Text style={styles.noEntriesEmoji}>🎨</Text>
            <Text style={styles.noEntriesText}>
              まだ作品が届いていません{'\n'}パートナーの作品を待ちましょう
            </Text>
          </View>
        ) : (
          <View style={styles.entriesGrid}>
            {receivedEntries.map((received) => (
              <TouchableOpacity
                key={received.id}
                style={styles.gridItem}
                onPress={() => setSelectedEntry(received)}
              >
                {received.is_visible && received.entry?.generated_image_url ? (
                  <Image
                    source={{ uri: received.entry.generated_image_url }}
                    style={styles.gridImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.blurredItem}>
                    {received.entry?.generated_image_url && (
                      <Image
                        source={{ uri: received.entry.generated_image_url }}
                        style={[styles.gridImage, { opacity: 0.15 }]}
                        blurRadius={10}
                      />
                    )}
                    <View style={styles.blurOverlay}>
                      <Ionicons
                        name="eye-off-outline"
                        size={24}
                        color={Colors.textSecondary}
                      />
                    </View>
                  </View>
                )}
                <Text style={styles.gridDate}>
                  {new Date(received.received_at).toLocaleDateString('ja-JP', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Monthly summary banner */}
      <TouchableOpacity style={styles.monthlyBanner}>
        <View style={styles.monthlyBannerContent}>
          <Text style={styles.monthlyBannerEmoji}>📅</Text>
          <View>
            <Text style={styles.monthlyBannerTitle}>今月の二人</Text>
            <Text style={styles.monthlyBannerSubtext}>
              月末に自動でまとめが届きます
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
      </TouchableOpacity>

      {/* Entry detail modal */}
      <Modal
        visible={selectedEntry !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedEntry(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedEntry(null)}
        >
          <View style={styles.modalContent}>
            {selectedEntry?.is_visible ? (
              <>
                {selectedEntry.entry?.generated_image_url && (
                  <Image
                    source={{ uri: selectedEntry.entry.generated_image_url }}
                    style={styles.modalImage}
                    resizeMode="cover"
                  />
                )}
                <View style={styles.modalBody}>
                  <Text style={styles.modalDate}>
                    {new Date(selectedEntry.received_at).toLocaleDateString(
                      'ja-JP',
                      { year: 'numeric', month: 'long', day: 'numeric' }
                    )}
                  </Text>
                  <Text style={styles.modalText}>
                    {selectedEntry.entry?.text}
                  </Text>
                  <View style={styles.modalTags}>
                    {selectedEntry.entry?.mood_tags.map((tag) => (
                      <View key={tag} style={styles.modalTag}>
                        <Text style={styles.modalTagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.withdrawnContent}>
                <Text style={styles.withdrawnEmoji}>🌫️</Text>
                <Text style={styles.withdrawnText}>
                  この作品は現在見られません
                </Text>
              </View>
            )}
          </View>
        </Pressable>
      </Modal>
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
  emptyContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  inviteButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  inviteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  partnerHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  partnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  partnerName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  daysTogether: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  noEntries: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  noEntriesEmoji: { fontSize: 48 },
  noEntriesText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  entriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridItem: {
    width: (width - 40 - 16) / 3,
    gap: 4,
  },
  gridImage: {
    width: '100%',
    aspectRatio: 0.75,
    borderRadius: 10,
  },
  blurredItem: {
    width: '100%',
    aspectRatio: 0.75,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(250,245,240,0.7)',
  },
  gridDate: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  monthlyBanner: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  monthlyBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  monthlyBannerEmoji: { fontSize: 32 },
  monthlyBannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  monthlyBannerSubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 380,
  },
  modalImage: {
    width: '100%',
    height: 280,
  },
  modalBody: {
    padding: 20,
    gap: 12,
  },
  modalDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  modalText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
  },
  modalTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  modalTag: {
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  modalTagText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  withdrawnContent: {
    padding: 48,
    alignItems: 'center',
    gap: 16,
  },
  withdrawnEmoji: { fontSize: 48 },
  withdrawnText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
