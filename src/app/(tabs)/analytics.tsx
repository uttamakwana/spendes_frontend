import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCashflow, useOverview } from '@/features/hooks';
import { categoryStyle } from '@/lib/categories';
import { money } from '@/lib/money';
import { useRefresh } from '@/lib/useRefresh';
import { CAT_VIZ, hexA, useTheme } from '@/theme';
import { Font } from '@/theme/fonts';
import {
  Bars,
  Card,
  CollapsibleScreen,
  Donut,
  MoneyText,
  ProgressRing,
  SectionHeader,
  Skeleton,
  Txt,
} from '@/ui';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function AnalyticsTab() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const overview = useOverview();
  const cashflow = useCashflow(6);
  const { refreshing, onRefresh } = useRefresh([overview, cashflow]);

  const o = overview.data;
  const income = o?.income ?? 0;
  const expense = o?.expense ?? 0;
  const cashOut = o?.cashOutflow ?? 0;
  const fronted = Math.max(0, cashOut - expense);
  const savingsRate = Math.round(o?.savingsRate ?? 0);
  const spentPct = income > 0 ? Math.min(100, (expense / income) * 100) : 0;

  const top = o?.topCategories ?? [];
  const donutData = top.map((c, i) => ({
    value: c.totalAmount,
    color: categoryStyle(c.category).color ?? CAT_VIZ[i % CAT_VIZ.length],
  }));

  const series = cashflow.data?.series ?? [];
  const trend = series.map((p) => p.expense);
  const trendLabels = series.map((p) => MONTHS[((p.month ?? 1) - 1) % 12] ?? '');

  return (
    <CollapsibleScreen
      title="Insights"
      subtitle={o ? 'This month' : undefined}
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 90, gap: 14 }}
    >
        {overview.isLoading ? (
          <>
            <Skeleton height={120} radius={16} />
            <Skeleton height={140} radius={16} />
            <Skeleton height={180} radius={16} />
          </>
        ) : (
          <>
            {/* income vs expense */}
            <Card padding={18}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View>
                  <Txt variant="caption" tone="ink2">
                    Total spent
                  </Txt>
                  <MoneyText value={expense} size={28} weight="bold" style={{ marginTop: 2 }} />
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Txt variant="caption" tone="ink2">
                    Income
                  </Txt>
                  <MoneyText value={income} size={18} weight="bold" color={t.success} style={{ marginTop: 4 }} />
                </View>
              </View>
              <View style={{ height: 10, borderRadius: 999, backgroundColor: t.fill2, marginTop: 14, overflow: 'hidden' }}>
                <View style={{ width: `${spentPct}%`, height: '100%', backgroundColor: t.accent }} />
              </View>
              <Txt tone="ink3" variant="caption" style={{ marginTop: 8 }}>
                You spent <Txt style={{ fontFamily: Font.semibold }} color={t.ink}>{Math.round(spentPct)}%</Txt> of what you earned
              </Txt>
              {fronted > 0.5 && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 12,
                    paddingTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: t.hair,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="wallet-outline" size={15} color={t.ink2} />
                    <Txt variant="caption" tone="ink2">
                      Cash out of pocket
                    </Txt>
                  </View>
                  <Txt style={{ fontFamily: Font.semibold }}>{money(cashOut)}</Txt>
                </View>
              )}
            </Card>

            {/* savings rate + spend trend */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Card padding={16} style={{ width: 142, alignItems: 'center' }}>
                <Txt variant="caption" tone="ink2" style={{ alignSelf: 'flex-start' }}>
                  Savings rate
                </Txt>
                <View style={{ marginTop: 8 }}>
                  <ProgressRing pct={savingsRate} size={92} stroke={9} color={t.success}>
                    <Txt style={{ fontFamily: Font.bold, fontSize: 22 }}>{savingsRate}%</Txt>
                  </ProgressRing>
                </View>
              </Card>
              <Card padding={16} style={{ flex: 1 }}>
                <Txt variant="caption" tone="ink2">
                  Spend trend
                </Txt>
                <View style={{ marginTop: 8 }}>
                  {trend.length > 1 ? (
                    <Bars data={trend} labels={trendLabels} height={92} color={t.accent} />
                  ) : (
                    <Txt tone="ink3" variant="caption" style={{ marginTop: 30 }}>
                      Not enough data yet
                    </Txt>
                  )}
                </View>
              </Card>
            </View>

            {/* category donut */}
            {top.length > 0 && (
              <Card padding={18}>
                <SectionHeader title="Where it went" />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                  <Donut data={donutData} size={132} stroke={22}>
                    <Txt tone="ink3" variant="micro">
                      spent
                    </Txt>
                    <MoneyText value={expense} size={16} weight="bold" />
                  </Donut>
                  <View style={{ flex: 1, gap: 9 }}>
                    {top.slice(0, 5).map((c, i) => (
                      <View key={c.category} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View
                          style={{
                            width: 9,
                            height: 9,
                            borderRadius: 3,
                            backgroundColor: donutData[i]?.color ?? t.accent,
                          }}
                        />
                        <Txt tone="ink2" variant="caption" numberOfLines={1} style={{ flex: 1 }}>
                          {c.category}
                        </Txt>
                        <Txt variant="caption" style={{ fontFamily: Font.semibold }}>
                          {money(c.totalAmount)}
                        </Txt>
                      </View>
                    ))}
                  </View>
                </View>
              </Card>
            )}

            {/* recurring + portfolio */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <GlanceCard
                icon="repeat"
                color="#8B7EC8"
                label="Recurring / mo"
                value={money(o?.commitments.totalMonthlyCommitment ?? 0)}
                sub={`${o?.commitments.dueThisMonthCount ?? 0} due this month`}
                onPress={() => router.push('/emis')}
              />
              <GlanceCard
                icon="trending-up"
                color="#5C7AEA"
                label="Portfolio"
                value={money(o?.portfolio.totalCurrentValue ?? 0)}
                sub={`${money(o?.portfolio.totalGainLoss ?? 0, { sign: true })} all time`}
                subColor={(o?.portfolio.totalGainLoss ?? 0) >= 0 ? t.success : t.danger}
                onPress={() => router.push('/investments')}
              />
            </View>

            {/* financial health */}
            <View style={{ backgroundColor: t.premium, borderRadius: 18, padding: 18 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="sparkles" size={18} color={t.onPremium} />
                <Txt color={t.onPremium} style={{ fontFamily: Font.bold, fontSize: 15 }}>
                  Financial health
                </Txt>
                <View
                  style={{
                    marginLeft: 'auto',
                    backgroundColor: hexA('#34D399', 0.22),
                    paddingHorizontal: 10,
                    paddingVertical: 3,
                    borderRadius: 999,
                  }}
                >
                  <Txt color="#34D399" style={{ fontFamily: Font.bold, fontSize: 13 }}>
                    {savingsRate >= 30 ? 'Great' : savingsRate >= 10 ? 'Okay' : 'Watch'}
                  </Txt>
                </View>
              </View>
              <Txt color={t.onPremiumDim} style={{ marginTop: 12, lineHeight: 21 }}>
                You saved{' '}
                <Txt color={t.onPremium} style={{ fontFamily: Font.bold }}>
                  {money(o?.net ?? 0)}
                </Txt>{' '}
                this month — a {savingsRate}% savings rate. Keep it up.
              </Txt>
            </View>
          </>
        )}
    </CollapsibleScreen>
  );
}

function GlanceCard({
  icon,
  color,
  label,
  value,
  sub,
  subColor,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
  value: string;
  sub: string;
  subColor?: string;
  onPress?: () => void;
}) {
  const t = useTheme();
  return (
    <Card padding={16} onPress={onPress} style={{ flex: 1 }}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 9,
          backgroundColor: hexA(color, 0.15),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={17} color={color} />
      </View>
      <Txt variant="caption" tone="ink2" style={{ marginTop: 11 }}>
        {label}
      </Txt>
      <Txt variant="title3" style={{ marginTop: 1 }}>
        {value}
      </Txt>
      <Txt color={subColor ?? t.ink3} variant="micro" style={{ marginTop: 2, fontFamily: Font.semibold }}>
        {sub}
      </Txt>
    </Card>
  );
}
