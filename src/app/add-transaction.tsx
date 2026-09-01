import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Category, PaymentMethod } from '@/api';
import { errorMessage } from '@/api';
import { formatWhen, useWhenPicker } from '@/features/forms/Fields';
import { useCategories, useCreateExpense, useCreateIncome } from '@/features/hooks';
import { Keypad } from '@/features/auth/Keypad';
import { categoryStyle } from '@/lib/categories';
import { currencySymbol, moneyAmount } from '@/lib/money';
import { useAuth } from '@/auth/AuthProvider';
import { hexA, useTheme } from '@/theme';
import { Font, tabularNums } from '@/theme/fonts';
import { Button, CategoryIcon, IconButton, Segmented, Sheet, Txt } from '@/ui';

interface Method {
  id: PaymentMethod;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** Countries this method exists in; omitted means everywhere. */
  only?: string[];
}

const METHODS: Method[] = [
  { id: 'upi', label: 'UPI', icon: 'phone-portrait', only: ['IN'] },
  { id: 'card', label: 'Card', icon: 'card' },
  { id: 'cash', label: 'Cash', icon: 'cash' },
  { id: 'bank_transfer', label: 'Bank', icon: 'business' },
  { id: 'wallet', label: 'Wallet', icon: 'wallet' },
];

/** The payment methods worth offering in a country — UPI is meaningless outside India. */
function methodsFor(country?: string): Method[] {
  return METHODS.filter((m) => !m.only || (country ? m.only.includes(country) : true));
}

export default function AddTransaction() {
  const { user } = useAuth();
  const t = useTheme();
  const methods = methodsFor(user?.country);
  const router = useRouter();
  const params = useLocalSearchParams<{ kind?: string }>();
  const [kind, setKind] = useState<'expense' | 'income'>(params.kind === 'income' ? 'income' : 'expense');

  const [amount, setAmount] = useState('0');
  const [note, setNote] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('upi');
  const [split, setSplit] = useState(false);
  const [catSheet, setCatSheet] = useState(false);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // When the money actually moved — defaults to now, but can be set to the exact past
  // date + time so it lands in the right slot for lists, summaries and analytics.
  const [date, setDate] = useState(new Date());

  const categories = useCategories(kind);
  const createExpense = useCreateExpense();
  const createIncome = useCreateIncome();
  const when = useWhenPicker(date, setDate);

  const cats = categories.data ?? [];
  const activeCat: Category | undefined = useMemo(
    () => cats.find((c) => c.name === selectedCat) ?? cats[0],
    [cats, selectedCat],
  );

  const num = parseInt(amount, 10) || 0;
  const accent = kind === 'income' ? t.success : activeCat ? activeCat.color : t.accent;
  const catName = activeCat?.name ?? (kind === 'income' ? 'Income' : 'Category');
  const dateLabel = formatWhen(date);

  const pushDigit = (d: string) =>
    setAmount((a) => {
      if (d === '00') return a === '0' ? '0' : (a + '00').slice(0, 9);
      return a === '0' ? d : (a + d).slice(0, 9);
    });

  const onSave = () => {
    if (!num || !activeCat) return;
    setError(null);
    if (kind === 'expense' && split) {
      router.replace(`/add-split?amount=${num}&category=${encodeURIComponent(activeCat.name)}&note=${encodeURIComponent(note)}`);
      return;
    }
    if (kind === 'expense') {
      createExpense.mutate(
        { amount: num, category: activeCat.name, paymentMethod: method, notes: note || undefined, description: note || undefined, spentAt: date.toISOString() },
        { onSuccess: () => router.back(), onError: (e) => setError(errorMessage(e)) },
      );
    } else {
      createIncome.mutate(
        { amount: num, category: activeCat.name, receivedVia: method, notes: note || undefined, source: note || undefined, receivedAt: date.toISOString() },
        { onSuccess: () => router.back(), onError: (e) => setError(errorMessage(e)) },
      );
    }
  };

  const saving = createExpense.isPending || createIncome.isPending;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: t.canvas }}>
      {/* header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 4 }}>
        <IconButton name="close" onPress={() => router.back()} />
        <View style={{ width: 188 }}>
          <Segmented
            options={[
              { value: 'expense', label: 'Expense' },
              { value: 'income', label: 'Income' },
            ]}
            value={kind}
            onChange={(v) => {
              setKind(v);
              setSelectedCat(null);
              if (v === 'income') setSplit(false);
            }}
          />
        </View>
        <View style={{ width: 38 }} />
      </View>

      {/* amount */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
        <Pressable
          onPress={() => kind === 'expense' && setCatSheet(true)}
          disabled={kind !== 'expense'}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: hexA(accent, 0.13),
            paddingVertical: 7,
            paddingLeft: 8,
            paddingRight: 14,
            borderRadius: 999,
            marginBottom: 22,
          }}
        >
          <View style={{ width: 28, height: 28, borderRadius: 999, backgroundColor: accent, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons
              name={activeCat ? categoryStyle(activeCat.name).icon : 'pricetag'}
              size={16}
              color="#fff"
            />
          </View>
          <Txt color={accent} style={{ fontFamily: Font.semibold, fontSize: 14.5 }}>
            {catName}
          </Txt>
          {kind === 'expense' && <Ionicons name="chevron-down" size={16} color={accent} />}
        </Pressable>

        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <Txt color={t.ink3} style={{ fontSize: 30, marginTop: 8 }}>
            {currencySymbol()}
          </Txt>
          <Txt
            color={num ? t.ink : t.ink3}
            style={[{ fontFamily: Font.bold, fontSize: 56, lineHeight: 62 }, tabularNums]}
          >
            {moneyAmount(num)}
          </Txt>
        </View>

        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Add a note…"
          placeholderTextColor={t.ink3}
          style={{ marginTop: 18, textAlign: 'center', fontFamily: Font.regular, fontSize: 15, color: t.ink, minWidth: 200 }}
        />

        {/* spend date + time — tap to set exactly when it happened */}
        <Pressable
          onPress={when.open}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999, backgroundColor: t.fill }}
        >
          <Ionicons name="calendar-outline" size={15} color={t.ink2} />
          <Txt color={t.ink2} variant="caption" style={{ fontFamily: Font.medium }}>
            {dateLabel}
          </Txt>
          <Ionicons name="chevron-down" size={14} color={t.ink3} />
        </Pressable>

        {error && (
          <Txt tone="danger" variant="caption" style={{ marginTop: 12 }}>
            {error}
          </Txt>
        )}
      </View>

      {/* details + keypad */}
      <View style={{ backgroundColor: t.canvas2, borderTopLeftRadius: 26, borderTopRightRadius: 26, borderTopWidth: 1, borderTopColor: t.hair, paddingHorizontal: 16, paddingTop: 16 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 12 }}>
          {methods.map((m) => {
            const on = method === m.id;
            return (
              <Pressable
                key={m.id}
                onPress={() => setMethod(m.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 13,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: on ? t.ink : t.surface,
                  borderWidth: 1,
                  borderColor: on ? t.ink : t.line,
                }}
              >
                <Ionicons name={m.icon} size={16} color={on ? t.canvas : t.ink2} />
                <Txt color={on ? t.canvas : t.ink2} style={{ fontFamily: Font.semibold, fontSize: 13.5 }}>
                  {m.label}
                </Txt>
              </Pressable>
            );
          })}
        </ScrollView>

        {kind === 'expense' && (
          <Pressable
            onPress={() => setSplit((s) => !s)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 12,
              borderRadius: 14,
              marginBottom: 12,
              backgroundColor: split ? t.accentSoft : t.surface,
              borderWidth: 1,
              borderColor: split ? hexA(t.accent, 0.3) : t.line,
            }}
          >
            <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: split ? t.accent : t.fill, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="git-branch" size={18} color={split ? '#fff' : t.ink2} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt variant="headline">Split this expense</Txt>
              <Txt tone="ink3" variant="caption">
                {split ? 'Choose who shares the cost next' : 'Share with friends or a group'}
              </Txt>
            </View>
            <View style={{ width: 46, height: 28, borderRadius: 999, backgroundColor: split ? t.accent : t.fill2, padding: 3, justifyContent: 'center' }}>
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 999,
                  backgroundColor: '#fff',
                  alignSelf: split ? 'flex-end' : 'flex-start',
                  ...t.shadow,
                }}
              />
            </View>
          </Pressable>
        )}

        <Keypad doubleZero onKey={pushDigit} onDelete={() => setAmount((a) => (a.length > 1 ? a.slice(0, -1) : '0'))} />

        <View style={{ paddingBottom: 8 }}>
          <Button
            size="lg"
            disabled={!num || !activeCat}
            loading={saving}
            icon={split ? 'git-branch' : 'checkmark'}
            onPress={onSave}
          >
            {split ? 'Set up split' : kind === 'income' ? 'Add income' : 'Add expense'}
          </Button>
        </View>
      </View>

      {/* shared date + time picker */}
      {when.element}

      {/* category sheet */}
      <Sheet open={catSheet} onClose={() => setCatSheet(false)} title="Category">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingBottom: 8 }}>
          {cats.map((c) => {
            const on = activeCat?.id === c.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => {
                  setSelectedCat(c.name);
                  setCatSheet(false);
                }}
                style={{ width: '25%', alignItems: 'center', paddingVertical: 12 }}
              >
                <CategoryIcon name={c.name} icon={c.icon as keyof typeof Ionicons.glyphMap} color={c.color} size={48} />
                <Txt
                  center
                  tone={on ? 'accent' : 'ink2'}
                  variant="micro"
                  numberOfLines={2}
                  style={{ marginTop: 7, fontFamily: on ? Font.semibold : Font.medium }}
                >
                  {c.name}
                </Txt>
              </Pressable>
            );
          })}
          {cats.length === 0 && (
            <Txt tone="ink3" variant="caption" style={{ padding: 24 }}>
              No categories available.
            </Txt>
          )}
        </View>
      </Sheet>
    </SafeAreaView>
  );
}
