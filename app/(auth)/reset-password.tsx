import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { resetPassword } from '@/lib/supabase/auth';
import { Colors } from '@/constants/Colors';

export default function ResetPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) {
      Alert.alert('入力エラー', 'メールアドレスを入力してください');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await resetPassword(email.trim());
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      Alert.alert('エラー', err.message ?? 'メール送信に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={styles.container}>
        <Text style={styles.emoji}>📧</Text>
        <Text style={styles.title}>メールを送信しました</Text>
        <Text style={styles.description}>
          {email} にパスワードリセットのリンクを送信しました。メールを確認してください。
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>ログイン画面に戻る</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>パスワードリセット</Text>
      <Text style={styles.description}>
        登録済みのメールアドレスを入力してください。リセット用のリンクをお送りします。
      </Text>

      <View style={styles.field}>
        <Text style={styles.label}>メールアドレス</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="your@email.com"
          placeholderTextColor={Colors.textLight}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleReset}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? '送信中...' : 'リセットメールを送る'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 32,
    paddingTop: 80,
    gap: 24,
  },
  emoji: {
    fontSize: 48,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
  },
  description: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
