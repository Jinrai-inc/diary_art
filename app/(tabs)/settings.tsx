import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { usePairStore } from '@/store/pairStore';
import { signOut } from '@/lib/supabase/auth';
import { dissolvePair } from '@/lib/supabase/pairs';
import { Colors } from '@/constants/Colors';

export default function SettingsScreen() {
  const { profile, reset: resetAuth } = useAuthStore();
  const { pair, partner, reset: resetPair } = usePairStore();
  const [withdrawalNotification, setWithdrawalNotification] = useState(false);
  const [dissolutionNotification, setDissolutionNotification] = useState(false);
  const [receivedNotification, setReceivedNotification] = useState(true);
  const [monthlySummaryNotification, setMonthlySummaryNotification] = useState(true);

  const handleSignOut = () => {
    Alert.alert('ログアウト', 'ログアウトしますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: 'ログアウト',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          resetAuth();
          resetPair();
          router.replace('/(auth)');
        },
      },
    ]);
  };

  const handleDissolvePair = () => {
    Alert.alert(
      'ペアリングを解除',
      `${partner?.display_name ?? 'パートナー'}とのペアリングを解除しますか？\n\n解除後、相手に届いた作品はぼかし表示になります。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '解除する',
          style: 'destructive',
          onPress: async () => {
            if (!pair) return;
            const { error } = await dissolvePair(pair.id, dissolutionNotification);
            if (error) {
              Alert.alert('エラー', '解除に失敗しました');
            } else {
              resetPair();
              Alert.alert('解除完了', 'ペアリングを解除しました');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile section */}
      <View style={styles.section}>
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {(profile?.display_name ?? '?')[0].toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile?.display_name}</Text>
            <Text style={styles.profileEmail}>{profile?.email}</Text>
          </View>
          <TouchableOpacity style={styles.editButton}>
            <Ionicons name="pencil-outline" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Premium badge */}
        {profile?.premium_status === 'premium' ? (
          <View style={styles.premiumBadge}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.premiumBadgeText}>Premiumプラン</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.premiumBanner}>
            <View style={styles.premiumBannerContent}>
              <Text style={styles.premiumBannerTitle}>✨ Premiumにアップグレード</Text>
              <Text style={styles.premiumBannerSubtext}>
                月額600円 / 年額5,800円（19%割引）
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Notification settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>通知設定</Text>
        <View style={styles.settingsCard}>
          <SettingRow
            label="作品が届いたとき"
            value={receivedNotification}
            onChange={setReceivedNotification}
          />
          <View style={styles.divider} />
          <SettingRow
            label="月間まとめが届いたとき"
            value={monthlySummaryNotification}
            onChange={setMonthlySummaryNotification}
          />
          <View style={styles.divider} />
          <SettingRow
            label="作品が取り下げられたとき"
            value={withdrawalNotification}
            onChange={setWithdrawalNotification}
          />
          <View style={styles.divider} />
          <SettingRow
            label="ペアリング解除を相手に通知"
            value={dissolutionNotification}
            onChange={setDissolutionNotification}
          />
        </View>
      </View>

      {/* Partner section */}
      {pair && partner && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>パートナー</Text>
          <View style={styles.settingsCard}>
            <View style={styles.partnerRow}>
              <View style={styles.partnerInfo}>
                <View style={styles.smallAvatar}>
                  <Text style={styles.smallAvatarInitial}>
                    {(partner.display_name ?? '?')[0].toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.partnerName}>{partner.display_name}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.dangerRow} onPress={handleDissolvePair}>
              <Text style={styles.dangerText}>ペアリングを解除する</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Invite */}
      {!pair && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.inviteCard}
            onPress={() => router.push('/pairing/invite')}
          >
            <Ionicons name="link-outline" size={24} color={Colors.primary} />
            <Text style={styles.inviteText}>パートナーを招待する</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Account */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>アカウント</Text>
        <View style={styles.settingsCard}>
          <TouchableOpacity style={styles.settingRow} onPress={handleSignOut}>
            <Text style={styles.settingRowText}>ログアウト</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.settingRow}>
            <Text style={styles.settingRowText}>利用規約</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.settingRow}>
            <Text style={styles.settingRowText}>プライバシーポリシー</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={[styles.settingRow, styles.dangerRow]}>
            <Text style={styles.dangerText}>アカウントを削除する</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.version}>DiaryArt v1.0.0</Text>
    </ScrollView>
  );
}

function SettingRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingRowText}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: Colors.border, true: Colors.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
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
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
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
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  profileEmail: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  editButton: {
    padding: 8,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF8E0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  premiumBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B8860B',
  },
  premiumBanner: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  premiumBannerContent: {
    gap: 4,
  },
  premiumBannerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  premiumBannerSubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  settingsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingRowText: {
    fontSize: 15,
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginHorizontal: 16,
  },
  dangerRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dangerText: {
    fontSize: 15,
    color: Colors.error,
  },
  partnerRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  partnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  smallAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallAvatarInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  inviteCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  inviteText: {
    flex: 1,
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '500',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 32,
  },
});
