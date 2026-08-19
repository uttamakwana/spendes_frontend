import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';

import { useFriends } from '@/features/hooks';
import { useRefresh } from '@/lib/useRefresh';
import { useTheme } from '@/theme';
import { Font } from '@/theme/fonts';
import { Avatar, BalancePill, Card, CollapsibleScreen, EmptyState, IconButton, MoneyText, Skeleton, Txt } from '@/ui';

export default function Friends() {
  const t = useTheme();
  const router = useRouter();
  const { data, isLoading, refetch } = useFriends();
  const friends = data?.friends ?? [];
  const { refreshing, onRefresh } = useRefresh([{ refetch }]);

  return (
    <CollapsibleScreen
      title="Friends"
      right={<IconButton name="person-add" bg={t.accent} color="#fff" onPress={() => router.push('/friends/add')} />}
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
    >
        {/* summary */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          <View style={{ flex: 1, backgroundColor: t.successBg, borderRadius: 16, padding: 14 }}>
            <Txt variant="caption" tone="ink2">
              You’re owed
            </Txt>
            <MoneyText value={data?.totalYouAreOwed ?? 0} size={20} weight="bold" color={t.success} style={{ marginTop: 3 }} />
          </View>
          <View style={{ flex: 1, backgroundColor: t.dangerBg, borderRadius: 16, padding: 14 }}>
            <Txt variant="caption" tone="ink2">
              You owe
            </Txt>
            <MoneyText value={data?.totalYouOwe ?? 0} size={20} weight="bold" color={t.danger} style={{ marginTop: 3 }} />
          </View>
        </View>

        {isLoading ? (
          <View style={{ gap: 10 }}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height={60} radius={14} />
            ))}
          </View>
        ) : friends.length === 0 ? (
          <EmptyState
            icon="person-add-outline"
            title="No friends yet"
            subtitle="Add friends from your contacts to split 1-on-1 expenses and settle over UPI."
            actionLabel="Add from contacts"
            onAction={() => router.push('/friends/add')}
          />
        ) : (
          <Card padding={0} style={{ paddingHorizontal: 14 }}>
            {friends.map((f, i) => (
              <Pressable
                key={f.friendshipId}
                onPress={() => router.push(`/friends/${f.friendshipId}`)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 13,
                  paddingVertical: 12,
                  borderBottomWidth: i === friends.length - 1 ? 0 : 1,
                  borderBottomColor: t.hair,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Avatar name={f.displayName} seed={f.friendMemberId} uri={f.avatarUrl} size={44} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Txt variant="headline" numberOfLines={1}>
                    {f.displayName}
                  </Txt>
                  <Txt tone="ink3" variant="caption">
                    {f.isRegistered ? 'On Spendes' : 'Invited'}
                  </Txt>
                </View>
                {f.net === 0 ? (
                  <Txt tone="ink3" variant="caption" style={{ fontFamily: Font.semibold }}>
                    settled
                  </Txt>
                ) : (
                  <BalancePill net={f.net} />
                )}
              </Pressable>
            ))}
          </Card>
        )}

        {friends.length > 0 && (
          <Pressable
            onPress={() => router.push('/friends/add')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 14,
              borderRadius: 16,
              borderWidth: 1.5,
              borderStyle: 'dashed',
              borderColor: t.line,
              marginTop: 12,
            }}
          >
            <View style={{ width: 44, height: 44, borderRadius: 999, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="person-add" size={20} color={t.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt variant="headline" tone="accent">
                Add from contacts
              </Txt>
              <Txt tone="ink3" variant="caption">
                Non-users get an invite to Spendes
              </Txt>
            </View>
          </Pressable>
        )}
    </CollapsibleScreen>
  );
}
