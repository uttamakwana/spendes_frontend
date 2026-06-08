import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { format } from 'date-fns';
import React, { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';

import { errorMessage } from '@/api';
import { useContributeGoal, useGoal } from '@/features/hooks';
import { money } from '@/lib/money';
import { hexA, useTheme } from '@/theme';
import { Font, tabularNums } from '@/theme/fonts';
import { Button, Card, MoneyText, ProgressRing, Screen, SectionHeader, Sheet, Skeleton, Txt, TopBar } from '@/ui';

export default function GoalDetail() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: g, isLoading } = useGoal(id);
  const contribute = useContributeGoal(id);
  const [sheet, setSheet] = useState(false);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const color = g?.color || t.accent;

  const submit = () => {
    const num = parseInt(amount, 10) || 0;
    if (!num) return;
    setError(null);
    contribute.mutate(
      { amount: num },
      {
        onSuccess: () => {
          setSheet(false);
          setAmount('');
        },
        onError: (e) => setError(errorMessage(e)),
      },
    );
  };

  return (
    <Screen>
      <TopBar title={g?.name ?? 'Goal'} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 14 }}>
        {isLoading || !g ? (
          <Skeleton height={240} radius={16} />
        ) : (
          <>
            <Card padding={22} style={{ alignItems: 'center' }}>
              <ProgressRing pct={g.progressPct} size={148} stroke={13} color={color}>
                <Ionicons name={(g.icon as keyof typeof Ionicons.glyphMap) || 'flag'} size={22} color={color} />
                <Txt style={{ fontFamily: Font.bold, fontSize: 26, marginTop: 4 }}>{Math.round(g.progressPct)}%</Txt>
              </ProgressRing>
              <MoneyText value={g.currentAmount} size={26} weight="bold" style={{ marginTop: 16 }} />
              <Txt tone="ink2" variant="caption" style={{ marginTop: 2 }}>
                saved of <Txt color={t.ink} style={{ fontFamily: Font.semibold }}>{money(g.targetAmount)}</Txt>
              </Txt>
              {g.requiredMonthlySaving != null && g.targetDate && (
                <View style={{ marginTop: 16, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: hexA(color, 0.1) }}>
                  <Txt tone="ink2" variant="caption" center>
                    Save <Txt color={color} style={{ fontFamily: Font.bold }}>{money(g.requiredMonthlySaving)}/mo</Txt> to finish by{' '}
                    {format(new Date(g.targetDate), 'MMM yyyy')}
                  </Txt>
                </View>
              )}
            </Card>

            <Button icon="add" onPress={() => setSheet(true)}>
              Add contribution
            </Button>

            <View>
              <SectionHeader title="Contributions" />
              <Card padding={0} style={{ paddingHorizontal: 14 }}>
                {g.contributions.length === 0 ? (
                  <Txt tone="ink3" variant="caption" style={{ padding: 16, textAlign: 'center' }}>
                    No contributions yet
                  </Txt>
                ) : (
                  g.contributions.map((c, i, arr) => (
                    <View
                      key={c.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        paddingVertical: 12,
                        borderBottomWidth: i === arr.length - 1 ? 0 : 1,
                        borderBottomColor: t.hair,
                      }}
                    >
                      <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: hexA(color, 0.13), alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="add" size={18} color={color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Txt variant="callout" style={{ fontFamily: Font.semibold }}>
                          {c.note || 'Contribution'}
                        </Txt>
                        <Txt tone="ink3" variant="caption">
                          {format(new Date(c.contributedAt), 'MMM d, yyyy')}
                        </Txt>
                      </View>
                      <MoneyText value={c.amount} size={14.5} weight="bold" sign color={t.success} />
                    </View>
                  ))
                )}
              </Card>
            </View>
          </>
        )}
      </ScrollView>

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Add contribution">
        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: t.fill, borderRadius: 14, paddingHorizontal: 16, height: 60 }}>
            <Txt color={t.ink3} style={{ fontSize: 24, marginRight: 6 }}>
              ₹
            </Txt>
            <TextInput
              value={amount}
              onChangeText={(v) => setAmount(v.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              autoFocus
              placeholder="0"
              placeholderTextColor={t.ink3}
              style={[{ flex: 1, fontFamily: Font.bold, fontSize: 26, color: t.ink }, tabularNums]}
            />
          </View>
          {error && (
            <Txt tone="danger" variant="caption" style={{ marginTop: 10 }}>
              {error}
            </Txt>
          )}
          <View style={{ marginTop: 16 }}>
            <Button size="lg" loading={contribute.isPending} disabled={!amount} onPress={submit}>
              Contribute {amount ? money(parseInt(amount, 10) || 0) : ''}
            </Button>
          </View>
        </View>
      </Sheet>
    </Screen>
  );
}
