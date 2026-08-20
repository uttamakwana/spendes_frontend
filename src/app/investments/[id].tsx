import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, TextInput, View } from 'react-native';

import { errorMessage } from '@/api';
import { formatDay } from '@/features/forms/Fields';
import {
  useContributeInvestment,
  useDeleteInvestment,
  useInvestment,
  useUpdateInvestmentValue,
} from '@/features/hooks';
import { money } from '@/lib/money';
import { hexA, useTheme } from '@/theme';
import { Font, tabularNums } from '@/theme/fonts';
import { Button, Card, IconButton, MoneyText, Screen, Sheet, Skeleton, Txt, TopBar } from '@/ui';

export default function InvestmentDetail() {
  const t = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: inv, isLoading } = useInvestment(id);
  const update = useUpdateInvestmentValue(id);
  const contribute = useContributeInvestment(id);
  const del = useDeleteInvestment();
  const [sheet, setSheet] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [recordSheet, setRecordSheet] = useState(false);
  const [recordAmount, setRecordAmount] = useState('');
  const [recordValue, setRecordValue] = useState('');
  const [recordError, setRecordError] = useState<string | null>(null);

  const up = (inv?.gainLoss ?? 0) >= 0;

  const openRecord = () => {
    setRecordAmount(inv?.sip ? String(Math.round(inv.sip.amount)) : '');
    setRecordValue('');
    setRecordError(null);
    setRecordSheet(true);
  };

  const submitRecord = () => {
    const amt = parseInt(recordAmount, 10) || 0;
    if (!amt) return;
    setRecordError(null);
    contribute.mutate(
      {
        amount: amt,
        currentValue: recordValue ? parseInt(recordValue, 10) : undefined,
        note: 'SIP installment',
      },
      {
        onSuccess: () => {
          setRecordSheet(false);
          setRecordAmount('');
          setRecordValue('');
        },
        onError: (e) => setRecordError(errorMessage(e)),
      },
    );
  };

  const confirmDelete = () => {
    Alert.alert('Delete this holding?', 'It will be removed from your portfolio. This can’t be undone.', [
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
      <TopBar
        title={inv?.name ?? 'Holding'}
        right={<IconButton name="create-outline" onPress={() => router.push(`/investments/edit?id=${id}`)} />}
      />
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
              <MoneyText value={inv.currentValue} size={34} weight="bold" animate style={{ marginTop: 2 }} />
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

            {inv.sip && (
              <Card padding={0} style={{ paddingHorizontal: 16 }}>
                <Row label="SIP" value={`${money(inv.sip.amount)} / ${freqUnit(inv.sip.frequency)}`} />
                {inv.sip.isActive && inv.sip.nextContributionDate ? (
                  <Row label="Next debit" value={formatDay(new Date(inv.sip.nextContributionDate))} />
                ) : (
                  <Row label="Status" value="Paused" />
                )}
                <Row
                  label="Recorded"
                  value={`${inv.sip.recordedInstallments} installment${inv.sip.recordedInstallments === 1 ? '' : 's'}`}
                />
              </Card>
            )}

            {inv.sip?.isActive && inv.sip.installmentsBehind > 0 && (
              <View
                style={{
                  flexDirection: 'row',
                  gap: 10,
                  alignItems: 'center',
                  backgroundColor: hexA(t.warning, 0.14),
                  padding: 14,
                  borderRadius: 14,
                }}
              >
                <Ionicons name="alert-circle" size={20} color={t.warning} />
                <Txt variant="caption" tone="ink2" style={{ flex: 1 }}>
                  {inv.sip.installmentsBehind} installment{inv.sip.installmentsBehind === 1 ? '' : 's'} due since
                  your last record. Tap “Record installment” to log {inv.sip.installmentsBehind === 1 ? 'it' : 'them'}.
                </Txt>
              </View>
            )}

            {inv.sip?.isActive && (
              <Button icon="add-circle-outline" onPress={openRecord}>
                Record installment
              </Button>
            )}
            <Button variant="soft" icon="refresh" onPress={() => setSheet(true)}>
              Refresh value
            </Button>
            <Button variant="danger" icon="trash-outline" loading={del.isPending} onPress={confirmDelete}>
              Delete holding
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

      <Sheet open={recordSheet} onClose={() => setRecordSheet(false)} title="Record SIP installment">
        <View style={{ paddingHorizontal: 20, paddingTop: 8, gap: 14 }}>
          <View>
            <Txt variant="micro" tone="ink3" style={{ marginBottom: 6 }}>
              Amount invested
            </Txt>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: t.fill, borderRadius: 14, paddingHorizontal: 16, height: 56 }}>
              <Txt color={t.ink3} style={{ fontSize: 22, marginRight: 6 }}>
                ₹
              </Txt>
              <TextInput
                value={recordAmount}
                onChangeText={(v) => setRecordAmount(v.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                autoFocus
                placeholder="0"
                placeholderTextColor={t.ink3}
                style={[{ flex: 1, fontFamily: Font.bold, fontSize: 24, color: t.ink }, tabularNums]}
              />
            </View>
          </View>
          <View>
            <Txt variant="micro" tone="ink3" style={{ marginBottom: 6 }}>
              New current value (optional)
            </Txt>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: t.fill, borderRadius: 14, paddingHorizontal: 16, height: 56 }}>
              <Txt color={t.ink3} style={{ fontSize: 22, marginRight: 6 }}>
                ₹
              </Txt>
              <TextInput
                value={recordValue}
                onChangeText={(v) => setRecordValue(v.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                placeholder="Leave blank to keep"
                placeholderTextColor={t.ink3}
                style={[{ flex: 1, fontFamily: Font.semibold, fontSize: 20, color: t.ink }, tabularNums]}
              />
            </View>
          </View>
          {recordError && (
            <Txt tone="danger" variant="caption">
              {recordError}
            </Txt>
          )}
          <Button size="lg" loading={contribute.isPending} disabled={!recordAmount} onPress={submitRecord}>
            Record installment
          </Button>
        </View>
      </Sheet>
    </Screen>
  );
}

function freqUnit(f: string): string {
  return f === 'weekly' ? 'week' : f === 'quarterly' ? 'quarter' : f === 'yearly' ? 'year' : 'month';
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
