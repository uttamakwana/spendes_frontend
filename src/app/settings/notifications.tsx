import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Switch, View } from 'react-native';

import { NotificationPreferences, usersApi } from '@/api';
import { useAuth } from '@/auth/AuthProvider';
import { hexA, useTheme } from '@/theme';
import { Font } from '@/theme/fonts';
import { CollapsibleScreen, Txt } from '@/ui';

type PrefKey = keyof NotificationPreferences;

interface Pref {
  key: PrefKey;
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

const DEFAULTS: NotificationPreferences = { reminders: true, splits: true, budgets: true, summary: false };

export default function NotificationsSettings() {
  const t = useTheme();
  const { user, setUser } = useAuth();

  // Seed from the saved preferences; fall back to defaults for older accounts.
  const [prefs, setPrefs] = useState<NotificationPreferences>(() => ({
    ...DEFAULTS,
    ...(user?.notificationPreferences ?? {}),
  }));

  const update = useMutation({
    mutationFn: (patch: Partial<NotificationPreferences>) => usersApi.updateNotificationPreferences(patch),
    onSuccess: (u) => {
      setUser(u);
      setPrefs({ ...DEFAULTS, ...u.notificationPreferences });
    },
    onError: () => {
      // Revert optimistic change back to the last known-good server value.
      setPrefs({ ...DEFAULTS, ...(user?.notificationPreferences ?? {}) });
    },
  });

  const toggle = (key: PrefKey, value: boolean) => {
    setPrefs((p) => ({ ...p, [key]: value })); // optimistic
    update.mutate({ [key]: value });
  };

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
                value={prefs[p.key]}
                onValueChange={(v) => toggle(p.key, v)}
                trackColor={{ true: t.accent, false: t.fill2 }}
                thumbColor="#fff"
              />
            </View>
          ))}
        </View>
        <Txt tone="ink3" variant="caption" style={{ marginTop: 14, paddingHorizontal: 4, lineHeight: 18 }}>
          Saved to your account and synced across devices. You’ll also need notifications enabled
          for Spendes in your device settings to receive pushes.
        </Txt>
    </CollapsibleScreen>
  );
}
