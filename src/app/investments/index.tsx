import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { useInvestments, usePortfolio } from '@/features/hooks';
import { CAT_VIZ, hexA, useTheme } from '@/theme';
import { Font } from '@/theme/fonts';
import {
  Card,
  CollapsibleScreen,
  Donut,
  EmptyState,
  IconButton,
  MoneyText,
  SectionHeader,
  Skeleton,
  Txt,
} from '@/ui';

export default function Investments() {
  const t = useTheme();
  const router = useRouter();
  const list = useInvestments();
  const summary = usePortfolio();
  const items = list.data?.items ?? [];
  const s = summary.data;
  const gain = s?.totalGainLoss ?? 0;

  const alloc = (s?.allocation ?? []).map((a, i) => ({ value: a.currentValue, color: CAT_VIZ[i % CAT_VIZ.length] }));

  return (
    <CollapsibleScreen
      title="Investments"
      right={<IconButton name="add" bg={t.accent} color="#fff" onPress={() => router.push('/investments/new')} />}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 12 }}
    >
        {summary.isLoading ? (
          <Skeleton height={150} radius={16} />
        ) : items.length === 0 ? (
          <EmptyState icon="trending-up" title="No holdings yet" subtitle="Add your mutual funds, stocks, gold or crypto to track your portfolio." actionLabel="Add holding" onAction={() => router.push('/investments/new')} />
        ) : (
          <>
            <Card padding={20}>
              <Txt variant="caption" tone="ink2">
                Portfolio value
              </Txt>
              <MoneyText value={s?.totalCurrentValue ?? 0} size={34} weight="bold" style={{ marginTop: 2 }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: gain >= 0 ? t.successBg : t.dangerBg,
                    paddingHorizontal: 10,
                    paddingVertical: 3,
                    borderRadius: 999,
                  }}
                >
                  <Ionicons name={gain >= 0 ? 'trending-up' : 'trending-down'} size={14} color={gain >= 0 ? t.success : t.danger} />
                  <Txt color={gain >= 0 ? t.success : t.danger} style={{ fontFamily: Font.semibold, fontSize: 13.5 }}>
                    {gain >= 0 ? '+' : ''}
                    {(s?.gainLossPct ?? 0).toFixed(1)}%
                  </Txt>
                </View>
                <MoneyText value={gain} size={13.5} weight="semibold" sign color={gain >= 0 ? t.success : t.danger} />
                <Txt tone="ink3" variant="caption">
                  all time
                </Txt>
              </View>
              <View style={{ flexDirection: 'row', gap: 16, marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: t.hair }}>
                <View style={{ flex: 1 }}>
                  <Txt tone="ink3" variant="micro">
                    Invested
                  </Txt>
                  <MoneyText value={s?.totalInvested ?? 0} size={15} weight="bold" style={{ marginTop: 1 }} />
                </View>
                <View style={{ flex: 1 }}>
                  <Txt tone="ink3" variant="micro">
                    Holdings
                  </Txt>
                  <Txt variant="headline" style={{ marginTop: 1 }}>
                    {s?.holdingsCount ?? items.length} assets
                  </Txt>
                </View>
              </View>
            </Card>

            {alloc.length > 0 && (
              <Card padding={18}>
                <SectionHeader title="Allocation" />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                  <Donut data={alloc} size={120} stroke={20}>
                    <Txt tone="ink3" variant="micro">
                      assets
                    </Txt>
                    <Txt variant="headline">{s?.holdingsCount ?? items.length}</Txt>
                  </Donut>
                  <View style={{ flex: 1, gap: 8 }}>
                    {(s?.allocation ?? []).map((a, i) => (
                      <View key={a.type} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ width: 9, height: 9, borderRadius: 3, backgroundColor: CAT_VIZ[i % CAT_VIZ.length] }} />
                        <Txt tone="ink2" variant="caption" numberOfLines={1} style={{ flex: 1, textTransform: 'capitalize' }}>
                          {a.type.replace('_', ' ')}
                        </Txt>
                        <Txt variant="caption" style={{ fontFamily: Font.semibold }}>
                          {Math.round(a.percent)}%
                        </Txt>
                      </View>
                    ))}
                  </View>
                </View>
              </Card>
            )}

            <SectionHeader title="Holdings" />
            {items.map((inv) => {
              const g = inv.gainLoss;
              return (
                <Card key={inv.id} onPress={() => router.push(`/investments/${inv.id}`)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: hexA('#5C7AEA', 0.15), alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="trending-up" size={22} color="#5C7AEA" />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Txt variant="headline" numberOfLines={1}>
                        {inv.name}
                      </Txt>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Txt tone="ink3" variant="caption" style={{ textTransform: 'capitalize' }}>
                          {inv.type.replace('_', ' ')}
                        </Txt>
                        {inv.sip?.isActive && (
                          <View style={{ backgroundColor: hexA(t.accent, 0.14), paddingHorizontal: 6, paddingVertical: 1, borderRadius: 5 }}>
                            <Txt variant="micro" style={{ color: t.accent, fontFamily: Font.semibold }}>
                              SIP
                            </Txt>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <MoneyText value={inv.currentValue} size={14.5} weight="bold" />
                      <Txt color={g >= 0 ? t.success : t.danger} variant="micro" style={{ marginTop: 1, fontFamily: Font.semibold }}>
                        {g >= 0 ? '+' : ''}
                        {inv.gainLossPct.toFixed(1)}%
                      </Txt>
                    </View>
                  </View>
                </Card>
              );
            })}
          </>
        )}
    </CollapsibleScreen>
  );
}
