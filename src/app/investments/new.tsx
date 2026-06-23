import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import { errorMessage } from '@/api';
import { AmountField, ChipSelect, DateField, LabeledInput } from '@/features/forms/Fields';
import { useCreateInvestment } from '@/features/hooks';
import { Button, CollapsibleScreen, Txt } from '@/ui';

export default function NewInvestment() {
  const router = useRouter();
  const create = useCreateInvestment();

  const [name, setName] = useState('');
  const [type, setType] = useState('mutual_fund');
  const [plan, setPlan] = useState('lumpsum'); // 'lumpsum' | 'sip'
  const [invested, setInvested] = useState('');
  const [current, setCurrent] = useState('');
  const [platform, setPlatform] = useState('');
  // SIP — per-installment amount, cadence, and the next date it debits.
  const [sipAmount, setSipAmount] = useState('');
  const [sipFreq, setSipFreq] = useState('monthly');
  const [sipDate, setSipDate] = useState(new Date());
  const [error, setError] = useState<string | null>(null);

  const isSip = plan === 'sip';
  const investedAmount = parseInt(invested, 10) || 0;
  const sipInstallment = parseInt(sipAmount, 10) || 0;
  const valid = !!name.trim() && (isSip ? sipInstallment > 0 : investedAmount > 0);

  const submit = () => {
    setError(null);
    create.mutate(
      {
        name: name.trim(),
        type,
        investedAmount,
        currentValue: current ? parseInt(current, 10) : undefined,
        platform: platform.trim() || undefined,
        sip: isSip
          ? { amount: sipInstallment, frequency: sipFreq, startDate: sipDate.toISOString(), isActive: true }
          : undefined,
      },
      { onSuccess: () => router.back(), onError: (e) => setError(errorMessage(e)) },
    );
  };

  return (
    <CollapsibleScreen title="Add holding" contentContainerStyle={{ padding: 16, gap: 16 }}>
        <AmountField value={invested} onChange={setInvested} label={isSip ? 'Amount invested so far' : 'Invested amount'} />
        <LabeledInput label="Name" value={name} onChangeText={setName} placeholder="e.g. Nifty 50 Index, HDFC Bank" autoCapitalize="words" />
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
            <DateField
              label="Next debit date"
              value={sipDate}
              onChange={setSipDate}
              mode="date"
              maximumDate={null}
            />
            <Txt tone="ink3" variant="caption" style={{ paddingHorizontal: 2, marginTop: -6 }}>
              We’ll remind you on each debit date so you can record the installment. “Invested so far” is
              what you’ve already put in (leave 0 for a brand-new SIP).
            </Txt>
          </>
        )}
        <LabeledInput label="Current value (optional)" value={current} onChangeText={(v) => setCurrent(v.replace(/[^0-9]/g, ''))} placeholder="Defaults to invested amount" keyboardType="number-pad" prefix="₹" />
        <LabeledInput label="Platform (optional)" value={platform} onChangeText={setPlatform} placeholder="e.g. Groww, Zerodha" autoCapitalize="words" />

        {error && (
          <Txt tone="danger" variant="caption">
            {error}
          </Txt>
        )}

        <View style={{ marginTop: 8 }}>
          <Button size="lg" icon="checkmark" disabled={!valid} loading={create.isPending} onPress={submit}>
            Add holding
          </Button>
        </View>
    </CollapsibleScreen>
  );
}
