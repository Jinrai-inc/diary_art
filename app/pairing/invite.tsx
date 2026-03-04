import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { createInvite } from '@/lib/supabase/pairs';
import { Colors } from '@/constants/Colors';

export default function InviteScreen() {
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    generateInvite();
  }, []);

  const generateInvite = async () => {
    setIsLoading(true);
    try {
      const { inviteUrl: url } = await createInvite();
      setInviteUrl(url);
    } catch (err) {
      Alert.alert('エラー', '招待リンクの生成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteUrl) return;
    await Clipboard.setStringAsync(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleShare = async () => {
    if (!inviteUrl) return;
    await Share.share({
      message: `DiaryArtで一緒に日記を作ろう！\nこのリンクをタップしてペアリングしてね 💌\n${inviteUrl}`,
      title: 'DiaryArt 招待リンク',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.emoji}>💌</Text>
        <Text style={styles.title}>パートナーを招待</Text>
        <Text style={styles.description}>
          このリンクをパートナーに送ってください。{'\n'}
          タップするだけでペアリングが完了します。
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={Colors.primary} size="large" />
      ) : (
        <View style={styles.linkContainer}>
          <View style={styles.linkBox}>
            <Text style={styles.linkText} numberOfLines={2}>
              {inviteUrl}
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.copyButton, copied && styles.copiedButton]}
              onPress={handleCopy}
            >
              <Ionicons
                name={copied ? 'checkmark' : 'copy-outline'}
                size={18}
                color={copied ? '#FFFFFF' : Colors.primary}
              />
              <Text
                style={[styles.copyButtonText, copied && styles.copiedButtonText]}
              >
                {copied ? 'コピー済み！' : 'コピー'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={18} color="#FFFFFF" />
              <Text style={styles.shareButtonText}>シェアする</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.notes}>
        <View style={styles.noteItem}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.noteText}>1つのアカウントにつき1人とペアリングできます</Text>
        </View>
        <View style={styles.noteItem}>
          <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.noteText}>ペアリング前でも日記や生成機能はご利用いただけます</Text>
        </View>
        <View style={styles.noteItem}>
          <Ionicons name="shield-checkmark-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.noteText}>完全非公開。二人だけの日記です</Text>
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
  },
  hero: {
    alignItems: 'center',
    gap: 12,
    paddingTop: 24,
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
  linkContainer: {
    gap: 16,
  },
  linkBox: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  linkText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  copyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  copiedButton: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  copyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  copiedButtonText: {
    color: '#FFFFFF',
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 50,
    backgroundColor: Colors.primary,
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  notes: {
    gap: 14,
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
