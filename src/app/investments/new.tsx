import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import { errorMessage } from '@/api';
import { AmountField, ChipSelect, LabeledInput } from '@/features/forms/Fields';
import { useCreateInvestment } from '@/features/hooks';
import { Button, CollapsibleScreen, Txt } from '@/ui';

export default function NewInvestment() {
  const router = useRouter();
  const create = useCreateInvestment();

  const [name, setName] = useState('');
  const [type, setType] = useState('mutual_fund');
  const [invested, setInvested] = useState('');
  const [current, setCurrent] = useState('');
  const [platform, setPlatform] = useState('');
  const [error, setError] = useState<string | null>(null);

  const investedAmount = parseInt(invested, 10) || 0;
  const valid = !!name.trim() && investedAmount > 0;

  const submit = () => {
    setError(null);
    create.mutate(
      {
        name: name.trim(),
        type,
        investedAmount,
        currentValue: current ? parseInt(current, 10) : undefined,
        platform: platform.trim() || undefined,
      },
      { onSuccess: () => router.back(), onError: (e) => setError(errorMessage(e)) },
    );
  };

  return (
    <CollapsibleScreen title="Add holding" contentContainerStyle={{ padding: 16, gap: 16 }}>
        <AmountField value={invested} onChange={setInvested} label="Invested amount" />
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
