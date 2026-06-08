import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { format, isToday, isYesterday } from 'date-fns';
import React, { useMemo, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';

import type { Expense } from '@/api';
import { useExpenses } from '@/features/hooks';
import { expenseToItem, TxnRow } from '@/features/transactions/TxnRow';
import { money } from '@/lib/money';
import { useTheme } from '@/theme';
import { Font } from '@/theme/fonts';
import { Button, Card, CollapsibleScreen, EmptyState, IconButton, Skeleton, Txt } from '@/ui';

const FILTERS = ['all', 'upi', 'card', 'cash'] as const;

function dateLabel(d: string) {
  const date = new Date(d);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEE, d MMM');
}

export default function Transactions() {
  const t = useTheme();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [method, setMethod] = useState<(typeof FILTERS)[number]>('all');

  const filters = useMemo(
    () => ({
      search: search || undefined,
      paymentMethod: method === 'all' ? undefined : (method as 'upi' | 'card' | 'cash'),
      limit: 20,
    }),
    [search, method],
  );

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useExpenses(filters);
  const items: Expense[] = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);

  const groups = useMemo(() => {
    const map: Record<string, Expense[]> = {};
    items.forEach((e) => {
      const key = e.spentAt.slice(0, 10);
      (map[key] ??= []).push(e);
    });
    return Object.entries(map).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [items]);

  return (
    <CollapsibleScreen
      title="Transactions"
      right={<IconButton name="arrow-down-circle-outline" onPress={() => router.push('/income')} />}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
    >
        {/* search */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            backgroundColor: t.surface,
            borderWidth: 1,
            borderColor: t.line,
            borderRadius: 12,
            paddingHorizontal: 14,
            height: 44,
            marginBottom: 12,
          }}
        >
          <Ionicons name="search" size={18} color={t.ink3} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search merchant or note"
            placeholderTextColor={t.ink3}
            style={{ flex: 1, fontFamily: Font.regular, fontSize: 15, color: t.ink }}
          />
        </View>

        {/* filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 8 }}>
          {FILTERS.map((f) => {
            const on = method === f;
            return (
              <View key={f}>
                <Txt
                  onPress={() => setMethod(f)}
                  color={on ? t.canvas : t.ink2}
                  style={{
                    fontFamily: Font.semibold,
                    fontSize: 13.5,
                    overflow: 'hidden',
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 999,
                    backgroundColor: on ? t.ink : t.surface,
                    borderWidth: 1,
                    borderColor: on ? t.ink : t.line,
                    textTransform: 'capitalize',
                  }}
                >
                  {f}
                </Txt>
              </View>
            );
          })}
        </ScrollView>

        {isLoading ? (
          <View style={{ gap: 10, marginTop: 8 }}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} height={60} radius={14} />
            ))}
          </View>
        ) : groups.length === 0 ? (
          <EmptyState icon="search" title="No transactions" subtitle="Try a different search or filter." />
        ) : (
          groups.map(([date, txns]) => {
            const dayTotal = txns.reduce((s, e) => s + Math.abs(e.amount), 0);
            return (
              <View key={date} style={{ marginTop: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, paddingVertical: 6 }}>
                  <Txt variant="caption" style={{ fontFamily: Font.semibold }} tone="ink2">
                    {dateLabel(date)}
                  </Txt>
                  <Txt tone="ink3" variant="caption" style={{ fontFamily: Font.semibold }}>
                    −{money(dayTotal)}
                  </Txt>
                </View>
                <Card padding={0} style={{ paddingHorizontal: 14 }}>
                  {txns.map((e, i) => (
                    <TxnRow
                      key={e.id}
                      item={expenseToItem(e)}
                      last={i === txns.length - 1}
                      onPress={() => router.push(`/transactions/${e.id}`)}
                    />
                  ))}
                </Card>
              </View>
            );
          })
        )}

        {hasNextPage && (
          <View style={{ marginTop: 16 }}>
            <Button variant="neutral" loading={isFetchingNextPage} onPress={() => fetchNextPage()}>
              Load more
            </Button>
          </View>
        )}
    </CollapsibleScreen>
  );
}
