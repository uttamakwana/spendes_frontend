import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import {
  useBudgets,
  useCashflow,
  useFriends,
  useGoals,
  useGroups,
  useOverview,
  useRecentExpenses,
  useUnreadCount,
} from '@/features/hooks';
import { expenseToItem, TxnRow } from '@/features/transactions/TxnRow';
import { money } from '@/lib/money';
import { hexA, useTheme } from '@/theme';
import { Font } from '@/theme/fonts';
import {
  Avatar,
  AvatarStack,
  Card,
  IconButton,
  MoneyText,
  SectionHeader,
  Skeleton,
  Sparkline,
  Txt,
} from '@/ui';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Home() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const overview = useOverview();
  const friends = useFriends();
  const recent = useRecentExpenses(4);
  const budgets = useBudgets();
  const goals = useGoals();
  const groups = useGroups();
  const cashflow = useCashflow(6);
  const unreadCount = useUnreadCount().data?.count ?? 0;

  const o = overview.data;
  const income = o?.income ?? 0;
  const expense = o?.expense ?? 0;
  const cashOut = o?.cashOutflow ?? 0;
  const fronted = Math.max(0, cashOut - expense);
  const safe = Math.max(0, income - expense);
  const spentPct = income > 0 ? Math.min(100, (expense / income) * 100) : 0;

  const owed = friends.data?.totalYouAreOwed ?? 0;
  const owe = friends.data?.totalYouOwe ?? 0;

  const overBudgets = (budgets.data?.items ?? []).filter((b) => b.status === 'exceeded').length;
  const goalPct = (() => {
    const gs = goals.data?.items ?? [];
    if (!gs.length) return 0;
    const saved = gs.reduce((s, g) => s + g.currentAmount, 0);
    const target = gs.reduce((s, g) => s + g.targetAmount, 0);
    return target ? Math.round((saved / target) * 100) : 0;
  })();
  const emiMo = o?.commitments.totalMonthlyCommitment ?? 0;
  const invGain = o?.portfolio.totalGainLoss ?? 0;
  const netWorth = o?.netWorth.net ?? 0;
  const cashSeries = (cashflow.data?.series ?? []).map((p) => p.net);

  return (
    <View style={{ flex: 1, backgroundColor: t.canvas2 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 6, paddingBottom: insets.bottom + 90 }}
      >
        {/* header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingBottom: 6,
          }}
        >
          <View>
            <Txt tone="ink3" variant="callout">
              {greeting()},
            </Txt>
            <Txt variant="title2">{user?.firstName ?? 'there'}</Txt>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View>
              <IconButton name="notifications-outline" bg={t.surface} onPress={() => router.push('/notifications')} />
              {unreadCount > 0 && (
                <View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    top: -3,
                    right: -3,
                    minWidth: 18,
                    height: 18,
                    borderRadius: 999,
                    paddingHorizontal: 4,
                    backgroundColor: t.danger,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: t.canvas2,
                  }}
                >
                  <Txt color="#fff" style={{ fontFamily: Font.bold, fontSize: 10 }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Txt>
                </View>
              )}
            </View>
            <IconButton name="search" bg={t.surface} onPress={() => router.push('/transactions')} />
            <Pressable onPress={() => router.push('/profile')}>
              <Avatar name={user?.fullName} seed={user?.id} uri={user?.avatarUrl} me size={38} />
            </Pressable>
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, paddingTop: 14, gap: 14 }}>
          {/* Safe to spend hero */}
          <Card padding={20}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Txt variant="caption" tone="ink2">
                Safe to spend
              </Txt>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  backgroundColor: t.successBg,
                  paddingHorizontal: 9,
                  paddingVertical: 3,
                  borderRadius: 999,
                }}
              >
                <Ionicons name="checkmark-circle" size={13} color={t.success} />
                <Txt color={t.success} style={{ fontFamily: Font.semibold, fontSize: 12 }}>
                  On track
                </Txt>
              </View>
            </View>
            {overview.isLoading ? (
              <Skeleton width={180} height={40} style={{ marginTop: 8 }} />
            ) : (
              <MoneyText value={safe} size={42} weight="bold" style={{ marginTop: 4 }} />
            )}
            <Txt tone="ink3" variant="caption" style={{ marginTop: 4 }}>
              this month · income vs spend
            </Txt>
            <View style={{ height: 8, borderRadius: 999, backgroundColor: t.fill2, marginTop: 16, overflow: 'hidden' }}>
              <View style={{ width: `${spentPct}%`, height: '100%', backgroundColor: t.accent, borderRadius: 999 }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
              <Txt tone="ink2" variant="caption">
                Spent <Txt style={{ fontFamily: Font.semibold }}>{money(expense)}</Txt>
              </Txt>
              <Txt tone="ink2" variant="caption">
                Income <Txt style={{ fontFamily: Font.semibold }}>{money(income)}</Txt>
              </Txt>
            </View>
            {fronted > 0.5 && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 12,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: t.hair,
                }}
              >
                <Ionicons name="wallet-outline" size={14} color={t.ink3} />
                <Txt tone="ink3" variant="caption" style={{ flex: 1 }}>
                  Cash out{' '}
                  <Txt color={t.ink} style={{ fontFamily: Font.semibold }}>
                    {money(cashOut)}
                  </Txt>{' '}
                  — you fronted{' '}
                  <Txt color={t.success} style={{ fontFamily: Font.semibold }}>
                    {money(fronted)}
                  </Txt>{' '}
                  for splits
                </Txt>
              </View>
            )}
          </Card>

          {/* owed / owe */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <StatTile
              label="You’re owed"
              value={owed}
              color={t.success}
              icon="arrow-down"
              onPress={() => router.push('/friends')}
            />
            <StatTile
              label="You owe"
              value={owe}
              color={t.danger}
              icon="arrow-up"
              onPress={() => router.push('/friends')}
            />
          </View>

          {/* net worth glance */}
          <Card padding={16} onPress={() => router.push('/(tabs)/analytics')}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ flex: 1 }}>
                <Txt variant="caption" tone="ink2">
                  Net worth
                </Txt>
                <MoneyText value={netWorth} size={22} weight="bold" style={{ marginTop: 2 }} />
                <Txt tone="ink3" variant="micro" style={{ marginTop: 4 }}>
                  assets − liabilities
                </Txt>
              </View>
              {cashSeries.length > 1 && <Sparkline data={cashSeries} width={96} height={44} color={t.success} />}
            </View>
          </Card>

          {/* Plan grid */}
          <View>
            <SectionHeader title="Plan" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              <PlanCard
                icon="disc-outline"
                color="#D97706"
                label="Budgets"
                stat={overBudgets ? `${overBudgets} over limit` : 'all on track'}
                statColor={overBudgets ? t.danger : t.success}
                onPress={() => router.push('/budgets')}
              />
              <PlanCard
                icon="repeat"
                color="#8B7EC8"
                label="EMIs"
                stat={`${money(emiMo)}/mo`}
                statColor={t.ink2}
                onPress={() => router.push('/emis')}
              />
              <PlanCard
                icon="rocket-outline"
                color="#16A34A"
                label="Goals"
                stat={`${goalPct}% to target`}
                statColor={t.ink2}
                onPress={() => router.push('/goals')}
              />
              <PlanCard
                icon="trending-up"
                color="#5C7AEA"
                label="Investments"
                stat={money(invGain, { sign: true })}
                statColor={invGain >= 0 ? t.success : t.danger}
                onPress={() => router.push('/investments')}
              />
            </View>
          </View>

          {/* groups quick row */}
          {(groups.data?.items.length ?? 0) > 0 && (
            <View>
              <SectionHeader title="Your groups" action="See all" onAction={() => router.push('/(tabs)/groups')} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {groups.data!.items.map((g) => (
                  <Pressable
                    key={g.id}
                    onPress={() => router.push(`/groups/${g.id}`)}
                    style={{
                      width: 152,
                      backgroundColor: t.surface,
                      borderRadius: 16,
                      padding: 14,
                      borderWidth: 1,
                      borderColor: t.hair,
                      ...t.shadow,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 10,
                          backgroundColor: hexA(t.accent, 0.14),
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name="people" size={18} color={t.accent} />
                      </View>
                      <AvatarStack
                        members={g.members.map((m) => ({ id: m.id, name: m.displayName, me: m.isYou }))}
                        size={22}
                        max={3}
                      />
                    </View>
                    <Txt variant="headline" numberOfLines={1} style={{ marginTop: 12 }}>
                      {g.name}
                    </Txt>
                    <Txt tone="ink3" variant="caption" style={{ marginTop: 2 }}>
                      {g.memberCount} members
                    </Txt>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* recent activity */}
          <View>
            <SectionHeader title="Recent activity" action="See all" onAction={() => router.push('/transactions')} />
            <Card padding={0} style={{ paddingHorizontal: 14 }}>
              {recent.isLoading ? (
                <View style={{ paddingVertical: 8, gap: 14 }}>
                  {[0, 1, 2].map((i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 6 }}>
                      <Skeleton width={44} height={44} radius={14} />
                      <View style={{ flex: 1, gap: 6 }}>
                        <Skeleton width="55%" height={13} />
                        <Skeleton width="35%" height={11} />
                      </View>
                      <Skeleton width={50} height={14} />
                    </View>
                  ))}
                </View>
              ) : (recent.data?.items.length ?? 0) === 0 ? (
                <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                  <Txt tone="ink3" variant="caption">
                    No transactions yet
                  </Txt>
                </View>
              ) : (
                recent.data!.items.map((e, i, arr) => (
                  <TxnRow
                    key={e.id}
                    item={expenseToItem(e)}
                    last={i === arr.length - 1}
                    onPress={() => router.push(`/transactions/${e.id}`)}
                  />
                ))
              )}
            </Card>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function StatTile({
  label,
  value,
  color,
  icon,
  onPress,
}: {
  label: string;
  value: number;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        backgroundColor: t.surface,
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: t.hair,
        opacity: pressed ? 0.85 : 1,
        ...t.shadow,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Txt variant="caption" tone="ink2">
          {label}
        </Txt>
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 999,
            backgroundColor: hexA(color, 0.16),
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={icon} size={13} color={color} />
        </View>
      </View>
      <MoneyText value={value} size={20} weight="bold" color={color} style={{ marginTop: 8 }} />
    </Pressable>
  );
}

function PlanCard({
  icon,
  color,
  label,
  stat,
  statColor,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
  stat: string;
  statColor: string;
  onPress?: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: '47.8%',
        flexGrow: 1,
        backgroundColor: t.surface,
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: t.hair,
        opacity: pressed ? 0.85 : 1,
        ...t.shadow,
      })}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 11,
          backgroundColor: hexA(color, 0.15),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={19} color={color} />
      </View>
      <Txt variant="headline" style={{ marginTop: 10 }}>
        {label}
      </Txt>
      <Txt color={statColor} variant="caption" style={{ fontFamily: Font.semibold, marginTop: 1 }}>
        {stat}
      </Txt>
    </Pressable>
  );
}
