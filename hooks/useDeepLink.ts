import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';

export function useDeepLink() {
  useEffect(() => {
    // Handle deep links when app is already open
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    // Handle deep links when app opens from a link
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    return () => subscription.remove();
  }, []);
}

function handleDeepLink(url: string) {
  const parsed = Linking.parse(url);

  if (parsed.path === 'pair' || parsed.hostname === 'pair') {
    const inviter = parsed.queryParams?.inviter as string | undefined;
    if (inviter) {
      router.push({
        pathname: '/pairing/join',
        params: { inviter },
      });
    }
  }

  if (parsed.path === 'reset-password' || parsed.hostname === 'reset-password') {
    router.push('/(auth)/reset-password');
  }
}
