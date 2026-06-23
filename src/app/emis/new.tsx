import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import { errorMessage } from '@/api';
import { AmountField, ChipSelect, DateField, LabeledInput } from '@/features/forms/Fields';
import { useCreateEmi } from '@/features/hooks';
import { Button, CollapsibleScreen, Txt } from '@/ui';

export default function NewEmi() {
  const router = useRouter();
  const create = useCreateEmi();

  const [name, setName] = useState('');
  const [type, setType] = useState('loan');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [tenure, setTenure] = useState('');
  // The next time the EMI is debited — its day-of-month becomes the recurring debit day.
  const [debitDate, setDebitDate] = useState(new Date());
  const [alreadyPaid, setAlreadyPaid] = useState('');
  const [error, setError] = useState<string | null>(null);

  const amt = parseInt(amount, 10) || 0;
  const tenureNum = parseInt(tenure, 10) || 0;
  const valid = !!name.trim() && amt > 0;

  const submit = () => {
    setError(null);
    create.mutate(
      {
        name: name.trim(),
        type,
        amount: amt,
        frequency,
        startDate: debitDate.toISOString(),
        tenureCount: tenure ? parseInt(tenure, 10) : undefined,
        installmentsPaid:
          tenureNum > 0 && alreadyPaid ? Math.min(parseInt(alreadyPaid, 10), tenureNum - 1) : undefined,
      },
      { onSuccess: () => router.back(), onError: (e) => setError(errorMessage(e)) },
    );
  };

  return (
    <CollapsibleScreen title="New EMI / recurring" contentContainerStyle={{ padding: 16, gap: 16 }}>
        <AmountField value={amount} onChange={setAmount} label="Payment amount" />
        <LabeledInput label="Name" value={name} onChangeText={setName} placeholder="e.g. Home loan, Netflix" autoCapitalize="sentences" />
        <ChipSelect
          label="Type"
          value={type}
          onChange={setType}
          options={[
            { value: 'loan', label: 'Loan' },
            { value: 'subscription', label: 'Subscription' },
            { value: 'rent', label: 'Rent' },
            { value: 'insurance', label: 'Insurance' },
            { value: 'other', label: 'Other' },
          ]}
        />
        <ChipSelect
          label="Frequency"
          value={frequency}
          onChange={setFrequency}
          options={[
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' },
            { value: 'quarterly', label: 'Quarterly' },
            { value: 'yearly', label: 'Yearly' },
          ]}
        />
        <DateField
          label="Next debit date"
          value={debitDate}
          onChange={setDebitDate}
          mode="date"
          maximumDate={null}
        />
        <LabeledInput
          label="Number of installments (optional)"
          value={tenure}
          onChangeText={(v) => setTenure(v.replace(/[^0-9]/g, ''))}
          placeholder="Leave empty for ongoing subscriptions"
          keyboardType="number-pad"
        />
        {tenureNum > 0 && (
          <LabeledInput
            label="Installments already paid"
            value={alreadyPaid}
            onChangeText={(v) => setAlreadyPaid(v.replace(/[^0-9]/g, ''))}
            placeholder="0"
            keyboardType="number-pad"
            hint={`Of ${tenureNum}. For an existing loan — we’ll set the schedule so it shows the rest.`}
          />
        )}

        {error && (
          <Txt tone="danger" variant="caption">
            {error}
          </Txt>
        )}

        <View style={{ marginTop: 8 }}>
          <Button size="lg" icon="checkmark" disabled={!valid} loading={create.isPending} onPress={submit}>
            Add commitment
          </Button>
        </View>
    </CollapsibleScreen>
  );
}
