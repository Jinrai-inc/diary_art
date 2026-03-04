import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.logo}>🎨</Text>
        <Text style={styles.title}>DiaryArt</Text>
        <Text style={styles.subtitle}>
          毎日の気持ちを、{'\n'}二人だけの作品に。
        </Text>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/(auth)/register')}
        >
          <Text style={styles.primaryButtonText}>はじめる</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.secondaryButtonText}>ログイン</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.terms}>
        続けることで
        <Text style={styles.link}>利用規約</Text>・
        <Text style={styles.link}>プライバシーポリシー</Text>
        に同意したものとみなします
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingTop: 100,
    paddingBottom: 50,
  },
  hero: {
    alignItems: 'center',
    gap: 16,
  },
  logo: {
    fontSize: 72,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 28,
    marginTop: 8,
  },
  buttons: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  terms: {
    fontSize: 11,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 18,
  },
  link: {
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
});
