import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, View } from 'react-native';

import { useBudget } from '@/features/hooks';
import { money } from '@/lib/money';
import { useTheme } from '@/theme';
import { Card, MoneyText, ProgressRing, Screen, Skeleton, Txt, TopBar } from '@/ui';

export default function BudgetDetail() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: b, isLoading } = useBudget(id);

  const color = !b ? t.accent : b.status === 'exceeded' ? t.danger : b.status === 'warning' ? t.warning : t.success;

  return (
    <Screen>
      <TopBar title={b?.name ?? b?.category ?? 'Budget'} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 14 }}>
        {isLoading || !b ? (
          <Skeleton height={220} radius={16} />
        ) : (
          <Card padding={20} style={{ alignItems: 'center' }}>
            <ProgressRing pct={b.percentUsed} size={132} stroke={12} color={color}>
              <Txt style={{ fontWeight: '700', fontSize: 26 }}>{Math.round(b.percentUsed)}%</Txt>
              <Txt tone="ink3" variant="micro">
                used
              </Txt>
            </ProgressRing>
            <View style={{ marginTop: 16, alignItems: 'center' }}>
              <MoneyText value={Math.abs(b.remaining)} size={24} weight="bold" color={b.remaining < 0 ? t.danger : t.ink} />
              <Txt tone="ink2" variant="caption" style={{ marginTop: 2 }}>
                {b.remaining < 0 ? 'over budget this period' : 'remaining this period'}
              </Txt>
            </View>
            <View
              style={{
                flexDirection: 'row',
                marginTop: 18,
                width: '100%',
                borderTopWidth: 1,
                borderTopColor: t.hair,
                paddingTop: 14,
              }}
            >
              <Stat label="Spent" value={money(b.spent)} />
              <Divider />
              <Stat label="Limit" value={money(b.amount)} />
              <Divider />
              <Stat label="Period" value={b.period} cap />
            </View>
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}

function Stat({ label, value, cap }: { label: string; value: string; cap?: boolean }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Txt tone="ink3" variant="micro">
        {label}
      </Txt>
      <Txt variant="headline" style={{ marginTop: 2, textTransform: cap ? 'capitalize' : 'none' }}>
        {value}
      </Txt>
    </View>
  );
}
function Divider() {
  const t = useTheme();
  return <View style={{ width: 1, backgroundColor: t.hair }} />;
}
