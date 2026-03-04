import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '@/store/authStore';
import { Colors } from '@/constants/Colors';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { initialize, isInitialized } = useAuthStore();

  useEffect(() => {
    initialize().then(() => {
      SplashScreen.hideAsync();
    });
  }, []);

  if (!isInitialized) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="entry/create"
          options={{ title: '今日の記録', presentation: 'modal' }}
        />
        <Stack.Screen
          name="entry/result"
          options={{ title: '生成結果', headerBackVisible: false }}
        />
        <Stack.Screen
          name="entry/[id]"
          options={{ title: '日記の詳細' }}
        />
        <Stack.Screen
          name="pairing/invite"
          options={{ title: 'パートナーを招待', presentation: 'modal' }}
        />
        <Stack.Screen
          name="pairing/join"
          options={{ title: 'ペアリング', presentation: 'modal' }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
