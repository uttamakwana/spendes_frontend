import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, View } from 'react-native';

import { ACCENT_LABELS, ACCENTS, hexA, useTheme, useThemeControls } from '@/theme';
import { Font } from '@/theme/fonts';
import { CollapsibleScreen, Txt } from '@/ui';

type Mode = 'system' | 'light' | 'dark';

const MODES: { key: Mode; icon: keyof typeof Ionicons.glyphMap; label: string; desc: string }[] = [
  { key: 'system', icon: 'phone-portrait-outline', label: 'System', desc: 'Follows your phone’s setting' },
  { key: 'light', icon: 'sunny-outline', label: 'Light', desc: 'Always light, day or night' },
  { key: 'dark', icon: 'moon-outline', label: 'Dark', desc: 'Always dark, easier at night' },
];

/**
 * Appearance settings, on their own screen rather than crammed into the profile
 * list. Both choices apply instantly — there's nothing to save — so the screen
 * previews what it's changing while you change it.
 */
export default function AppearanceSettings() {
  const t = useTheme();
  const { appearance, setAppearance, accent, setAccent } = useThemeControls();

  return (
    <CollapsibleScreen title="Appearance" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Preview />

      <Txt
        variant="caption"
        tone="ink2"
        style={{ fontFamily: Font.semibold, paddingHorizontal: 4, paddingTop: 22, paddingBottom: 8 }}
      >
        Theme
      </Txt>
      <View
        style={{
          backgroundColor: t.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: t.hair,
          overflow: 'hidden',
        }}
      >
        {MODES.map((m, i) => {
          const on = appearance === m.key;
          return (
            <Pressable
              key={m.key}
              onPress={() => setAppearance(m.key)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 13,
                paddingHorizontal: 14,
                paddingVertical: 13,
                borderBottomWidth: i === MODES.length - 1 ? 0 : 1,
                borderBottomColor: t.hair,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  backgroundColor: on ? t.accentSoft : t.fill,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name={m.icon} size={18} color={on ? t.accent : t.ink2} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt style={{ fontFamily: Font.medium }}>{m.label}</Txt>
                <Txt tone="ink3" variant="caption" style={{ marginTop: 1 }}>
                  {m.desc}
                </Txt>
              </View>
              {on && <Ionicons name="checkmark-circle" size={21} color={t.accent} />}
            </Pressable>
          );
        })}
      </View>

      <Txt
        variant="caption"
        tone="ink2"
        style={{ fontFamily: Font.semibold, paddingHorizontal: 4, paddingTop: 22, paddingBottom: 8 }}
      >
        Brand accent
      </Txt>
      <View
        style={{
          backgroundColor: t.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: t.hair,
          padding: 16,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {ACCENTS.map((c) => {
            const on = accent === c;
            return (
              <Pressable
                key={c}
                onPress={() => setAccent(c)}
                style={{ alignItems: 'center', gap: 7, flex: 1 }}
                hitSlop={6}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 999,
                    backgroundColor: c,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: on ? 3 : 0,
                    borderColor: t.canvas,
                    ...(on ? t.shadowMd : {}),
                  }}
                >
                  {on && <Ionicons name="checkmark" size={21} color="#fff" />}
                </View>
                <Txt
                  variant="micro"
                  color={on ? t.ink : t.ink3}
                  style={{ fontFamily: on ? Font.semibold : Font.medium }}
                  numberOfLines={1}
                >
                  {ACCENT_LABELS[c] ?? 'Custom'}
                </Txt>
              </Pressable>
            );
          })}
        </View>
        <Txt tone="ink3" variant="caption" style={{ marginTop: 14, lineHeight: 18 }}>
          Tints buttons, links and highlights across the app. Money always stays green
          when you’re owed and red when you owe.
        </Txt>
      </View>
    </CollapsibleScreen>
  );
}

/** A miniature of the app's own surfaces, so the choice is visible before you leave. */
function Preview() {
  const t = useTheme();
  return (
    <View
      style={{
        backgroundColor: t.canvas2,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: t.hair,
        padding: 16,
        gap: 12,
      }}
    >
      <View
        style={{
          backgroundColor: t.surface,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: t.hair,
          padding: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            backgroundColor: hexA(t.accent, 0.15),
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="fast-food-outline" size={19} color={t.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Txt style={{ fontFamily: Font.semibold }}>Dinner</Txt>
          <Txt tone="ink3" variant="caption">
            Split with 2 friends
          </Txt>
        </View>
        <Txt color={t.success} style={{ fontFamily: Font.semibold }}>
          ₹250
        </Txt>
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View
          style={{
            flex: 1,
            height: 40,
            borderRadius: 12,
            backgroundColor: t.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Txt color={t.onAccent} style={{ fontFamily: Font.semibold, fontSize: 14 }}>
            Settle up
          </Txt>
        </View>
        <View
          style={{
            flex: 1,
            height: 40,
            borderRadius: 12,
            backgroundColor: t.accentSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Txt color={t.accent} style={{ fontFamily: Font.semibold, fontSize: 14 }}>
            Remind
          </Txt>
        </View>
      </View>
    </View>
  );
}
