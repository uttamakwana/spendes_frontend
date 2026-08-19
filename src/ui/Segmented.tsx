import React from 'react';
import { Pressable, StyleProp, View, ViewStyle } from 'react-native';

import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme';
import { Font } from '@/theme/fonts';
import { Txt } from './Text';

export interface SegOption<T extends string> {
  value: T;
  label: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  style,
}: {
  options: SegOption<T>[];
  value: T;
  onChange: (v: T) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          backgroundColor: t.fill,
          borderRadius: 11,
          padding: 3,
        },
        style,
      ]}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => {
              if (!active) haptics.selection();
              onChange(o.value);
            }}
            style={{
              flex: 1,
              height: 32,
              borderRadius: 8.5,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: active ? t.surface : 'transparent',
              ...(active ? t.shadow : {}),
            }}
          >
            <Txt
              tone={active ? 'ink' : 'ink2'}
              style={{ fontFamily: active ? Font.semibold : Font.medium, fontSize: 13.5 }}
            >
              {o.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Underline tabs (used in group detail). */
export function UnderlineTabs<T extends string>({
  options,
  value,
  onChange,
}: {
  options: SegOption<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 24,
        borderBottomWidth: 1,
        borderBottomColor: t.hair,
        paddingHorizontal: 20,
      }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => {
              if (!active) haptics.selection();
              onChange(o.value);
            }}
            style={{ paddingVertical: 12 }}
          >
            <Txt
              tone={active ? 'ink' : 'ink3'}
              style={{ fontFamily: active ? Font.semibold : Font.medium, fontSize: 15 }}
            >
              {o.label}
            </Txt>
            {active && (
              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: -1,
                  height: 2.5,
                  borderRadius: 3,
                  backgroundColor: t.accent,
                }}
              />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
