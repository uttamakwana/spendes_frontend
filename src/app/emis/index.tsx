import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { useEmis, useEmiSummary } from '@/features/hooks';
import { categoryStyle } from '@/lib/categories';
import { money } from '@/lib/money';
import { useRefresh } from '@/lib/useRefresh';
import { hexA, useTheme } from '@/theme';
import { Font } from '@/theme/fonts';
import { Card, CollapsibleScreen, EmptyState, IconButton, MoneyText, SectionHeader, Skeleton, Txt } from '@/ui';
import { format } from 'date-fns';

export default function Emis() {
  const t = useTheme();
  const router = useRouter();
  const list = useEmis();
  const summary = useEmiSummary();
  const { refreshing, onRefresh } = useRefresh([list, summary]);
  const items = list.data?.items ?? [];
  const s = summary.data;

  return (
    <CollapsibleScreen
      title="EMIs & Recurring"
      right={<IconButton name="add" bg={t.accent} color="#fff" onPress={() => router.push('/emis/new')} />}
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 12 }}
    >
        <View style={{ backgroundColor: t.premium, borderRadius: 18, padding: 18 }}>
          <Txt color={t.onPremiumDim} variant="caption">
            Total monthly commitment
          </Txt>
          {summary.isLoading ? (
            <Skeleton width={160} height={32} style={{ marginTop: 4 }} />
          ) : (
            <MoneyText value={s?.totalMonthlyCommitment ?? 0} size={30} weight="bold" color={t.onPremium} style={{ marginTop: 3 }} />
          )}
          <View style={{ flexDirection: 'row', gap: 18, marginTop: 12 }}>
            <Txt color={t.onPremiumDim} variant="caption">
              due this month{' '}
              <Txt color={t.onPremium} style={{ fontFamily: Font.semibold }}>
                {money(s?.dueThisMonth.total ?? 0)}
              </Txt>
            </Txt>
            <Txt color={t.onPremiumDim} variant="caption">
              obligations{' '}
              <Txt color={t.onPremium} style={{ fontFamily: Font.semibold }}>
                {s?.activeCount ?? items.length}
              </Txt>
            </Txt>
          </View>
        </View>

        <SectionHeader title="Upcoming" />
        {list.isLoading ? (
          [0, 1, 2].map((i) => <Skeleton key={i} height={72} radius={16} />)
        ) : items.length === 0 ? (
          <EmptyState icon="repeat" title="No recurring payments" subtitle="Track loans, rent and subscriptions in one place." actionLabel="Add commitment" onAction={() => router.push('/emis/new')} />
        ) : (
          items.map((e) => {
            const color = categoryStyle(e.category ?? e.name).color;
            const due = e.nextDueDate ? format(new Date(e.nextDueDate), 'MMM d') : null;
            return (
              <Card key={e.id} onPress={() => router.push(`/emis/${e.id}`)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: hexA(color, 0.15), alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={e.type === 'subscription' ? 'sync' : 'card'} size={22} color={color} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Txt variant="headline" numberOfLines={1}>
                      {e.name}
                    </Txt>
                    <Txt tone="ink3" variant="caption" style={{ marginTop: 1, textTransform: 'capitalize' }}>
                      {e.type} · {e.tenureCount ? `${e.installmentsPaid}/${e.tenureCount} paid` : 'auto-renews'}
                    </Txt>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <MoneyText value={e.amount} size={15} weight="bold" />
                    <Txt
                      variant="micro"
                      color={e.dueThisMonth ? t.warning : t.ink3}
                      style={{ marginTop: 2, fontFamily: Font.semibold }}
                    >
                      {due ? `due ${due}` : 'scheduled'}
                    </Txt>
                  </View>
                </View>
              </Card>
            );
          })
        )}
    </CollapsibleScreen>
  );
}
