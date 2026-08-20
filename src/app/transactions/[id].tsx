import { useLocalSearchParams, useRouter } from 'expo-router';
import { format } from 'date-fns';
import React from 'react';
import { ScrollView, View } from 'react-native';

import { useDeleteExpense, useExpense } from '@/features/hooks';
import { useTheme } from '@/theme';
import { Font } from '@/theme/fonts';
import { Button, CategoryIcon, IconButton, MoneyText, Screen, Skeleton, StatusPill, Txt, TopBar } from '@/ui';

export default function TxnDetail() {
  const t = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: e, isLoading } = useExpense(id);
  const del = useDeleteExpense();

  const isShare = e?.source === 'group_share';

  return (
    <Screen>
      <TopBar
        title="Details"
        right={
          e && !isShare ? (
            <IconButton name="create-outline" onPress={() => router.push(`/edit-transaction?id=${e.id}&type=expense`)} />
          ) : undefined
        }
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, alignItems: 'center' }}>
        {isLoading || !e ? (
          <Skeleton height={120} width="100%" radius={16} style={{ marginTop: 8 }} />
        ) : (
          <>
            <CategoryIcon name={e.category} size={64} radius={20} />
            <Txt variant="title3" style={{ marginTop: 14 }}>
              {e.merchant || e.description || e.category}
            </Txt>
            <MoneyText value={-Math.abs(e.amount)} sign size={36} animate style={{ marginTop: 6 }} />
            <Txt tone="ink3" variant="caption" style={{ marginTop: 4 }}>
              {format(new Date(e.spentAt), 'EEEE, d MMMM · h:mm a')}
            </Txt>

            <View
              style={{
                width: '100%',
                marginTop: 22,
                backgroundColor: t.surface,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: t.hair,
                paddingHorizontal: 16,
              }}
            >
              <Row label="Category" value={e.category} />
              <Row label="Payment method" value={e.paymentMethod.replace('_', ' ')} cap />
              {e.notes ? <Row label="Note" value={e.notes} /> : null}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 }}>
                <Txt tone="ink2">Source</Txt>
                {isShare ? (
                  <StatusPill label="Split share" color={t.accent} />
                ) : (
                  <StatusPill label="Personal" color={t.success} />
                )}
              </View>
            </View>

            {isShare ? (
              <View style={{ width: '100%', marginTop: 14 }}>
                <Button
                  variant="soft"
                  icon="people"
                  onPress={() => (e.groupId ? router.push(`/groups/${e.groupId}`) : undefined)}
                >
                  View in group
                </Button>
                <Txt tone="ink3" variant="caption" center style={{ marginTop: 10 }}>
                  Split shares are managed in the group and can’t be edited here.
                </Txt>
              </View>
            ) : (
              <View style={{ width: '100%', marginTop: 14 }}>
                <Button
                  variant="danger"
                  icon="trash"
                  loading={del.isPending}
                  onPress={() => del.mutate(e.id, { onSuccess: () => router.back() })}
                >
                  Delete transaction
                </Button>
              </View>
            )}
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
