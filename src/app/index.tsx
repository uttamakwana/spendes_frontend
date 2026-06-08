import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { useTheme } from '@/theme';

export default function Index() {
  const { status } = useAuth();
  const t = useTheme();

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.canvas }}>
        <ActivityIndicator color={t.accent} />
      </View>
    );
  }

  return <Redirect href={status === 'authed' ? '/(tabs)/home' : '/onboarding'} />;
}
