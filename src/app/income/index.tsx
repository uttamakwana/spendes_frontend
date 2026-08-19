import { useRouter } from 'expo-router';
import { format, isToday, isYesterday } from 'date-fns';
import React, { useMemo } from 'react';
import { View } from 'react-native';

import type { Income } from '@/api';
import { useIncomeList } from '@/features/hooks';
import { incomeToItem, TxnRow } from '@/features/transactions/TxnRow';
import { money } from '@/lib/money';
import { useRefresh } from '@/lib/useRefresh';
import { useTheme } from '@/theme';
import { Font } from '@/theme/fonts';
import { Button, Card, CollapsibleScreen, EmptyState, IconButton, MoneyText, Skeleton, Txt } from '@/ui';

function dateLabel(d: string) {
  const date = new Date(d);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEE, d MMM');
}

export default function IncomeList() {
  const t = useTheme();
  const router = useRouter();
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useIncomeList();
  const items: Income[] = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);
  const { refreshing, onRefresh } = useRefresh([{ refetch }]);
  const monthTotal = items.reduce((s, i) => s + i.amount, 0);

  const groups = useMemo(() => {
    const map: Record<string, Income[]> = {};
    items.forEach((i) => {
      const key = i.receivedAt.slice(0, 10);
      (map[key] ??= []).push(i);
    });
    return Object.entries(map).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [items]);

  return (
    <CollapsibleScreen
      title="Income"
      right={<IconButton name="add" bg={t.accent} color="#fff" onPress={() => router.push('/add-transaction?kind=income')} />}
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
    >
        {isLoading ? (
          <View style={{ gap: 10, marginTop: 8 }}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height={60} radius={14} />
            ))}
          </View>
        ) : items.length === 0 ? (
          <EmptyState
            icon="arrow-down-circle-outline"
            title="No income yet"
            subtitle="Log your salary, refunds or other credits to see your full cash flow."
            actionLabel="Add income"
            onAction={() => router.push('/add-transaction?kind=income')}
          />
        ) : (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4 }}>
              <Txt tone="ink2" variant="caption">
                Total received
              </Txt>
              <MoneyText value={monthTotal} size={16} weight="bold" color={t.success} />
            </View>
            {groups.map(([date, incomes]) => {
              const dayTotal = incomes.reduce((s, i) => s + i.amount, 0);
              return (
                <View key={date} style={{ marginTop: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, paddingVertical: 6 }}>
                    <Txt variant="caption" style={{ fontFamily: Font.semibold }} tone="ink2">
                      {dateLabel(date)}
                    </Txt>
                    <Txt tone="success" variant="caption" style={{ fontFamily: Font.semibold }}>
                      +{money(dayTotal)}
                    </Txt>
                  </View>
                  <Card padding={0} style={{ paddingHorizontal: 14 }}>
                    {incomes.map((i, idx) => (
                      <TxnRow key={i.id} item={incomeToItem(i)} last={idx === incomes.length - 1} onPress={() => router.push(`/income/${i.id}`)} />
                    ))}
                  </Card>
                </View>
              );
            })}
            {hasNextPage && (
              <View style={{ marginTop: 16 }}>
                <Button variant="neutral" loading={isFetchingNextPage} onPress={() => fetchNextPage()}>
                  Load more
                </Button>
              </View>
            )}
          </>
        )}
    </CollapsibleScreen>
  );
}
