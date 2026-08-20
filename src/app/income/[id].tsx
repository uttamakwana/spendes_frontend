import { useLocalSearchParams, useRouter } from 'expo-router';
import { format } from 'date-fns';
import React from 'react';
import { ScrollView, View } from 'react-native';

import { useDeleteIncome, useIncome } from '@/features/hooks';
import { useTheme } from '@/theme';
import { Font } from '@/theme/fonts';
import { Button, CategoryIcon, IconButton, MoneyText, Screen, Skeleton, Txt, TopBar } from '@/ui';

export default function IncomeDetail() {
  const t = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: i, isLoading } = useIncome(id);
  const del = useDeleteIncome();

  return (
    <Screen>
      <TopBar
        title="Income"
        right={i ? <IconButton name="create-outline" onPress={() => router.push(`/edit-transaction?id=${i.id}&type=income`)} /> : undefined}
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, alignItems: 'center' }}>
        {isLoading || !i ? (
          <Skeleton height={120} width="100%" radius={16} style={{ marginTop: 8 }} />
        ) : (
          <>
            <CategoryIcon name={i.category} size={64} radius={20} />
            <Txt variant="title3" style={{ marginTop: 14 }}>
              {i.source || i.category}
            </Txt>
            <MoneyText value={i.amount} sign size={36} animate color={t.success} style={{ marginTop: 6 }} />
            <Txt tone="ink3" variant="caption" style={{ marginTop: 4 }}>
              {format(new Date(i.receivedAt), 'EEEE, d MMMM · h:mm a')}
            </Txt>

            <View style={{ width: '100%', marginTop: 22, backgroundColor: t.surface, borderRadius: 16, borderWidth: 1, borderColor: t.hair, paddingHorizontal: 16 }}>
              <Row label="Category" value={i.category} />
              <Row label="Received via" value={i.receivedVia.replace('_', ' ')} cap />
              {i.source ? <Row label="Source" value={i.source} /> : null}
              {i.notes ? <Row label="Note" value={i.notes} /> : null}
              {i.isRecurring ? <Row label="Recurring" value="Yes" /> : null}
            </View>

            <View style={{ width: '100%', marginTop: 14 }}>
              <Button variant="danger" icon="trash" loading={del.isPending} onPress={() => del.mutate(i.id, { onSuccess: () => router.back() })}>
                Delete income
              </Button>
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function Row({ label, value, cap }: { label: string; value: string; cap?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: t.hair }}>
      <Txt tone="ink2">{label}</Txt>
      <Txt style={{ fontFamily: Font.semibold, textTransform: cap ? 'capitalize' : 'none', maxWidth: 200, textAlign: 'right' }}>{value}</Txt>
    </View>
  );
}
