import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

import type { BudgetPeriod } from '@/api';
import { errorMessage } from '@/api';
import { AmountField, ChipSelect, LabeledInput } from '@/features/forms/Fields';
import { useBudget, useUpdateBudget } from '@/features/hooks';
import { Button, CollapsibleScreen, Skeleton, Txt } from '@/ui';

export default function EditBudget() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: b, isLoading } = useBudget(id);
  const update = useUpdateBudget(id);

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<BudgetPeriod>('monthly');
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (b && !hydrated) {
      setName(b.name ?? '');
      setAmount(String(Math.round(b.amount)));
      setPeriod(b.period);
      setHydrated(true);
    }
  }, [b, hydrated]);

  const amt = parseInt(amount, 10) || 0;
  const valid = amt > 0;

  const submit = () => {
    setError(null);
    update.mutate(
      { name: name.trim() || undefined, amount: amt, period },
      { onSuccess: () => router.back(), onError: (e) => setError(errorMessage(e)) },
    );
  };

  return (
    <CollapsibleScreen title="Edit budget" contentContainerStyle={{ padding: 16, gap: 16 }}>
      {isLoading || !hydrated ? (
        <View style={{ gap: 14 }}>
          <Skeleton height={70} radius={14} />
          <Skeleton height={50} radius={12} />
        </View>
      ) : (
        <>
          <AmountField value={amount} onChange={setAmount} label="Budget limit" />
          <LabeledInput
            label="Name (optional)"
            value={name}
            onChangeText={setName}
            placeholder={b?.category ? `e.g. ${b.category}` : 'Overall monthly'}
            autoCapitalize="sentences"
          />
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
          {b?.category ? (
            <Txt tone="ink3" variant="caption" style={{ paddingHorizontal: 2 }}>
              Category: <Txt style={{ textTransform: 'capitalize' }}>{b.category}</Txt>. Create a new
              budget to track a different category.
            </Txt>
          ) : null}

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
