import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { format } from 'date-fns';
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { GroupExpense, SuggestedTransfer } from '@/api';
import { useGroup, useGroupBalances, useGroupExpenses } from '@/features/hooks';
import { money } from '@/lib/money';
import { hexA, useTheme } from '@/theme';
import { Font } from '@/theme/fonts';
import {
  Avatar,
  BalancePill,
  Button,
  CategoryIcon,
  Card,
  IconButton,
  MoneyText,
  Skeleton,
  Txt,
  UnderlineTabs,
} from '@/ui';

type Tab = 'expenses' | 'balances' | 'members';

export default function GroupDetail() {
  const t = useTheme();
  const router = useRouter();
  const { id, tab: initialTab } = useLocalSearchParams<{ id: string; tab?: string }>();
  const [tab, setTab] = useState<Tab>((initialTab as Tab) || 'expenses');

  const group = useGroup(id);
  const expenses = useGroupExpenses(id);
  const balances = useGroupBalances(id);

  const g = group.data;
  const myNet = balances.data?.myNet ?? 0;
  const myMemberId = balances.data?.myMemberId;
  const total = (expenses.data?.items ?? []).reduce((s, e) => s + e.amount, 0);

  const onSettle = () => {
    const transfer = balances.data?.suggestedTransfers.find((tr) => tr.fromMemberId === myMemberId);
    if (transfer) {
      router.push(
        `/settle?kind=group&id=${id}&toMemberId=${transfer.toMemberId}&amount=${transfer.amount}&name=${encodeURIComponent(transfer.toName)}`,
      );
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.canvas2 }}>
      {/* header */}
      <View style={{ backgroundColor: t.canvas }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 4 }}>
          <IconButton name="chevron-back" onPress={() => router.back()} />
          <IconButton name="ellipsis-horizontal" />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 4, paddingBottom: 14 }}>
          <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: hexA(t.accent, 0.14), alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="people" size={28} color={t.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt variant="title2" numberOfLines={1}>
              {g?.name ?? 'Group'}
            </Txt>
            <Txt tone="ink2" variant="caption" style={{ marginTop: 1 }}>
              Total spent <Txt color={t.ink} style={{ fontFamily: Font.semibold }}>{money(total)}</Txt>
            </Txt>
          </View>
        </View>
        {/* balance + settle */}
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12 }}>
          <View style={{ flex: 1, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: myNet >= 0 ? t.successBg : t.dangerBg }}>
            <Txt variant="micro" tone="ink2">
              {myNet === 0 ? 'You are' : myNet > 0 ? 'You are owed' : 'You owe'}
            </Txt>
            <Txt
              color={myNet === 0 ? t.ink2 : myNet > 0 ? t.success : t.danger}
              style={{ fontFamily: Font.bold, fontSize: 18 }}
            >
              {myNet === 0 ? 'all settled' : money(Math.abs(myNet))}
            </Txt>
          </View>
          <Button full={false} icon="phone-portrait" onPress={onSettle} disabled={myNet >= 0} style={{ height: 52, paddingHorizontal: 18 }}>
            Settle up
          </Button>
        </View>
        <UnderlineTabs
          options={[
            { value: 'expenses', label: 'Expenses' },
            { value: 'balances', label: 'Balances' },
            { value: 'members', label: 'Members' },
          ]}
          value={tab}
          onChange={(v) => setTab(v as Tab)}
        />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
        {tab === 'expenses' &&
          (expenses.isLoading ? (
            [0, 1, 2].map((i) => <Skeleton key={i} height={64} radius={14} />)
          ) : (expenses.data?.items.length ?? 0) === 0 ? (
            <Txt tone="ink3" variant="caption" center style={{ paddingVertical: 24 }}>
              No expenses yet. Add one with the + button.
            </Txt>
          ) : (
            expenses.data!.items.map((e) => <GroupExpenseRow key={e.id} e={e} myMemberId={myMemberId} />)
          ))}

        {tab === 'balances' &&
          (balances.isLoading ? (
            <Skeleton height={80} radius={14} />
          ) : (balances.data?.suggestedTransfers.length ?? 0) === 0 ? (
            <Txt tone="ink3" variant="caption" center style={{ paddingVertical: 24 }}>
              Everyone’s settled up 🎉
            </Txt>
          ) : (
            <BalancesView
              transfers={balances.data!.suggestedTransfers}
              myMemberId={myMemberId}
              memberCount={balances.data!.balances.length}
              onPay={(tr) =>
                router.push(
                  `/settle?kind=group&id=${id}&toMemberId=${tr.toMemberId}&amount=${tr.amount}&name=${encodeURIComponent(tr.toName)}`,
                )
              }
            />
          ))}

        {tab === 'members' &&
          (g?.members ?? []).map((m) => {
            const net = balances.data?.balances.find((b) => b.memberId === m.id)?.net ?? 0;
            return (
              <Card key={m.id} padding={14} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Avatar name={m.displayName} seed={m.id} me={m.isYou} size={42} />
                <View style={{ flex: 1 }}>
                  <Txt variant="headline">{m.isYou ? 'You' : m.displayName}</Txt>
                  <Txt tone="ink3" variant="caption" style={{ textTransform: 'capitalize' }}>
                    {m.role}
                    {m.status === 'invited' ? ' · invited' : ''}
                  </Txt>
                </View>
                {net === 0 ? (
                  <Txt tone="ink3" variant="caption" style={{ fontFamily: Font.semibold }}>
                    settled
                  </Txt>
                ) : (
                  <BalancePill net={net} />
                )}
              </Card>
            );
          })}
      </ScrollView>

      {/* FAB add split */}
      <View style={{ position: 'absolute', right: 20, bottom: 28 }}>
        <IconButton name="add" size={56} iconSize={28} bg={t.accent} color="#fff" onPress={() => router.push(`/add-split?groupId=${id}`)} />
      </View>
    </SafeAreaView>
  );
}

function GroupExpenseRow({ e, myMemberId }: { e: GroupExpense; myMemberId?: string }) {
  const t = useTheme();
  const mine = e.splits.find((s) => s.memberId === myMemberId)?.amount ?? 0;
  const iPaid = myMemberId ? e.paidBy.some((p) => p.memberId === myMemberId) : false;
  const payerName = e.paidBy[0]?.displayName ?? 'Someone';
  const lent = iPaid ? e.amount - mine : -mine;
  return (
    <Card padding={14} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <CategoryIcon name={e.category ?? 'shopping'} size={42} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt variant="headline" numberOfLines={1}>
          {e.description}
        </Txt>
        <Txt tone="ink3" variant="caption" style={{ marginTop: 1 }}>
          {iPaid ? 'You' : payerName.split(' ')[0]} paid {money(e.amount)} · {format(new Date(e.spentAt), 'MMM d')}
        </Txt>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Txt tone="ink3" variant="micro">
          {lent >= 0 ? 'you lent' : 'you borrowed'}
        </Txt>
        <Txt color={lent >= 0 ? t.success : t.danger} style={{ fontFamily: Font.semibold, fontSize: 14.5 }}>
          {money(Math.abs(lent))}
        </Txt>
      </View>
    </Card>
  );
}

function BalancesView({
  transfers,
  myMemberId,
  memberCount,
  onPay,
}: {
  transfers: SuggestedTransfer[];
  myMemberId?: string;
  memberCount: number;
  onPay: (tr: SuggestedTransfer) => void;
}) {
  const t = useTheme();
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 4, paddingBottom: 4 }}>
        <Ionicons name="sparkles" size={15} color={t.accent} />
        <Txt tone="ink2" variant="caption">
          Simplified to <Txt color={t.ink} style={{ fontFamily: Font.semibold }}>{transfers.length} payments</Txt> across {memberCount} members
        </Txt>
      </View>
      {transfers.map((tr, i) => {
        const involvesMe = tr.fromMemberId === myMemberId || tr.toMemberId === myMemberId;
        const iPay = tr.fromMemberId === myMemberId;
        return (
          <Card key={i} padding={14}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Avatar name={tr.fromName} seed={tr.fromMemberId} me={tr.fromMemberId === myMemberId} size={38} />
              <View style={{ flex: 1 }}>
                <Txt variant="callout">
                  <Txt style={{ fontFamily: Font.semibold }}>{tr.fromMemberId === myMemberId ? 'You' : tr.fromName.split(' ')[0]}</Txt>
                  <Txt tone="ink3"> pays </Txt>
                  <Txt style={{ fontFamily: Font.semibold }}>{tr.toMemberId === myMemberId ? 'you' : tr.toName.split(' ')[0]}</Txt>
                </Txt>
              </View>
              <Avatar name={tr.toName} seed={tr.toMemberId} me={tr.toMemberId === myMemberId} size={38} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: t.hair }}>
              <MoneyText value={tr.amount} size={17} weight="bold" />
              {involvesMe ? (
                <Button full={false} size="sm" variant={iPay ? 'primary' : 'soft'} icon={iPay ? 'phone-portrait' : 'notifications'} onPress={() => iPay && onPay(tr)}>
                  {iPay ? 'Pay via UPI' : 'Remind'}
                </Button>
              ) : (
                <Txt tone="ink3" variant="caption">
                  between members
                </Txt>
              )}
            </View>
          </Card>
        );
      })}
    </View>
  );
}
