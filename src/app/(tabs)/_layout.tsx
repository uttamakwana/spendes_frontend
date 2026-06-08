import { Redirect, Tabs } from 'expo-router';
import React, { useState } from 'react';

import { useAuth } from '@/auth/AuthProvider';
import { AddSheet } from '@/features/nav/AddSheet';
import { TabBar } from '@/features/nav/TabBar';

export default function TabsLayout() {
  const { status } = useAuth();
  const [addOpen, setAddOpen] = useState(false);

  if (status === 'guest') return <Redirect href="/onboarding" />;

  return (
    <>
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <TabBar {...props} onAdd={() => setAddOpen(true)} />}
      >
        <Tabs.Screen name="home" />
        <Tabs.Screen name="groups" />
        <Tabs.Screen name="analytics" />
        <Tabs.Screen name="profile" />
      </Tabs>
      <AddSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  );
}
