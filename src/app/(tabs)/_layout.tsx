import { Ionicons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import { Icon, Label, NativeTabs, VectorIcon } from 'expo-router/unstable-native-tabs';
import React, { useState } from 'react';

import { useAuth } from '@/auth/AuthProvider';
import { AddFab } from '@/features/nav/AddFab';
import { AddSheet } from '@/features/nav/AddSheet';
import { useTheme } from '@/theme';
import { Font } from '@/theme/fonts';

export default function TabsLayout() {
  const { status } = useAuth();
  const t = useTheme();
  const [addOpen, setAddOpen] = useState(false);

  if (status === 'guest') return <Redirect href="/onboarding" />;

  return (
    <>
      <NativeTabs
        // Deliberately no `backgroundColor` / `blurEffect`: either one makes the
        // bar opaque and defeats iOS 26 Liquid Glass. Left alone, the system
        // renders glass on iOS 26 and its translucent material below that.
        tintColor={t.accent}
        labelStyle={{ fontFamily: Font.medium, fontSize: 11 }}
        // Android (Material 3) only — the selected pill and touch ripple.
        indicatorColor={t.accentSoft}
        rippleColor={t.accentSoft}
        // iOS 26: the bar collapses as you scroll down, giving content the screen.
        minimizeBehavior="onScrollDown"
      >
        <NativeTabs.Trigger name="home">
          <Icon
            sf={{ default: 'house', selected: 'house.fill' }}
            androidSrc={<VectorIcon family={Ionicons} name="home-outline" />}
          />
          <Label>Home</Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="groups">
          <Icon
            sf={{ default: 'person.2', selected: 'person.2.fill' }}
            androidSrc={<VectorIcon family={Ionicons} name="people-outline" />}
          />
          <Label>Groups</Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="analytics">
          <Icon
            sf={{ default: 'chart.pie', selected: 'chart.pie.fill' }}
            androidSrc={<VectorIcon family={Ionicons} name="pie-chart-outline" />}
          />
          <Label>Insights</Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="profile">
          <Icon
            sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }}
            androidSrc={<VectorIcon family={Ionicons} name="person-outline" />}
          />
          <Label>Profile</Label>
        </NativeTabs.Trigger>
      </NativeTabs>

      <AddFab onPress={() => setAddOpen(true)} />
      <AddSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  );
}
