import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { signUp } from '@/lib/supabase/auth';
import { ensureUserRecord } from '@/lib/supabase/users';
import { Colors } from '@/constants/Colors';

export default function RegisterScreen() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!displayName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('入力エラー', 'すべての項目を入力してください');
      return;
    }
    if (password !== passwordConfirm) {
      Alert.alert('入力エラー', 'パスワードが一致しません');
      return;
    }
    if (password.length < 8) {
      Alert.alert('入力エラー', 'パスワードは8文字以上で設定してください');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await signUp(email.trim(), password, displayName.trim());
      if (error) throw error;
      await ensureUserRecord();
      Alert.alert(
        '登録完了',
        '確認メールを送信しました。メールのリンクをクリックして登録を完了してください。',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (err: any) {
      Alert.alert('登録エラー', err.message ?? '登録に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>アカウント作成</Text>
        <Text style={styles.subtitle}>一緒に思い出を作ろう</Text>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>ニックネーム</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="あなたの名前"
              placeholderTextColor={Colors.textLight}
              maxLength={30}
            />
          </View>

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
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>パスワード</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="8文字以上"
              placeholderTextColor={Colors.textLight}
              secureTextEntry
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>パスワード（確認）</Text>
            <TextInput
              style={styles.input}
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
              placeholder="パスワードを再入力"
              placeholderTextColor={Colors.textLight}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? '登録中...' : '登録する'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>すでにアカウントをお持ちの方は</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.footerLink}>ログイン</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: 80,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 40,
  },
  form: {
    gap: 20,
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
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginTop: 40,
  },
  footerText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  footerLink: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
