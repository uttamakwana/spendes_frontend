import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import { errorMessage } from '@/api';
import { AmountField, ChipSelect, LabeledInput } from '@/features/forms/Fields';
import { useCreateGoal } from '@/features/hooks';
import { monthsFromNowISO } from '@/lib/date';
import { Button, CollapsibleScreen, Txt } from '@/ui';

type Deadline = 'none' | '6' | '12' | '24';

export default function NewGoal() {
  const router = useRouter();
  const create = useCreateGoal();

  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('');
  const [deadline, setDeadline] = useState<Deadline>('12');
  const [error, setError] = useState<string | null>(null);

  const targetAmount = parseInt(target, 10) || 0;
  const valid = !!name.trim() && targetAmount > 0;

  const submit = () => {
    setError(null);
    create.mutate(
      {
        name: name.trim(),
        targetAmount,
        currentAmount: current ? parseInt(current, 10) : undefined,
        targetDate: deadline === 'none' ? undefined : monthsFromNowISO(parseInt(deadline, 10)),
      },
      { onSuccess: () => router.back(), onError: (e) => setError(errorMessage(e)) },
    );
  };

  return (
    <CollapsibleScreen title="New goal" contentContainerStyle={{ padding: 16, gap: 16 }}>
        <AmountField value={target} onChange={setTarget} label="Target amount" />
        <LabeledInput label="Goal name" value={name} onChangeText={setName} placeholder="e.g. Europe trip, Emergency fund" autoCapitalize="sentences" />
        <LabeledInput label="Already saved (optional)" value={current} onChangeText={(v) => setCurrent(v.replace(/[^0-9]/g, ''))} placeholder="0" keyboardType="number-pad" prefix="₹" />
        <ChipSelect
          label="Target date"
          value={deadline}
          onChange={setDeadline}
          options={[
            { value: '6', label: '6 months' },
            { value: '12', label: '1 year' },
            { value: '24', label: '2 years' },
            { value: 'none', label: 'No date' },
          ]}
        />

        {error && (
          <Txt tone="danger" variant="caption">
            {error}
          </Txt>
        )}

        <View style={{ marginTop: 8 }}>
          <Button size="lg" icon="checkmark" disabled={!valid} loading={create.isPending} onPress={submit}>
            Create goal
          </Button>
        </View>
    </CollapsibleScreen>
  );
}
