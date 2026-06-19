import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { format } from 'date-fns';
import React from 'react';
import { ScrollView, View } from 'react-native';

import type { GroupExpense } from '@/api';
import { useFriend, useFriendExpenses } from '@/features/hooks';
import { money } from '@/lib/money';
import { useTheme } from '@/theme';
import { Font } from '@/theme/fonts';
import { Avatar, Button, Card, Screen, Skeleton, Txt, TopBar } from '@/ui';

export default function FriendDetail() {
  const t = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: f, isLoading } = useFriend(id);
  const expenses = useFriendExpenses(id);

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
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
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
                {f.isRegistered ? 'On Spendes' : 'Invited'}
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
                  <Txt color={settled ? t.ink2 : owed ? t.success : t.danger} style={{ fontFamily: Font.bold, fontSize: 16 }}>
                    {settled ? 'all settled' : money(Math.abs(f.net))}
                  </Txt>
                </Txt>
              </View>
            </View>

            {!settled && (
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
                <Button
                  variant={owed ? 'soft' : 'primary'}
                  icon={owed ? 'notifications' : 'phone-portrait'}
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
