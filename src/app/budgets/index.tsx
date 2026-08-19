import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import type { Budget } from '@/api';
import { useBudgets } from '@/features/hooks';
import { money } from '@/lib/money';
import { useRefresh } from '@/lib/useRefresh';
import { useTheme } from '@/theme';
import { Font } from '@/theme/fonts';
import {
  Card,
  CategoryIcon,
  CollapsibleScreen,
  EmptyState,
  IconButton,
  MoneyText,
  ProgressBar,
  SectionHeader,
  Skeleton,
  StatusPill,
  Txt,
} from '@/ui';

function statusColor(t: ReturnType<typeof useTheme>, s: Budget['status']) {
  return s === 'exceeded' ? t.danger : s === 'warning' ? t.warning : t.success;
}
const STATUS_LABEL: Record<Budget['status'], string> = { ok: 'On track', warning: 'Watch', exceeded: 'Over budget' };

export default function Budgets() {
  const t = useTheme();
  const router = useRouter();
  const { data, isLoading, refetch } = useBudgets();
  const items = data?.items ?? [];
  const { refreshing, onRefresh } = useRefresh([{ refetch }]);
  const overall = items.find((b) => !b.category);
  const cats = items.filter((b) => b.category);

  return (
    <CollapsibleScreen
      title="Budgets"
      right={<IconButton name="add" bg={t.accent} color="#fff" onPress={() => router.push('/budgets/new')} />}
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 12 }}
    >
        {isLoading ? (
          [0, 1, 2].map((i) => <Skeleton key={i} height={90} radius={16} />)
        ) : items.length === 0 ? (
          <EmptyState icon="disc-outline" title="No budgets yet" subtitle="Set a monthly limit overall or per category to stay on track." actionLabel="Create budget" onAction={() => router.push('/budgets/new')} />
        ) : (
          <>
            {overall && (
              <Card padding={18}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Txt variant="caption" tone="ink2">
                    {overall.name ?? 'Overall monthly'}
                  </Txt>
                  <StatusPill label={STATUS_LABEL[overall.status]} color={statusColor(t, overall.status)} />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
                  <MoneyText value={Math.abs(overall.remaining)} size={30} weight="bold" color={overall.remaining < 0 ? t.danger : t.ink} />
                  <Txt tone="ink3" variant="caption">
                    {overall.remaining < 0 ? 'over' : 'left'}
                  </Txt>
                </View>
                <View style={{ marginTop: 14 }}>
                  <ProgressBar pct={overall.percentUsed} color={statusColor(t, overall.status)} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 9 }}>
                  <Txt tone="ink2" variant="caption">
                    Spent <Txt style={{ fontFamily: Font.semibold }}>{money(overall.spent)}</Txt>
                  </Txt>
                  <Txt tone="ink2" variant="caption">
                    Limit <Txt style={{ fontFamily: Font.semibold }}>{money(overall.amount)}</Txt>
                  </Txt>
                </View>
              </Card>
            )}

            {cats.length > 0 && <SectionHeader title="By category" />}
            {cats.map((b) => (
              <Card key={b.id} onPress={() => router.push(`/budgets/${b.id}`)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <CategoryIcon name={b.category} size={40} />
                  <View style={{ flex: 1 }}>
                    <Txt variant="headline">{b.name ?? b.category}</Txt>
                    <Txt tone="ink3" variant="caption" style={{ textTransform: 'capitalize' }}>
                      {b.period}
                    </Txt>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <MoneyText value={Math.abs(b.remaining)} size={14.5} weight="bold" color={b.remaining < 0 ? t.danger : t.ink} />
                    <Txt tone="ink3" variant="micro">
                      {b.remaining < 0 ? 'over' : 'left'}
                    </Txt>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 11 }}>
                  <View style={{ flex: 1 }}>
                    <ProgressBar pct={b.percentUsed} color={statusColor(t, b.status)} height={6} />
                  </View>
                  <Txt tone="ink3" variant="micro" style={{ fontFamily: Font.semibold }}>
                    {money(b.spent)} / {money(b.amount)}
                  </Txt>
                </View>
              </Card>
            ))}
          </>
        )}
    </CollapsibleScreen>
  );
}
