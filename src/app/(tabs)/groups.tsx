import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGroups } from '@/features/hooks';
import { hexA, useTheme } from '@/theme';
import {
  AvatarStack,
  Card,
  CollapsibleScreen,
  EmptyState,
  IconButton,
  Skeleton,
  Txt,
} from '@/ui';

export default function GroupsTab() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, refetch } = useGroups();
  const groups = data?.items ?? [];

  return (
    <CollapsibleScreen
      title="Groups"
      right={<IconButton name="add" bg={t.accent} color="#fff" onPress={() => router.push('/groups/new')} />}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 90, gap: 12 }}
    >
        {isLoading ? (
          [0, 1, 2].map((i) => <Skeleton key={i} height={92} radius={16} />)
        ) : isError ? (
          <EmptyState icon="cloud-offline-outline" title="Couldn’t load groups" actionLabel="Retry" onAction={refetch} />
        ) : groups.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title="No groups yet"
            subtitle="Create a group for a trip, flat or friends to start splitting expenses."
            actionLabel="New group"
            onAction={() => router.push('/groups/new')}
          />
        ) : (
          groups.map((g) => (
            <Card key={g.id} onPress={() => router.push(`/groups/${g.id}`)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    backgroundColor: hexA(t.accent, 0.14),
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="people" size={24} color={t.accent} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Txt variant="title3" numberOfLines={1}>
                    {g.name}
                  </Txt>
                  <Txt tone="ink3" variant="caption" style={{ marginTop: 1 }}>
                    {g.memberCount} {g.memberCount === 1 ? 'member' : 'members'}
                    {g.myRole === 'admin' ? ' · admin' : ''}
                  </Txt>
                </View>
                <Ionicons name="chevron-forward" size={18} color={t.ink3} />
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 14,
                  paddingTop: 14,
                  borderTopWidth: 1,
                  borderTopColor: t.hair,
                }}
              >
                <AvatarStack
                  members={g.members.map((m) => ({ id: m.id, name: m.displayName, me: m.isYou }))}
                  size={28}
                  max={4}
                />
                <Txt tone="accent" variant="caption" style={{ fontWeight: '600' }}>
                  View balances
                </Txt>
              </View>
            </Card>
          ))
        )}
    </CollapsibleScreen>
  );
}
