import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import { errorMessage } from '@/api';
import type { BudgetPeriod } from '@/api';
import { AmountField, CategoryField, ChipSelect, LabeledInput } from '@/features/forms/Fields';
import { useCreateBudget } from '@/features/hooks';
import { useTheme } from '@/theme';
import { Button, CollapsibleScreen, Segmented, Txt } from '@/ui';

export default function NewBudget() {
  const t = useTheme();
  const router = useRouter();
  const create = useCreateBudget();

  const [scope, setScope] = useState<'overall' | 'category'>('overall');
  const [category, setCategory] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<BudgetPeriod>('monthly');
  const [error, setError] = useState<string | null>(null);

  const amt = parseInt(amount, 10) || 0;
  const valid = amt > 0 && (scope === 'overall' || !!category);

  const submit = () => {
    setError(null);
    create.mutate(
      {
        name: name.trim() || undefined,
        category: scope === 'category' ? category ?? undefined : undefined,
        amount: amt,
        period,
        alertThresholdPct: 80,
      },
      { onSuccess: () => router.back(), onError: (e) => setError(errorMessage(e)) },
    );
  };

  return (
    <CollapsibleScreen title="New budget" contentContainerStyle={{ padding: 16, gap: 16 }}>
        <AmountField value={amount} onChange={setAmount} label="Budget limit" />

        <View>
          <Txt variant="caption" tone="ink2" style={{ fontWeight: '600', marginBottom: 8, paddingHorizontal: 2 }}>
            Scope
          </Txt>
          <Segmented
            options={[
              { value: 'overall', label: 'Overall' },
              { value: 'category', label: 'Per category' },
            ]}
            value={scope}
            onChange={setScope}
          />
        </View>

        {scope === 'category' && <CategoryField type="expense" value={category} onChange={setCategory} />}

        <LabeledInput label="Name (optional)" value={name} onChangeText={setName} placeholder={scope === 'overall' ? 'Overall monthly' : 'e.g. Eating out'} autoCapitalize="sentences" />

        <ChipSelect
          label="Period"
          value={period}
          onChange={setPeriod}
          options={[
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' },
            { value: 'yearly', label: 'Yearly' },
          ]}
        />

        {error && (
          <Txt tone="danger" variant="caption">
            {error}
          </Txt>
        )}

        <View style={{ marginTop: 8 }}>
          <Button size="lg" icon="checkmark" disabled={!valid} loading={create.isPending} onPress={submit}>
            Create budget
          </Button>
        </View>
    </CollapsibleScreen>
  );
}
