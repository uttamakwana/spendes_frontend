import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

import { errorMessage } from '@/api';
import { AmountField, ChipSelect, DateField, LabeledInput } from '@/features/forms/Fields';
import { useInvestment, useUpdateInvestment } from '@/features/hooks';
import { Button, CollapsibleScreen, Skeleton, Txt } from '@/ui';

export default function EditInvestment() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: inv, isLoading } = useInvestment(id);
  const update = useUpdateInvestment(id);

  const [name, setName] = useState('');
  const [type, setType] = useState('mutual_fund');
  const [plan, setPlan] = useState('lumpsum'); // 'lumpsum' | 'sip'
  const [invested, setInvested] = useState('');
  const [current, setCurrent] = useState('');
  const [platform, setPlatform] = useState('');
  const [sipAmount, setSipAmount] = useState('');
  const [sipFreq, setSipFreq] = useState('monthly');
  const [sipDate, setSipDate] = useState(new Date());
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (inv && !hydrated) {
      setName(inv.name);
      setType(inv.type);
      setInvested(String(Math.round(inv.investedAmount)));
      setCurrent(String(Math.round(inv.currentValue)));
      setPlatform(inv.platform ?? '');
      if (inv.sip) {
        setPlan(inv.sip.isActive ? 'sip' : 'lumpsum');
        setSipAmount(String(Math.round(inv.sip.amount)));
        setSipFreq(inv.sip.frequency);
        setSipDate(new Date(inv.sip.nextContributionDate ?? inv.sip.startDate));
      }
      setHydrated(true);
    }
  }, [inv, hydrated]);

  const isSip = plan === 'sip';
  const investedAmount = parseInt(invested, 10) || 0;
  const sipInstallment = parseInt(sipAmount, 10) || 0;
  const valid = !!name.trim() && (isSip ? sipInstallment > 0 : investedAmount > 0);

  const submit = () => {
    setError(null);
    // Turning SIP on sends an active plan. Turning it off pauses the existing plan
    // (kept for history) rather than deleting it. No SIP, never had one → omit.
    const sip = isSip
      ? { amount: sipInstallment, frequency: sipFreq, startDate: sipDate.toISOString(), isActive: true }
      : inv?.sip
        ? {
            amount: Math.round(inv.sip.amount),
            frequency: inv.sip.frequency,
            startDate: inv.sip.startDate,
            isActive: false,
          }
        : undefined;
    update.mutate(
      {
        name: name.trim(),
        type,
        investedAmount,
        currentValue: current ? parseInt(current, 10) : undefined,
        platform: platform.trim() || undefined,
        sip,
      },
      { onSuccess: () => router.back(), onError: (e) => setError(errorMessage(e)) },
    );
  };

  return (
    <CollapsibleScreen title="Edit holding" contentContainerStyle={{ padding: 16, gap: 16 }}>
      {isLoading || !hydrated ? (
        <View style={{ gap: 14 }}>
          <Skeleton height={70} radius={14} />
          <Skeleton height={50} radius={12} />
          <Skeleton height={50} radius={12} />
        </View>
      ) : (
        <>
          <AmountField value={invested} onChange={setInvested} label={isSip ? 'Amount invested so far' : 'Invested amount'} />
          <LabeledInput label="Name" value={name} onChangeText={setName} autoCapitalize="words" />
          <ChipSelect
            label="Asset class"
            value={type}
            onChange={setType}
            options={[
              { value: 'mutual_fund', label: 'Mutual fund' },
              { value: 'stock', label: 'Stocks' },
              { value: 'gold', label: 'Gold' },
              { value: 'crypto', label: 'Crypto' },
              { value: 'fd', label: 'FD' },
              { value: 'bond', label: 'Bonds' },
              { value: 'real_estate', label: 'Real estate' },
              { value: 'other', label: 'Other' },
            ]}
          />
          <ChipSelect
            label="How you invest"
            value={plan}
            onChange={setPlan}
            options={[
              { value: 'lumpsum', label: 'One-time' },
              { value: 'sip', label: 'SIP (recurring)' },
            ]}
          />
          {isSip && (
            <>
              <LabeledInput
                label="SIP amount (each installment)"
                value={sipAmount}
                onChangeText={(v) => setSipAmount(v.replace(/[^0-9]/g, ''))}
                placeholder="e.g. 5000"
                keyboardType="number-pad"
                prefix="₹"
              />
              <ChipSelect
                label="Frequency"
                value={sipFreq}
                onChange={setSipFreq}
                options={[
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'monthly', label: 'Monthly' },
                  { value: 'quarterly', label: 'Quarterly' },
                  { value: 'yearly', label: 'Yearly' },
                ]}
              />
              <DateField label="Next debit date" value={sipDate} onChange={setSipDate} mode="date" maximumDate={null} />
            </>
          )}
          {!isSip && inv?.sip ? (
            <Txt tone="ink3" variant="caption" style={{ paddingHorizontal: 2, marginTop: -6 }}>
              Switching to one-time pauses this SIP — no more debit reminders. Your recorded
              contributions stay.
            </Txt>
          ) : null}
          <LabeledInput
            label="Current value"
            value={current}
            onChangeText={(v) => setCurrent(v.replace(/[^0-9]/g, ''))}
            placeholder="Defaults to invested amount"
            keyboardType="number-pad"
            prefix="₹"
          />
          <LabeledInput
            label="Platform (optional)"
            value={platform}
            onChangeText={setPlatform}
            placeholder="e.g. Groww, Zerodha"
            autoCapitalize="words"
          />

          {error && (
            <Txt tone="danger" variant="caption">
              {error}
            </Txt>
          )}

          <View style={{ marginTop: 8 }}>
            <Button size="lg" icon="checkmark" disabled={!valid} loading={update.isPending} onPress={submit}>
              Save changes
            </Button>
          </View>
        </>
      )}
    </CollapsibleScreen>
  );
}
