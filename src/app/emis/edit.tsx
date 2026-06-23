import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

import { errorMessage } from '@/api';
import { AmountField, ChipSelect, DateField, LabeledInput } from '@/features/forms/Fields';
import { useEmi, useUpdateEmi } from '@/features/hooks';
import { Button, CollapsibleScreen, Skeleton, Txt } from '@/ui';

export default function EditEmi() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: emi, isLoading } = useEmi(id);
  const update = useUpdateEmi(id);

  const [name, setName] = useState('');
  const [type, setType] = useState('loan');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [tenure, setTenure] = useState('');
  const [debitDate, setDebitDate] = useState(new Date());
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (emi && !hydrated) {
      setName(emi.name);
      setType(emi.type);
      setAmount(String(Math.round(emi.amount)));
      setFrequency(emi.frequency);
      setTenure(emi.tenureCount ? String(emi.tenureCount) : '');
      setDebitDate(new Date(emi.startDate));
      setHydrated(true);
    }
  }, [emi, hydrated]);

  const amt = parseInt(amount, 10) || 0;
  const valid = !!name.trim() && amt > 0;

  const submit = () => {
    setError(null);
    update.mutate(
      {
        name: name.trim(),
        type,
        amount: amt,
        frequency,
        startDate: debitDate.toISOString(),
        tenureCount: tenure ? parseInt(tenure, 10) : undefined,
      },
      { onSuccess: () => router.back(), onError: (e) => setError(errorMessage(e)) },
    );
  };

  return (
    <CollapsibleScreen title="Edit EMI" contentContainerStyle={{ padding: 16, gap: 16 }}>
      {isLoading || !hydrated ? (
        <View style={{ gap: 14 }}>
          <Skeleton height={70} radius={14} />
          <Skeleton height={50} radius={12} />
          <Skeleton height={50} radius={12} />
        </View>
      ) : (
        <>
          <AmountField value={amount} onChange={setAmount} label="Payment amount" />
          <LabeledInput label="Name" value={name} onChangeText={setName} autoCapitalize="sentences" />
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
          <DateField label="Debit date" value={debitDate} onChange={setDebitDate} mode="date" maximumDate={null} />
          <LabeledInput
            label="Number of installments (optional)"
            value={tenure}
            onChangeText={(v) => setTenure(v.replace(/[^0-9]/g, ''))}
            placeholder="Leave empty for ongoing subscriptions"
            keyboardType="number-pad"
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
