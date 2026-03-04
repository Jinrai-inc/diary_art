import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export default function AuthLayout() {
  const { session } = useAuthStore();

  useEffect(() => {
    if (session) {
      router.replace('/(tabs)');
    }
  }, [session]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}
