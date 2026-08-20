import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { format } from 'date-fns';
import React from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { errorMessage } from '@/api';
import { useDeleteEmi, useEmi } from '@/features/hooks';
import { categoryStyle } from '@/lib/categories';
import { money } from '@/lib/money';
import { hexA, useTheme } from '@/theme';
import { Button, Card, IconButton, MoneyText, ProgressBar, Screen, Skeleton, Txt, TopBar } from '@/ui';

export default function EmiDetail() {
  const t = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: e, isLoading } = useEmi(id);
  const del = useDeleteEmi();
  const color = e ? categoryStyle(e.category ?? e.name).color : t.accent;
  const hasInstallments = !!e?.tenureCount;
  const pct = hasInstallments && e ? Math.round((e.installmentsPaid / e.tenureCount!) * 100) : 0;

  const confirmDelete = () => {
    Alert.alert('Delete this EMI?', 'It will be removed from your commitments. This can’t be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          del.mutate(id, {
            onSuccess: () => router.back(),
            onError: (err) => Alert.alert('Could not delete', errorMessage(err)),
          }),
      },
    ]);
  };

  return (
    <Screen>
      <TopBar
        title={e?.name ?? 'EMI'}
        right={<IconButton name="create-outline" onPress={() => router.push(`/emis/edit?id=${id}`)} />}
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 14 }}>
        {isLoading || !e ? (
          <Skeleton height={220} radius={16} />
        ) : (
          <>
            <Card padding={20} style={{ alignItems: 'center' }}>
              <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: hexA(color, 0.15), alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Ionicons name="card" size={28} color={color} />
              </View>
              <Txt variant="caption" tone="ink2">
                {e.frequency === 'monthly' ? 'Monthly payment' : `${e.frequency} payment`}
              </Txt>
              <MoneyText value={e.amount} size={32} weight="bold" animate style={{ marginTop: 2 }} />
              {e.nextDueDate && (
                <Txt color={e.dueThisMonth ? t.warning : t.ink2} variant="caption" style={{ marginTop: 6, fontWeight: '600' }}>
                  Next due {format(new Date(e.nextDueDate), 'MMM d, yyyy')}
                </Txt>
              )}
              {hasInstallments && (
                <View style={{ width: '100%', marginTop: 18 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 }}>
                    <Txt tone="ink2" variant="caption">
                      {e.installmentsPaid} of {e.tenureCount} installments
                    </Txt>
                    <Txt variant="caption" style={{ fontWeight: '600' }}>
                      {pct}%
                    </Txt>
                  </View>
                  <ProgressBar pct={pct} color={color} />
                </View>
              )}
            </Card>

            <Card padding={0} style={{ paddingHorizontal: 16 }}>
              <Row label="Type" value={e.type} cap />
              <Row label="Frequency" value={e.frequency} cap />
              {e.remainingAmount != null && <Row label="Remaining" value={money(e.remainingAmount)} />}
              {e.endDate && <Row label="Projected end" value={format(new Date(e.endDate), 'MMM yyyy')} />}
            </Card>

            <Button variant="danger" icon="trash-outline" loading={del.isPending} onPress={confirmDelete}>
              Delete EMI
            </Button>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function Row({ label, value, cap }: { label: string; value: string; cap?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: t.hair }}>
      <Txt tone="ink2">{label}</Txt>
      <Txt style={{ fontWeight: '600', textTransform: cap ? 'capitalize' : 'none' }}>{value}</Txt>
    </View>
  );
}
