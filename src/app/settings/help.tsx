import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import React from 'react';
import { Pressable, View } from 'react-native';

import { hexA, useTheme } from '@/theme';
import { Font } from '@/theme/fonts';
import { CollapsibleScreen, Txt } from '@/ui';

interface Item {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
  desc: string;
  url: string;
}

const ITEMS: Item[] = [
  { icon: 'mail-outline', color: '#4F46E5', label: 'Contact support', desc: 'support@spendes.app', url: 'mailto:support@spendes.app?subject=Spendes%20support' },
  { icon: 'help-buoy-outline', color: '#2563EB', label: 'Help center', desc: 'Guides and FAQs', url: 'https://spendes.netlify.app/#faq' },
  { icon: 'document-text-outline', color: '#52525B', label: 'Terms of service', desc: '', url: 'https://spendes.netlify.app/terms' },
  { icon: 'lock-closed-outline', color: '#16A34A', label: 'Privacy policy', desc: '', url: 'https://spendes.netlify.app/privacy' },
];

export default function HelpSupport() {
  const t = useTheme();
  return (
    <CollapsibleScreen title="Help & support" contentContainerStyle={{ padding: 16, gap: 14 }}>
        <View style={{ backgroundColor: t.surface, borderRadius: 16, borderWidth: 1, borderColor: t.hair, overflow: 'hidden' }}>
          {ITEMS.map((it, i) => (
            <Pressable
              key={it.label}
              onPress={() => Linking.openURL(it.url).catch(() => {})}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 13,
                paddingHorizontal: 14,
                paddingVertical: 13,
                borderBottomWidth: i === ITEMS.length - 1 ? 0 : 1,
                borderBottomColor: t.hair,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: hexA(it.color, 0.15), alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={it.icon} size={18} color={it.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt style={{ fontFamily: Font.medium }}>{it.label}</Txt>
                {!!it.desc && (
                  <Txt tone="ink3" variant="caption" style={{ marginTop: 1 }}>
                    {it.desc}
                  </Txt>
                )}
              </View>
              <Ionicons name="open-outline" size={17} color={t.ink3} />
            </Pressable>
          ))}
        </View>
        <Txt center tone="ink3" variant="caption" style={{ marginTop: 4 }}>
          Spendes v1.0 · Made in India 🇮🇳
        </Txt>
    </CollapsibleScreen>
  );
}
