import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday } from 'date-fns';
import React, { useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, TextInput, View } from 'react-native';

import type { Category } from '@/api';
import { useCategories } from '@/features/hooks';
import { categoryStyle } from '@/lib/categories';
import { hexA, useTheme } from '@/theme';
import { Font, tabularNums } from '@/theme/fonts';
import { Button, CategoryIcon, Sheet, Txt } from '@/ui';

/** Labeled single-line text/number input. */
export function LabeledInput({
  label,
  value,
  onChangeText,
  placeholder,
  hint,
  keyboardType,
  autoCapitalize,
  prefix,
}: {
  label: string;
  value: string;
  onChangeText: (s: string) => void;
  placeholder?: string;
  hint?: string;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad' | 'email-address';
  autoCapitalize?: 'none' | 'words' | 'sentences';
  prefix?: string;
}) {
  const t = useTheme();
  return (
    <View>
      <Txt variant="caption" tone="ink2" style={{ fontFamily: Font.semibold, marginBottom: 6, paddingHorizontal: 2 }}>
        {label}
      </Txt>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: t.surface,
          borderWidth: 1,
          borderColor: t.line,
          borderRadius: 12,
          paddingHorizontal: 14,
          height: 50,
        }}
      >
        {prefix && (
          <Txt tone="ink3" style={{ fontSize: 17 }}>
            {prefix}
          </Txt>
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={t.ink3}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          style={[{ flex: 1, fontFamily: Font.medium, fontSize: 16, color: t.ink }, keyboardType?.includes('pad') ? tabularNums : null]}
        />
      </View>
      {hint && (
        <Txt tone="ink3" variant="caption" style={{ marginTop: 6, paddingHorizontal: 2 }}>
          {hint}
        </Txt>
      )}
    </View>
  );
}

/** Large ₹ amount entry (system keyboard). */
export function AmountField({ value, onChange, label = 'Amount' }: { value: string; onChange: (s: string) => void; label?: string }) {
  const t = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 8 }}>
      <Txt variant="caption" tone="ink2" style={{ fontFamily: Font.semibold, marginBottom: 6 }}>
        {label}
      </Txt>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Txt color={t.ink3} style={{ fontSize: 28, marginRight: 4 }}>
          ₹
        </Txt>
        <TextInput
          value={value}
          onChangeText={(v) => onChange(v.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor={t.ink3}
          style={[{ fontFamily: Font.bold, fontSize: 40, color: t.ink, minWidth: 80, textAlign: 'center' }, tabularNums]}
        />
      </View>
    </View>
  );
}

/** Horizontal chip selector for short enums. */
export function ChipSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label?: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const t = useTheme();
  return (
    <View>
      {label && (
        <Txt variant="caption" tone="ink2" style={{ fontFamily: Font.semibold, marginBottom: 8, paddingHorizontal: 2 }}>
          {label}
        </Txt>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <Pressable
              key={o.value}
              onPress={() => onChange(o.value)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 9,
                borderRadius: 999,
                backgroundColor: on ? t.accent : t.surface,
                borderWidth: 1,
                borderColor: on ? t.accent : t.line,
              }}
            >
              <Txt color={on ? '#fff' : t.ink2} style={{ fontFamily: Font.semibold, fontSize: 13.5 }}>
                {o.label}
              </Txt>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export interface WhenPickerOptions {
  /** 'datetime' (default) captures date + time; 'date' captures the day only. */
  mode?: 'date' | 'datetime';
  /** Latest selectable date. Defaults to now (past only). Pass `null` to allow the future. */
  maximumDate?: Date | null;
  /** Earliest selectable date. */
  minimumDate?: Date;
}

const pad2 = (n: number): string => String(n).padStart(2, '0');

/** Formats a Date for an `<input type="date|datetime-local">` value (local time, not UTC). */
function toDateInputValue(d: Date, withTime: boolean): string {
  const day = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  return withTime ? `${day}T${pad2(d.getHours())}:${pad2(d.getMinutes())}` : day;
}

/** Parses an `<input type="date|datetime-local">` value back into a local Date. */
function parseDateInput(str: string, withTime: boolean): Date | null {
  if (!str) return null;
  const [datePart, timePart] = str.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  if (!y || !m || !d) return null;
  let hh = 0;
  let mm = 0;
  if (withTime && timePart) {
    const [h, min] = timePart.split(':').map(Number);
    hh = h || 0;
    mm = min || 0;
  }
  return new Date(y, m - 1, d, hh, mm, 0, 0);
}

/**
 * Cross-platform date / date+time picker shared by the forms. Android has no single
 * "datetime" picker, so for datetime it chains a date dialog into a time dialog and
 * merges them; iOS shows one spinner in a sheet. By default picks are capped at the
 * present (for back-dating records) — pass `maximumDate: null` to allow future dates
 * (e.g. an EMI's next debit date). Returns `open()` to launch it and `element` to render.
 */
export function useWhenPicker(
  value: Date,
  onChange: (d: Date) => void,
  options: WhenPickerOptions = {},
) {
  const t = useTheme();
  const [iosOpen, setIosOpen] = useState(false);
  const webInputRef = useRef<any>(null);
  const mode = options.mode ?? 'datetime';
  const withTime = mode !== 'date';
  const maximumDate = options.maximumDate === null ? undefined : (options.maximumDate ?? new Date());
  const minimumDate = options.minimumDate;

  // Belt-and-suspenders clamp (the native picker also enforces min/max).
  const commit = (d: Date) => {
    let next = d;
    if (maximumDate && next.getTime() > maximumDate.getTime()) next = maximumDate;
    if (minimumDate && next.getTime() < minimumDate.getTime()) next = minimumDate;
    onChange(next);
  };

  const open = () => {
    if (Platform.OS === 'web') {
      // Native pickers are non-functional on react-native-web; drive the browser's
      // own date control instead (a hidden <input> in `element`).
      const el = webInputRef.current;
      if (el) {
        try {
          el.showPicker();
        } catch {
          el.focus();
        }
      }
      return;
    }
    if (Platform.OS !== 'android') {
      setIosOpen(true);
      return;
    }
    if (mode === 'date') {
      DateTimePickerAndroid.open({
        value,
        mode: 'date',
        maximumDate,
        minimumDate,
        onChange: (event, picked) => {
          if (event.type === 'set' && picked) commit(picked);
        },
      });
      return;
    }
    // datetime: pick the date, then the time, then combine the two.
    DateTimePickerAndroid.open({
      value,
      mode: 'date',
      maximumDate,
      minimumDate,
      onChange: (dateEvent, pickedDate) => {
        if (dateEvent.type !== 'set' || !pickedDate) return;
        DateTimePickerAndroid.open({
          value: pickedDate,
          mode: 'time',
          onChange: (timeEvent, pickedTime) => {
            const merged = new Date(pickedDate);
            if (timeEvent.type === 'set' && pickedTime) {
              merged.setHours(pickedTime.getHours(), pickedTime.getMinutes(), 0, 0);
            }
            commit(merged);
          },
        });
      },
    });
  };

  const webInputProps = {
    ref: webInputRef,
    type: withTime ? 'datetime-local' : 'date',
    value: toDateInputValue(value, withTime),
    max: maximumDate ? toDateInputValue(maximumDate, withTime) : undefined,
    min: minimumDate ? toDateInputValue(minimumDate, withTime) : undefined,
    onChange: (e: any) => {
      const d = parseDateInput(e?.target?.value ?? '', withTime);
      if (d) commit(d);
    },
    // Visually hidden but kept in layout flow so the browser anchors its picker near the trigger.
    style: { position: 'absolute', left: 0, bottom: 0, width: 1, height: 1, opacity: 0 },
  };

  const element = Platform.OS === 'web' ? (
    React.createElement('input', webInputProps as any)
  ) : (
    <Sheet open={iosOpen} onClose={() => setIosOpen(false)} title="When">
      <View style={{ alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16 }}>
        <DateTimePicker
          value={value}
          mode={mode}
          display="inline"
          maximumDate={maximumDate}
          minimumDate={minimumDate}
          themeVariant={t.dark ? 'dark' : 'light'}
          onChange={(_, selected) => selected && commit(selected)}
        />
        <View style={{ alignSelf: 'stretch', marginTop: 8 }}>
          <Button size="lg" onPress={() => setIosOpen(false)}>
            Done
          </Button>
        </View>
      </View>
    </Sheet>
  );

  return { open, element };
}

/** "Today, 3:30 PM" / "12 Jun 2025, 3:30 PM" — a record's date + time for display. */
export function formatWhen(value: Date): string {
  const day = isToday(value) ? 'Today' : format(value, 'd MMM yyyy');
  return `${day}, ${format(value, 'h:mm a')}`;
}

/** "Today" / "12 Jun 2025" — a date for display (no time). */
export function formatDay(value: Date): string {
  return isToday(value) ? 'Today' : format(value, 'd MMM yyyy');
}

/** Labeled date (or date + time) field. Defaults to date+time capped at now. */
export function DateField({
  value,
  onChange,
  label = 'Date',
  mode,
  maximumDate,
  minimumDate,
}: {
  value: Date;
  onChange: (d: Date) => void;
  label?: string;
  mode?: 'date' | 'datetime';
  maximumDate?: Date | null;
  minimumDate?: Date;
}) {
  const t = useTheme();
  const { open, element } = useWhenPicker(value, onChange, { mode, maximumDate, minimumDate });
  const text = (mode ?? 'datetime') === 'date' ? formatDay(value) : formatWhen(value);

  return (
    <View>
      <Txt variant="caption" tone="ink2" style={{ fontFamily: Font.semibold, marginBottom: 6, paddingHorizontal: 2 }}>
        {label}
      </Txt>
      <Pressable
        onPress={open}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          backgroundColor: t.surface,
          borderWidth: 1,
          borderColor: t.line,
          borderRadius: 12,
          paddingHorizontal: 12,
          height: 50,
        }}
      >
        <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: t.fill, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="calendar-outline" size={17} color={t.ink2} />
        </View>
        <Txt style={{ flex: 1 }}>{text}</Txt>
        <Ionicons name="chevron-down" size={18} color={t.ink3} />
      </Pressable>
      {element}
    </View>
  );
}

/** Category picker — opens a bottom-sheet grid of categories for the given type. */
export function CategoryField({
  type,
  value,
  onChange,
  label = 'Category',
}: {
  type: 'expense' | 'income';
  value: string | null;
  onChange: (name: string) => void;
  label?: string;
}) {
  const t = useTheme();
  const { data } = useCategories(type);
  const cats = useMemo(() => data ?? [], [data]);
  const [open, setOpen] = useState(false);
  const active = cats.find((c) => c.name === value);

  return (
    <View>
      <Txt variant="caption" tone="ink2" style={{ fontFamily: Font.semibold, marginBottom: 6, paddingHorizontal: 2 }}>
        {label}
      </Txt>
      <Pressable
        onPress={() => setOpen(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          backgroundColor: t.surface,
          borderWidth: 1,
          borderColor: t.line,
          borderRadius: 12,
          paddingHorizontal: 12,
          height: 50,
        }}
      >
        {active ? (
          <CategoryIcon name={active.name} icon={active.icon as keyof typeof Ionicons.glyphMap} color={active.color} size={32} radius={9} />
        ) : (
          <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: t.fill, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="pricetag-outline" size={17} color={t.ink3} />
          </View>
        )}
        <Txt style={{ flex: 1 }} tone={active ? 'ink' : 'ink3'}>
          {active?.name ?? 'Choose a category'}
        </Txt>
        <Ionicons name="chevron-down" size={18} color={t.ink3} />
      </Pressable>

      <CategorySheet open={open} onClose={() => setOpen(false)} cats={cats} activeId={active?.id} onPick={(name) => { onChange(name); setOpen(false); }} />
    </View>
  );
}

function CategorySheet({
  open,
  onClose,
  cats,
  activeId,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  cats: Category[];
  activeId?: string;
  onPick: (name: string) => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Category">
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingBottom: 8 }}>
        {cats.map((c) => {
          const on = c.id === activeId;
          return (
            <Pressable key={c.id} onPress={() => onPick(c.name)} style={{ width: '25%', alignItems: 'center', paddingVertical: 12 }}>
              <CategoryIcon name={c.name} icon={c.icon as keyof typeof Ionicons.glyphMap} color={c.color} size={48} />
              <Txt center tone={on ? 'accent' : 'ink2'} variant="micro" numberOfLines={2} style={{ marginTop: 7, fontFamily: on ? Font.semibold : Font.medium }}>
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
  );
}

export { hexA, categoryStyle };
