import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import React, { useState } from 'react';
import { Pressable, Switch, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { hexA, useTheme } from '@/theme';
import { Font } from '@/theme/fonts';
import { CollapsibleScreen, Txt } from '@/ui';

export default function PrivacySettings() {
  const t = useTheme();
  const { user } = useAuth();
  const [appLock, setAppLock] = useState(false);

  return (
    <CollapsibleScreen title="Privacy & security" contentContainerStyle={{ padding: 16, gap: 14 }}>
        {/* app lock */}
        <View style={{ backgroundColor: t.surface, borderRadius: 16, borderWidth: 1, borderColor: t.hair, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 14, paddingVertical: 13 }}>
            <Iconish icon="finger-print" color="#4F46E5" />
            <View style={{ flex: 1 }}>
              <Txt style={{ fontFamily: Font.semibold }}>App lock</Txt>
              <Txt tone="ink3" variant="caption">
                Require Face ID / fingerprint to open Spendes
              </Txt>
            </View>
            <Switch value={appLock} onValueChange={setAppLock} trackColor={{ true: t.accent, false: t.fill2 }} thumbColor="#fff" />
          </View>
        </View>

        {/* account info */}
        <View style={{ backgroundColor: t.surface, borderRadius: 16, borderWidth: 1, borderColor: t.hair, overflow: 'hidden' }}>
          <InfoRow icon="call-outline" color="#16A34A" label="Phone number" value={`${user?.dialCode ?? ''} ${user?.phoneNumber ?? ''}`} />
          <InfoRow icon="shield-checkmark-outline" color="#2563EB" label="Phone verified" value={user?.isPhoneVerified ? 'Yes' : 'No'} last />
        </View>

        <Pressable onPress={() => Linking.openURL('https://spendes.app/privacy')}>
          <View style={{ backgroundColor: t.surface, borderRadius: 16, borderWidth: 1, borderColor: t.hair, overflow: 'hidden' }}>
            <LinkRow icon="document-text-outline" color="#52525B" label="Privacy policy" last />
          </View>
        </Pressable>

        <Txt tone="ink3" variant="caption" style={{ paddingHorizontal: 4, lineHeight: 18 }}>
          Your tokens are stored securely in the device keychain. Spendes never stores your UPI
          PIN — payments happen inside your own UPI app.
        </Txt>
    </CollapsibleScreen>
  );
}

function Iconish({ icon, color }: { icon: keyof typeof Ionicons.glyphMap; color: string }) {
  return (
    <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: hexA(color, 0.15), alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={icon} size={18} color={color} />
    </View>
  );
}

function InfoRow({ icon, color, label, value, last }: { icon: keyof typeof Ionicons.glyphMap; color: string; label: string; value: string; last?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: last ? 0 : 1, borderBottomColor: t.hair }}>
      <Iconish icon={icon} color={color} />
      <Txt style={{ flex: 1, fontFamily: Font.medium }}>{label}</Txt>
      <Txt tone="ink3" variant="caption">
        {value}
      </Txt>
    </View>
  );
}

function LinkRow({ icon, color, label, last }: { icon: keyof typeof Ionicons.glyphMap; color: string; label: string; last?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: last ? 0 : 1, borderBottomColor: t.hair }}>
      <Iconish icon={icon} color={color} />
      <Txt style={{ flex: 1, fontFamily: Font.medium }}>{label}</Txt>
      <Ionicons name="chevron-forward" size={17} color={t.ink3} />
    </View>
  );
}
