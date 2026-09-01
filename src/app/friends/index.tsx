import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useRef } from 'react';
import { Pressable, View } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';

import { useFriends } from '@/features/hooks';
import { useRefresh } from '@/lib/useRefresh';
import { useTheme } from '@/theme';
import { Font } from '@/theme/fonts';
import { Appear, Avatar, BalancePill, Card, CollapsibleScreen, EmptyState, IconButton, MoneyText, Skeleton, Txt } from '@/ui';

export default function Friends() {
  const t = useTheme();
  const router = useRouter();
  const { data, isLoading, refetch } = useFriends();
  const friends = data?.friends ?? [];
  const { refreshing, onRefresh } = useRefresh([{ refetch }]);

  // A swiped-open row is a transient gesture state, not a selection: at most one
  // may be open, and it must never still be hanging open when you come back from
  // the settle screen. Closing on blur covers navigation, tab switches and
  // backgrounding in one place.
  const openRow = useRef<SwipeableMethods | null>(null);
  const closeOpenRow = useCallback(() => {
    openRow.current?.close();
    openRow.current = null;
  }, []);
  useFocusEffect(useCallback(() => closeOpenRow, [closeOpenRow]));

  return (
    <CollapsibleScreen
      title="Friends"
      right={<IconButton name="person-add" bg={t.accent} color="#fff" onPress={() => router.push('/friends/add')} />}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onScrollBeginDrag={closeOpenRow}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
    >
        {/* summary */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          <View style={{ flex: 1, backgroundColor: t.successBg, borderRadius: 16, padding: 14 }}>
            <Txt variant="caption" tone="ink2">
              You’re owed
            </Txt>
            <MoneyText value={data?.totalYouAreOwed ?? 0} size={20} weight="bold" color={t.success} animate style={{ marginTop: 3 }} />
          </View>
          <View style={{ flex: 1, backgroundColor: t.dangerBg, borderRadius: 16, padding: 14 }}>
            <Txt variant="caption" tone="ink2">
              You owe
            </Txt>
            <MoneyText value={data?.totalYouOwe ?? 0} size={20} weight="bold" color={t.danger} animate style={{ marginTop: 3 }} />
          </View>
        </View>

        {(data?.otherCurrencyCount ?? 0) > 0 && (
          <Txt tone="ink3" variant="caption" style={{ marginTop: -8, marginBottom: 14, paddingHorizontal: 4 }}>
            {data?.otherCurrencyCount === 1 ? 'One friend keeps' : `${data?.otherCurrencyCount} friends keep`}{' '}
            their balance in another currency, shown on their own row.
          </Txt>
        )}

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
            subtitle="Add friends from your contacts to split 1-on-1 expenses and settle up in a tap."
            actionLabel="Add from contacts"
            onAction={() => router.push('/friends/add')}
          />
        ) : (
          <Card padding={0} style={{ paddingHorizontal: 14 }}>
            {friends.map((f, i) => {
              const owe = f.net < 0;
              const row = (
                <Pressable
                  onPress={() => {
                    closeOpenRow();
                    router.push(`/friends/${f.friendshipId}`);
                  }}
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
                    <Txt
                      tone={f.needsMyReview ? undefined : 'ink3'}
                      color={f.needsMyReview ? t.warning : undefined}
                      variant="caption"
                      style={f.needsMyReview ? { fontFamily: Font.semibold } : undefined}
                    >
                      {/* They added you and you haven't answered — say so rather than
                          listing them as an established friend. */}
                      {f.needsMyReview
                        ? 'Added you · tap to review'
                        : f.isRegistered
                          ? 'On Spendes'
                          : 'Invited'}
                    </Txt>
                  </View>
                  {f.net === 0 ? (
                    <Txt tone="ink3" variant="caption" style={{ fontFamily: Font.semibold }}>
                      settled
                    </Txt>
                  ) : (
                    <BalancePill net={f.net} currency={f.currency} />
                  )}
                </Pressable>
              );
              return (
                <Appear key={f.friendshipId} delay={Math.min(i, 6) * 45}>
                  {owe ? (
                    <SettleRow
                      openRow={openRow}
                      onSettle={() =>
                        router.push(
                          `/settle?kind=friend&id=${f.friendshipId}&toMemberId=${f.friendMemberId}&amount=${Math.abs(f.net)}&name=${encodeURIComponent(f.displayName)}&currency=${f.currency}`,
                        )
                      }
                    >
                      {row}
                    </SettleRow>
                  ) : (
                    row
                  )}
                </Appear>
              );
            })}
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

/**
 * A friend row you can swipe left to settle. It owns its swipe controller and
 * reports itself to the list's shared `openRow`, so opening one closes any other
 * and taking the action closes this one before we navigate — a row left hanging
 * open after a round trip to the settle screen reads as broken.
 */
function SettleRow({
  openRow,
  onSettle,
  children,
}: {
  openRow: React.RefObject<SwipeableMethods | null>;
  onSettle: () => void;
  children: React.ReactNode;
}) {
  const t = useTheme();
  const ref = useRef<SwipeableMethods | null>(null);

  return (
    <ReanimatedSwipeable
      ref={ref}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      childrenContainerStyle={{ backgroundColor: t.surface }}
      onSwipeableWillOpen={() => {
        if (openRow.current && openRow.current !== ref.current) openRow.current.close();
        openRow.current = ref.current;
      }}
      onSwipeableWillClose={() => {
        if (openRow.current === ref.current) openRow.current = null;
      }}
      renderRightActions={(_progress, _translation, methods) => (
        <Pressable
          onPress={() => {
            // Close first: the row must be back to normal when we return.
            methods.close();
            openRow.current = null;
            onSettle();
          }}
          style={{
            width: 96,
            backgroundColor: t.accent,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 6,
          }}
        >
          <Ionicons name="phone-portrait" size={17} color="#fff" />
          <Txt color="#fff" style={{ fontFamily: Font.semibold, fontSize: 13 }}>
            Settle
          </Txt>
        </Pressable>
      )}
    >
      {children}
    </ReanimatedSwipeable>
  );
}
