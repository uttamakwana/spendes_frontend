import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';

import { errorMessage } from '@/api';
import { useInvestment, useUpdateInvestmentValue } from '@/features/hooks';
import { money } from '@/lib/money';
import { hexA, useTheme } from '@/theme';
import { Font, tabularNums } from '@/theme/fonts';
import { Button, Card, MoneyText, Screen, Sheet, Skeleton, Txt, TopBar } from '@/ui';

export default function InvestmentDetail() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: inv, isLoading } = useInvestment(id);
  const update = useUpdateInvestmentValue(id);
  const [sheet, setSheet] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const up = (inv?.gainLoss ?? 0) >= 0;

  const submit = () => {
    const num = parseInt(value, 10) || 0;
    if (!num) return;
    setError(null);
    update.mutate(num, {
      onSuccess: () => {
        setSheet(false);
        setValue('');
      },
      onError: (e) => setError(errorMessage(e)),
    });
  };

  return (
    <Screen>
      <TopBar title={inv?.name ?? 'Holding'} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 14 }}>
        {isLoading || !inv ? (
          <Skeleton height={200} radius={16} />
        ) : (
          <>
            <Card padding={22} style={{ alignItems: 'center' }}>
              <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: hexA('#5C7AEA', 0.15), alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Ionicons name="trending-up" size={28} color="#5C7AEA" />
              </View>
              <Txt variant="caption" tone="ink2">
                Current value
              </Txt>
              <MoneyText value={inv.currentValue} size={34} weight="bold" style={{ marginTop: 2 }} />
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  marginTop: 8,
                  backgroundColor: up ? t.successBg : t.dangerBg,
                  paddingHorizontal: 11,
                  paddingVertical: 4,
                  borderRadius: 999,
                }}
              >
                <Ionicons name={up ? 'trending-up' : 'trending-down'} size={15} color={up ? t.success : t.danger} />
                <Txt color={up ? t.success : t.danger} style={{ fontFamily: Font.semibold, fontSize: 14 }}>
                  {money(inv.gainLoss, { sign: true })} ({up ? '+' : ''}
                  {inv.gainLossPct.toFixed(1)}%)
                </Txt>
              </View>
            </Card>

            <Card padding={0} style={{ paddingHorizontal: 16 }}>
              <Row label="Asset class" value={inv.type.replace('_', ' ')} cap />
              <Row label="Invested" value={money(inv.investedAmount)} />
              <Row label="Current value" value={money(inv.currentValue)} />
              {inv.platform && <Row label="Platform" value={inv.platform} />}
            </Card>

            <Button variant="soft" icon="refresh" onPress={() => setSheet(true)}>
              Refresh value
            </Button>
          </>
        )}
      </ScrollView>

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Update current value">
        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: t.fill, borderRadius: 14, paddingHorizontal: 16, height: 60 }}>
            <Txt color={t.ink3} style={{ fontSize: 24, marginRight: 6 }}>
              ₹
            </Txt>
            <TextInput
              value={value}
              onChangeText={(v) => setValue(v.replace(/[^0-9]/g, ''))}
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
            <Button size="lg" loading={update.isPending} disabled={!value} onPress={submit}>
              Update value
            </Button>
          </View>
        </View>
      </Sheet>
    </Screen>
  );
}

function Row({ label, value, cap }: { label: string; value: string; cap?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: t.hair }}>
      <Txt tone="ink2">{label}</Txt>
      <Txt style={{ fontFamily: Font.semibold, textTransform: cap ? 'capitalize' : 'none' }}>{value}</Txt>
    </View>
  );
}
