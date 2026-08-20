import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { errorMessage } from '@/api';
import { useBudget, useDeleteBudget } from '@/features/hooks';
import { money } from '@/lib/money';
import { useTheme } from '@/theme';
import { Button, Card, IconButton, MoneyText, ProgressRing, Screen, Skeleton, Txt, TopBar } from '@/ui';

export default function BudgetDetail() {
  const t = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: b, isLoading } = useBudget(id);
  const del = useDeleteBudget();

  const color = !b ? t.accent : b.status === 'exceeded' ? t.danger : b.status === 'warning' ? t.warning : t.success;

  const confirmDelete = () => {
    Alert.alert('Delete this budget?', 'It will stop tracking this limit. This can’t be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          del.mutate(id, {
            onSuccess: () => router.back(),
            onError: (e) => Alert.alert('Could not delete', errorMessage(e)),
          }),
      },
    ]);
  };

  return (
    <Screen>
      <TopBar
        title={b?.name ?? b?.category ?? 'Budget'}
        right={<IconButton name="create-outline" onPress={() => router.push(`/budgets/edit?id=${id}`)} />}
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 14 }}>
        {isLoading || !b ? (
          <Skeleton height={220} radius={16} />
        ) : (
          <>
          <Card padding={20} style={{ alignItems: 'center' }}>
            <ProgressRing pct={b.percentUsed} size={132} stroke={12} color={color}>
              <Txt style={{ fontWeight: '700', fontSize: 26 }}>{Math.round(b.percentUsed)}%</Txt>
              <Txt tone="ink3" variant="micro">
                used
              </Txt>
            </ProgressRing>
            <View style={{ marginTop: 16, alignItems: 'center' }}>
              <MoneyText value={Math.abs(b.remaining)} size={24} weight="bold" animate color={b.remaining < 0 ? t.danger : t.ink} />
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
          <Button variant="danger" icon="trash-outline" loading={del.isPending} onPress={confirmDelete}>
            Delete budget
          </Button>
          </>
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
