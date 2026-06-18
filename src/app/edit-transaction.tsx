import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';

import type { PaymentMethod } from '@/api';
import { errorMessage } from '@/api';
import { AmountField, CategoryField, ChipSelect, DateField, LabeledInput } from '@/features/forms/Fields';
import { useExpense, useIncome, useUpdateExpense, useUpdateIncome } from '@/features/hooks';
import { Button, Screen, Skeleton, Txt, TopBar } from '@/ui';

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'upi', label: 'UPI' },
  { value: 'card', label: 'Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank' },
  { value: 'wallet', label: 'Wallet' },
];

export default function EditTransaction() {
  const router = useRouter();
  const { id, type } = useLocalSearchParams<{ id: string; type?: string }>();
  const isIncome = type === 'income';

  const expense = useExpense(isIncome ? '' : id);
  const income = useIncome(isIncome ? id : '');
  const updateExpense = useUpdateExpense(id);
  const updateIncome = useUpdateIncome(id);

  const record = isIncome ? income.data : expense.data;
  const loading = isIncome ? income.isLoading : expense.isLoading;

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>('upi');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date());
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (record && !hydrated) {
      setAmount(String(Math.round(record.amount)));
      setCategory(record.category);
      setNote(record.notes ?? record.description ?? '');
      setMethod((isIncome ? (record as { receivedVia: PaymentMethod }).receivedVia : (record as { paymentMethod: PaymentMethod }).paymentMethod) ?? 'upi');
      const when = isIncome ? (record as { receivedAt?: string }).receivedAt : (record as { spentAt?: string }).spentAt;
      if (when) setDate(new Date(when));
      setHydrated(true);
    }
  }, [record, hydrated, isIncome]);

  const amt = parseInt(amount, 10) || 0;
  const valid = amt > 0 && !!category;
  const saving = updateExpense.isPending || updateIncome.isPending;

  const submit = () => {
    if (!valid) return;
    setError(null);
    const opts = { onSuccess: () => router.back(), onError: (e: unknown) => setError(errorMessage(e)) };
    if (isIncome) {
      updateIncome.mutate({ amount: amt, category: category!, receivedVia: method, notes: note || undefined, source: note || undefined, receivedAt: date.toISOString() }, opts);
    } else {
      updateExpense.mutate({ amount: amt, category: category!, paymentMethod: method, notes: note || undefined, description: note || undefined, spentAt: date.toISOString() }, opts);
    }
  };

  return (
    <Screen>
      <TopBar title={isIncome ? 'Edit income' : 'Edit expense'} />
      {loading || !hydrated ? (
        <View style={{ padding: 16, gap: 14 }}>
          <Skeleton height={70} radius={14} />
          <Skeleton height={50} radius={12} />
          <Skeleton height={50} radius={12} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
          <AmountField value={amount} onChange={setAmount} />
          <CategoryField type={isIncome ? 'income' : 'expense'} value={category} onChange={setCategory} />
          <ChipSelect label={isIncome ? 'Received via' : 'Payment method'} value={method} onChange={setMethod} options={METHODS} />
          <DateField label={isIncome ? 'Date received' : 'Date spent'} value={date} onChange={setDate} />
          <LabeledInput label={isIncome ? 'Source / note' : 'Note'} value={note} onChangeText={setNote} placeholder="Add a note…" autoCapitalize="sentences" />

          {error && (
            <Txt tone="danger" variant="caption">
              {error}
            </Txt>
          )}

          <View style={{ marginTop: 8 }}>
            <Button size="lg" icon="checkmark" disabled={!valid} loading={saving} onPress={submit}>
              Save changes
            </Button>
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}
