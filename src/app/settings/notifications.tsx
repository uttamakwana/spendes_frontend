import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Switch, View } from 'react-native';

import { hexA, useTheme } from '@/theme';
import { Font } from '@/theme/fonts';
import { CollapsibleScreen, Txt } from '@/ui';

interface Pref {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
  desc: string;
}

const PREFS: Pref[] = [
  { key: 'reminders', icon: 'alarm-outline', color: '#D97706', label: 'Payment reminders', desc: 'Nudges before EMIs and bills are due' },
  { key: 'splits', icon: 'git-branch-outline', color: '#4F46E5', label: 'Split activity', desc: 'When someone adds you to a split or pays you' },
  { key: 'budgets', icon: 'disc-outline', color: '#DC2626', label: 'Budget alerts', desc: 'When you’re close to or over a limit' },
  { key: 'summary', icon: 'newspaper-outline', color: '#16A34A', label: 'Weekly summary', desc: 'A digest of your spending each week' },
];

export default function NotificationsSettings() {
  const t = useTheme();
  const [on, setOn] = useState<Record<string, boolean>>({ reminders: true, splits: true, budgets: true, summary: false });

  return (
    <CollapsibleScreen title="Notifications" contentContainerStyle={{ padding: 16 }}>
        <View style={{ backgroundColor: t.surface, borderRadius: 16, borderWidth: 1, borderColor: t.hair, overflow: 'hidden' }}>
          {PREFS.map((p, i) => (
            <View
              key={p.key}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 13,
                paddingHorizontal: 14,
                paddingVertical: 13,
                borderBottomWidth: i === PREFS.length - 1 ? 0 : 1,
                borderBottomColor: t.hair,
              }}
            >
              <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: hexA(p.color, 0.15), alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={p.icon} size={18} color={p.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt style={{ fontFamily: Font.semibold }}>{p.label}</Txt>
                <Txt tone="ink3" variant="caption" style={{ marginTop: 1 }}>
                  {p.desc}
                </Txt>
              </View>
              <Switch
                value={!!on[p.key]}
                onValueChange={(v) => setOn((s) => ({ ...s, [p.key]: v }))}
                trackColor={{ true: t.accent, false: t.fill2 }}
                thumbColor="#fff"
              />
            </View>
          ))}
        </View>
        <Txt tone="ink3" variant="caption" style={{ marginTop: 14, paddingHorizontal: 4, lineHeight: 18 }}>
          Push notifications require enabling them for Spendes in your device settings. These
          preferences control what we’d send once that’s on.
        </Txt>
    </CollapsibleScreen>
  );
}
