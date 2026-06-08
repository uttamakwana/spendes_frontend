import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import React from 'react';
import { View } from 'react-native';

import { useGoals } from '@/features/hooks';
import { money } from '@/lib/money';
import { useTheme } from '@/theme';
import { Font } from '@/theme/fonts';
import {
  Card,
  CollapsibleScreen,
  EmptyState,
  IconButton,
  MoneyText,
  ProgressBar,
  ProgressRing,
  Skeleton,
  Txt,
} from '@/ui';

export default function Goals() {
  const t = useTheme();
  const router = useRouter();
  const { data, isLoading } = useGoals();
  const items = data?.items ?? [];
  const totalSaved = items.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = items.reduce((s, g) => s + g.targetAmount, 0);

  return (
    <CollapsibleScreen
      title="Goals"
      right={<IconButton name="add" bg={t.accent} color="#fff" onPress={() => router.push('/goals/new')} />}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 12 }}
    >
        {isLoading ? (
          [0, 1, 2].map((i) => <Skeleton key={i} height={88} radius={16} />)
        ) : items.length === 0 ? (
          <EmptyState icon="rocket-outline" title="No goals yet" subtitle="Set a savings target and Spendes tells you how much to save each month." actionLabel="Create goal" onAction={() => router.push('/goals/new')} />
        ) : (
          <>
            <Card padding={18}>
              <Txt variant="caption" tone="ink2">
                Saved across {items.length} {items.length === 1 ? 'goal' : 'goals'}
              </Txt>
              <MoneyText value={totalSaved} size={30} weight="bold" style={{ marginTop: 3 }} />
              <View style={{ marginTop: 12 }}>
                <ProgressBar pct={totalTarget ? (totalSaved / totalTarget) * 100 : 0} />
              </View>
              <Txt tone="ink3" variant="caption" style={{ marginTop: 8 }}>
                of <Txt color={t.ink} style={{ fontFamily: Font.semibold }}>{money(totalTarget)}</Txt> total target
              </Txt>
            </Card>

            {items.map((g) => {
              const color = g.color || t.accent;
              return (
                <Card key={g.id} onPress={() => router.push(`/goals/${g.id}`)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                    <ProgressRing pct={g.progressPct} size={62} stroke={6.5} color={color}>
                      <Txt style={{ fontFamily: Font.bold, fontSize: 14 }}>{Math.round(g.progressPct)}%</Txt>
                    </ProgressRing>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                        <Ionicons name={(g.icon as keyof typeof Ionicons.glyphMap) || 'flag'} size={16} color={color} />
                        <Txt variant="headline" numberOfLines={1}>
                          {g.name}
                        </Txt>
                      </View>
                      <Txt tone="ink2" variant="caption" style={{ marginTop: 3 }}>
                        <Txt color={t.ink} style={{ fontFamily: Font.semibold }}>{money(g.currentAmount)}</Txt> of {money(g.targetAmount)}
                      </Txt>
                      {g.requiredMonthlySaving != null && (
                        <Txt tone="ink3" variant="micro" style={{ marginTop: 3 }}>
                          Save <Txt color={color} style={{ fontFamily: Font.semibold }}>{money(g.requiredMonthlySaving)}</Txt>/mo
                          {g.targetDate ? ` · by ${format(new Date(g.targetDate), 'MMM yyyy')}` : ''}
                        </Txt>
                      )}
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
