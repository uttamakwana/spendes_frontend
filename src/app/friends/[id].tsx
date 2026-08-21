import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { format } from 'date-fns';
import React from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';

import type { Friend, GroupExpense } from '@/api';
import { errorMessage } from '@/api';
import {
  useConfirmFriend,
  useDeclineFriend,
  useFriend,
  useFriendExpenses,
} from '@/features/hooks';
import { money } from '@/lib/money';
import { useRefresh } from '@/lib/useRefresh';
import { useTheme } from '@/theme';
import { Font } from '@/theme/fonts';
import { Avatar, Button, Card, MoneyText, Screen, Skeleton, Txt, TopBar } from '@/ui';

export default function FriendDetail() {
  const t = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: f, isLoading, refetch } = useFriend(id);
  const expenses = useFriendExpenses(id);
  const confirm = useConfirmFriend(id);
  const decline = useDeclineFriend(id);
  const { refreshing, onRefresh } = useRefresh([{ refetch }, expenses]);

  const owed = (f?.net ?? 0) > 0;
  const settled = (f?.net ?? 0) === 0;

  const shareInfo = (e: GroupExpense) => {
    const mine = f ? e.splits.find((s) => s.memberId === f.myMemberId)?.amount ?? 0 : 0;
    const iPaid = f ? e.paidBy.some((p) => p.memberId === f.myMemberId) : false;
    return { mine, iPaid };
  };

  return (
    <Screen>
      <TopBar title="" />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={t.accent}
            colors={[t.accent]}
            progressBackgroundColor={t.surface}
          />
        }
      >
        {isLoading || !f ? (
          <Skeleton height={160} radius={16} style={{ marginTop: 8 }} />
        ) : (
          <>
            <View style={{ alignItems: 'center' }}>
              <Avatar name={f.displayName} seed={f.friendMemberId} uri={f.avatarUrl} size={76} />
              <Txt variant="title2" style={{ marginTop: 12 }}>
                {f.displayName}
              </Txt>
              <Txt tone="ink3" variant="caption" style={{ marginTop: 2 }}>
                {f.needsMyReview
                  ? 'They added you'
                  : f.consent === 'declined'
                    ? 'You said you don’t know them'
                    : f.isRegistered
                      ? 'On Spendes'
                      : 'Invited'}
              </Txt>
              <View
                style={{
                  marginTop: 14,
                  paddingHorizontal: 18,
                  paddingVertical: 8,
                  borderRadius: 14,
                  backgroundColor: settled ? t.fill : owed ? t.successBg : t.dangerBg,
                }}
              >
                <Txt variant="caption" tone="ink2">
                  {settled ? 'You are ' : owed ? `${f.displayName.split(' ')[0]} owes you ` : `You owe ${f.displayName.split(' ')[0]} `}
                  {settled ? (
                    <Txt color={t.ink2} style={{ fontFamily: Font.bold, fontSize: 16 }}>
                      all settled
                    </Txt>
                  ) : (
                    <MoneyText value={Math.abs(f.net)} size={16} weight="bold" color={owed ? t.success : t.danger} animate />
                  )}
                </Txt>
              </View>
            </View>

            {f.needsMyReview && (
              <Review
                f={f}
                busy={confirm.isPending || decline.isPending}
                onConfirm={() =>
                  confirm.mutate(undefined, {
                    onError: (e) => Alert.alert('Couldn’t confirm', errorMessage(e)),
                  })
                }
                onDecline={() =>
                  Alert.alert(
                    `Don’t recognise ${f.displayName.split(' ')[0]}?`,
                    'We’ll let them know they may have used the wrong number. Nothing is deleted — any shared expenses stay until they remove them.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'I don’t know them',
                        style: 'destructive',
                        onPress: () =>
                          decline.mutate(
                            {},
                            { onError: (e) => Alert.alert('Couldn’t send', errorMessage(e)) },
                          ),
                      },
                    ],
                  )
                }
              />
            )}

            {!settled && (
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
                <Button
                  variant={owed ? 'soft' : 'primary'}
                  icon={owed ? 'notifications' : 'phone-portrait'}
                  full={false}
                  style={{ flex: 1 }}
                  onPress={() =>
                    owed
                      ? undefined
                      : router.push(
                          `/settle?kind=friend&id=${id}&toMemberId=${f.friendMemberId}&amount=${Math.abs(f.net)}&name=${encodeURIComponent(f.displayName)}`,
                        )
                  }
                >
                  {owed ? 'Send reminder' : 'Pay via UPI'}
                </Button>
                <Button
                  variant="outline"
                  full={false}
                  style={{ flex: 1 }}
                  onPress={() =>
                    router.push(
                      `/settle?kind=friend&id=${id}&toMemberId=${owed ? f.myMemberId : f.friendMemberId}&fromMemberId=${owed ? f.friendMemberId : f.myMemberId}&amount=${Math.abs(f.net)}&name=${encodeURIComponent(f.displayName)}&incoming=${owed ? 1 : 0}`,
                    )
                  }
                >
                  {owed ? 'Mark received' : 'Mark paid'}
                </Button>
              </View>
            )}

            <Txt variant="caption" tone="ink2" style={{ fontFamily: Font.semibold, paddingTop: 22, paddingBottom: 8, paddingHorizontal: 4 }}>
              Shared history
            </Txt>
            {expenses.isLoading ? (
              <Skeleton height={60} radius={14} />
            ) : (expenses.data?.items.length ?? 0) === 0 ? (
              <Txt tone="ink3" variant="caption" style={{ padding: 16, textAlign: 'center' }}>
                No shared expenses yet
              </Txt>
            ) : (
              <View style={{ gap: 8 }}>
                {expenses.data!.items.map((e) => {
                  const { mine, iPaid } = shareInfo(e);
                  return (
                    <Card key={e.id} padding={13}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: t.fill, alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name="receipt-outline" size={20} color={t.ink2} />
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Txt variant="callout" style={{ fontFamily: Font.semibold }} numberOfLines={1}>
                            {e.description}
                          </Txt>
                          <Txt tone="ink3" variant="caption">
                            {iPaid ? 'You' : f.displayName.split(' ')[0]} paid {money(e.amount)} · {format(new Date(e.spentAt), 'MMM d')}
                          </Txt>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Txt tone="ink3" variant="micro">
                            {iPaid ? 'lent' : 'borrowed'}
                          </Txt>
                          <Txt color={iPaid ? t.success : t.danger} style={{ fontFamily: Font.semibold, fontSize: 14 }}>
                            {money(mine)}
                          </Txt>
                        </View>
                      </View>
                    </Card>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

/**
 * The same question the inbox asks, asked where you'd also naturally ask it: this
 * friendship arrived from their side and you haven't answered. Confirming costs
 * nothing and blocks nothing — the balances below are real either way — it just
 * makes the connection mutual instead of one-sided.
 */
function Review({
  f,
  busy,
  onConfirm,
  onDecline,
}: {
  f: Friend;
  busy: boolean;
  onConfirm: () => void;
  onDecline: () => void;
}) {
  const t = useTheme();
  const first = f.displayName.split(' ')[0];

  return (
    <Card style={{ marginTop: 18 }}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Ionicons name="person-add-outline" size={18} color={t.warning} />
        <Txt variant="caption" tone="ink2" style={{ flex: 1, lineHeight: 19 }}>
          <Txt style={{ fontFamily: Font.semibold }}>{first}</Txt> added you on Spendes. Is that
          right?
        </Txt>
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
        <Button full={false} style={{ flex: 1 }} icon="checkmark" loading={busy} onPress={onConfirm}>
          Looks right
        </Button>
        <Button full={false} style={{ flex: 1 }} variant="outline" onPress={onDecline}>
          I don’t know them
        </Button>
      </View>
    </Card>
  );
}
