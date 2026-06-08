import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme';
import { Font, tabularNums } from '@/theme/fonts';
import { Txt } from '@/ui';

/** Numeric keypad for phone / OTP / amount entry. */
export function Keypad({
  onKey,
  onDelete,
  doubleZero = false,
}: {
  onKey: (digit: string) => void;
  onDelete: () => void;
  doubleZero?: boolean;
}) {
  const t = useTheme();
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', doubleZero ? '00' : '', '0', 'del'];

  const press = (k: string) => {
    if (!k) return;
    Haptics.selectionAsync().catch(() => {});
    if (k === 'del') onDelete();
    else onKey(k);
  };

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {keys.map((k, i) => (
        <Pressable
          key={i}
          onPress={() => press(k)}
          disabled={!k}
          style={({ pressed }) => ({
            width: '33.333%',
            height: 56,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed && k ? 0.5 : 1,
          })}
        >
          {k === 'del' ? (
            <Ionicons name="backspace-outline" size={24} color={t.ink2} />
          ) : (
            <Txt color={t.ink} style={[{ fontFamily: Font.medium, fontSize: 26 }, tabularNums]}>
              {k}
            </Txt>
          )}
        </Pressable>
      ))}
    </View>
  );
}
