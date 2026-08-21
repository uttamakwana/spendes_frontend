import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNowStrict } from 'date-fns';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';

import type { AppNotification, NotificationType } from '@/api';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/features/hooks';
import { useRefresh } from '@/lib/useRefresh';
import { hexA, useTheme } from '@/theme';
import { Font } from '@/theme/fonts';
import { Card, CollapsibleScreen, EmptyState, Skeleton, Txt } from '@/ui';

type IconName = keyof typeof Ionicons.glyphMap;

const STYLE: Record<NotificationType, { icon: IconName; color: string }> = {
  friend_added: { icon: 'person-add', color: '#4F46E5' },
  split_added: { icon: 'git-branch', color: '#4F46E5' },
  settlement_recorded: { icon: 'checkmark-done', color: '#16A34A' },
  split_disputed: { icon: 'flag', color: '#DC2626' },
  membership_inherited: { icon: 'people', color: '#D97706' },
  connection_confirmed: { icon: 'checkmark-circle', color: '#16A34A' },
  connection_declined: { icon: 'alert-circle', color: '#DC2626' },
};

export default function NotificationsInbox() {
  const t = useTheme();
  const router = useRouter();
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage, refetch } =
    useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const { refreshing, onRefresh } = useRefresh([{ refetch }]);

  const items = data?.pages.flatMap((p) => p.items) ?? [];
  const unread = items.some((n) => !n.isRead);

  /**
   * Anything that asks something of you opens the review screen, where the whole
   * picture is — who this is, what they're claiming, and every answer you can give.
   * Items that are purely informational still jump straight to the group/friend.
   */
  const open = (n: AppNotification) => {
    if (n.canConfirm || n.canDispute) {
      router.push(`/notifications/${n.id}`);
      return;
    }
    if (!n.isRead) markRead.mutate(n.id);
    if (n.groupId) {
      router.push(n.isDirect ? `/friends/${n.groupId}` : `/groups/${n.groupId}`);
    }
  };

  return (
    <CollapsibleScreen
      title="Activity"
      right={
        unread ? (
          <Pressable onPress={() => markAll.mutate()} hitSlop={8}>
            <Txt color={t.accent} style={{ fontFamily: Font.semibold, fontSize: 14 }}>
              Mark all
            </Txt>
          </Pressable>
        ) : undefined
      }
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
    >
      {isLoading ? (
        <View style={{ gap: 10 }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={68} radius={14} />
          ))}
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon="notifications-off-outline"
          title="No activity yet"
          subtitle="When someone adds you to a split, records a payment, or adds you as a friend, you’ll see it here."
        />
      ) : (
        <>
          <Card padding={0} style={{ paddingHorizontal: 14 }}>
            {items.map((n, i) => (
              <Row key={n.id} n={n} last={i === items.length - 1} onPress={() => open(n)} />
            ))}
          </Card>

          {hasNextPage && (
            <Pressable
              onPress={() => fetchNextPage()}
              style={{ alignItems: 'center', paddingVertical: 16 }}
            >
              <Txt color={t.accent} style={{ fontFamily: Font.semibold }}>
                {isFetchingNextPage ? 'Loading…' : 'Load more'}
              </Txt>
            </Pressable>
          )}
        </>
      )}
    </CollapsibleScreen>
  );
}

function Row({ n, last, onPress }: { n: AppNotification; last: boolean; onPress: () => void }) {
  const t = useTheme();
  const s = STYLE[n.type] ?? STYLE.split_added;
  const when = (() => {
    try {
      return formatDistanceToNowStrict(new Date(n.createdAt), { addSuffix: true });
    } catch {
      return '';
    }
  })();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        gap: 13,
        paddingVertical: 13,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: t.hair,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 11,
          backgroundColor: hexA(s.color, 0.15),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={s.icon} size={19} color={s.color} />
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Txt
            style={{ flex: 1, fontFamily: n.isRead ? Font.medium : Font.semibold }}
            numberOfLines={1}
          >
            {n.title}
          </Txt>
          {!n.isRead && (
            <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: t.accent }} />
          )}
        </View>
        <Txt tone="ink2" variant="caption" style={{ marginTop: 2, lineHeight: 18 }}>
          {n.body}
        </Txt>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 }}>
          <Txt tone="ink3" variant="micro">
            {when}
          </Txt>
          <State n={n} />
        </View>
      </View>
    </Pressable>
  );
}

/** Where this item stands: still open, confirmed, or flagged. */
function State({ n }: { n: AppNotification }) {
  const t = useTheme();

  if (n.isDisputed) {
    return <Tag icon="flag" label="Flagged" color={t.danger} />;
  }
  if (n.isConfirmed) {
    return <Tag icon="checkmark-circle" label="Confirmed" color={t.success} />;
  }
  if (n.needsReview) {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          backgroundColor: t.accentSoft,
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: 999,
        }}
      >
        <Txt color={t.accent} variant="micro" style={{ fontFamily: Font.semibold }}>
          Review
        </Txt>
        <Ionicons name="chevron-forward" size={11} color={t.accent} />
      </View>
    );
  }
  return null;
}

function Tag({ icon, label, color }: { icon: IconName; label: string; color: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Ionicons name={icon} size={12} color={color} />
      <Txt color={color} variant="micro" style={{ fontFamily: Font.semibold }}>
        {label}
      </Txt>
    </View>
  );
}
