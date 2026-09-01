import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { format, isToday, isYesterday } from 'date-fns';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  TextInput,
  View,
} from 'react-native';

import type { Expense } from '@/api';
import { useDeleteExpense, useExpenses } from '@/features/hooks';
import { expenseToItem, TxnRow } from '@/features/transactions/TxnRow';
import { haptics } from '@/lib/haptics';
import { money } from '@/lib/money';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { useRefresh } from '@/lib/useRefresh';
import { useTheme } from '@/theme';
import { Font } from '@/theme/fonts';
import { ActionMenu, Card, EmptyState, IconButton, Screen, Skeleton, TopBar, Txt } from '@/ui';

const FILTERS = ['all', 'upi', 'card', 'cash'] as const;

function dateLabel(d: string) {
  const date = new Date(d);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEE, d MMM');
}

type DayGroup = [string, Expense[]];

export default function Transactions() {
  const t = useTheme();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [method, setMethod] = useState<(typeof FILTERS)[number]>('all');

  // The field updates on every keystroke; the query waits for a pause. Without
  // this, each character was its own request — and its own empty list.
  const debouncedSearch = useDebouncedValue(search.trim(), 350);

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      paymentMethod: method === 'all' ? undefined : (method as 'upi' | 'card' | 'cash'),
      limit: 20,
    }),
    [debouncedSearch, method],
  );

  const {
    data,
    isLoading,
    isPlaceholderData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useExpenses(filters);

  // Results on screen belong to the previous filter, or the field has changed and
  // the query hasn't caught up yet. Either way something is in flight — say so in
  // the search box rather than tearing the list down.
  const settling = isPlaceholderData || debouncedSearch !== search.trim();
  const items: Expense[] = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);
  const { refreshing, onRefresh } = useRefresh([{ refetch }]);
  const del = useDeleteExpense();
  const [menuFor, setMenuFor] = useState<Expense | null>(null);

  const confirmDelete = useCallback(
    (id: string) =>
      Alert.alert('Delete transaction?', 'This permanently removes it.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => del.mutate(id) },
      ]),
    [del],
  );

  const groups: DayGroup[] = useMemo(() => {
    const map: Record<string, Expense[]> = {};
    items.forEach((e) => {
      const key = e.spentAt.slice(0, 10);
      (map[key] ??= []).push(e);
    });
    return Object.entries(map).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [items]);

  const renderDay = useCallback(
    ({ item }: { item: DayGroup }) => {
      const [date, txns] = item;
      const dayTotal = txns.reduce((s, e) => s + Math.abs(e.amount), 0);
      return (
        <View style={{ marginTop: 8 }}>
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
                onDelete={() => confirmDelete(e.id)}
                onLongPress={() => {
                  haptics.medium();
                  setMenuFor(e);
                }}
              />
            ))}
          </Card>
        </View>
      );
    },
    [router, confirmDelete],
  );

  return (
    <Screen>
      <TopBar title="" right={<IconButton name="arrow-down-circle-outline" onPress={() => router.push('/income')} />} />

      {/* fixed header: title + search + filters */}
      <View style={{ paddingHorizontal: 16 }}>
        <Txt variant="title1" style={{ paddingHorizontal: 4, paddingBottom: 10 }}>
          Transactions
        </Txt>
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
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            clearButtonMode="never"
            style={{ flex: 1, fontFamily: Font.regular, fontSize: 15, color: t.ink }}
          />
          {/* Fixed-width slot so the field never reflows as this swaps. */}
          <View style={{ width: 20, alignItems: 'center', justifyContent: 'center' }}>
            {settling ? (
              <ActivityIndicator size="small" color={t.ink3} />
            ) : search.length > 0 ? (
              <Pressable onPress={() => setSearch('')} hitSlop={12}>
                <Ionicons name="close-circle" size={18} color={t.ink3} />
              </Pressable>
            ) : null}
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 8 }}>
          {FILTERS.map((f) => {
            const on = method === f;
            return (
              <Txt
                key={f}
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
            );
          })}
        </ScrollView>
      </View>

      <View style={{ flex: 1 }}>
        <FlashList
          data={groups}
          keyExtractor={(item) => item[0]}
          renderItem={renderDay}
          extraData={t.dark}
          onEndReached={() => {
            // Not while showing the previous filter's results — that page belongs
            // to a query we're about to replace.
            if (hasNextPage && !isFetchingNextPage && !isPlaceholderData) fetchNextPage();
          }}
          onEndReachedThreshold={0.4}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={t.accent}
              colors={[t.accent]}
              progressBackgroundColor={t.surface}
            />
          }
          ListEmptyComponent={
            // Skeletons belong to the first load only. Once there are results to
            // keep, a filter change holds them until the new ones arrive.
            isLoading ? (
              <View style={{ gap: 10, marginTop: 8 }}>
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} height={60} radius={14} />
                ))}
              </View>
            ) : settling ? null : (
              <EmptyState
                icon="search"
                title={debouncedSearch ? `Nothing matches “${debouncedSearch}”` : 'No transactions'}
                subtitle="Try a different search or filter."
              />
            )
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <ActivityIndicator color={t.accent} />
              </View>
            ) : null
          }
        />
      </View>

      <ActionMenu
        open={!!menuFor}
        onClose={() => setMenuFor(null)}
        title={menuFor ? expenseToItem(menuFor).title : undefined}
        actions={
          menuFor
            ? [
                {
                  icon: 'create-outline',
                  label: 'Edit',
                  onPress: () => router.push(`/edit-transaction?id=${menuFor.id}`),
                },
                {
                  icon: 'trash-outline',
                  label: 'Delete',
                  destructive: true,
                  onPress: () => confirmDelete(menuFor.id),
                },
              ]
            : []
        }
      />
    </Screen>
  );
}
