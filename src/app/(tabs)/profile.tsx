import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { ACCENTS, hexA, useTheme, useThemeControls } from '@/theme';
import { Font } from '@/theme/fonts';
import { Avatar, CollapsibleScreen, IconButton, Txt } from '@/ui';

export default function ProfileTab() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { appearance, setAppearance, accent, setAccent } = useThemeControls();

  return (
    <CollapsibleScreen
      title="Profile"
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 90 }}
    >
        {/* identity */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 4, paddingBottom: 18 }}>
          <Avatar name={user?.fullName} seed={user?.id} uri={user?.avatarUrl} me size={64} />
          <View style={{ flex: 1 }}>
            <Txt variant="title3">{user?.fullName ?? 'Your name'}</Txt>
            <Txt tone="ink2" variant="caption" style={{ marginTop: 1 }}>
              {user?.dialCode} {user?.phoneNumber}
            </Txt>
            {user?.upiId ? (
              <Txt tone="accent" variant="caption" style={{ fontFamily: Font.semibold, marginTop: 2 }}>
                {user.upiId}
              </Txt>
            ) : null}
          </View>
          <IconButton name="create-outline" onPress={() => router.push('/profile/edit')} />
        </View>

        {/*
          Spendes Pro upsell — temporarily hidden until the Pro plan ships (billing via
          store in-app purchases). Re-enable this block once entitlements + subscriptions
          are implemented; the card itself is intentionally kept here for that work.

          <View style={{ backgroundColor: t.premium, borderRadius: 18, padding: 18, marginBottom: 16, overflow: 'hidden' }}>
            <View
              style={{
                position: 'absolute',
                top: -30,
                right: -20,
                width: 130,
                height: 130,
                borderRadius: 999,
                backgroundColor: hexA(t.accent, 0.5),
              }}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <Ionicons name="sparkles" size={18} color="#fff" />
              <Txt color="#fff" style={{ fontFamily: Font.bold, fontSize: 16 }}>
                Spendes Pro
              </Txt>
            </View>
            <Txt color="rgba(255,255,255,0.72)" style={{ marginTop: 8, lineHeight: 20, maxWidth: 250 }}>
              Unlimited budgets, smart insights, receipt scanning and investment tracking.
            </Txt>
            <Pressable
              style={{ marginTop: 14, alignSelf: 'flex-start', backgroundColor: '#fff', paddingHorizontal: 18, paddingVertical: 9, borderRadius: 10 }}
            >
              <Txt color={t.premium} style={{ fontFamily: Font.bold, fontSize: 14 }}>
                Try free for 14 days
              </Txt>
            </Pressable>
          </View>
        */}

        {/* plan modules */}
        <Group>
          <Row icon="disc-outline" color="#D97706" label="Budgets" onPress={() => router.push('/budgets')} />
          <Row icon="repeat" color="#8B7EC8" label="EMIs & recurring" onPress={() => router.push('/emis')} />
          <Row icon="rocket-outline" color="#16A34A" label="Goals" onPress={() => router.push('/goals')} />
          <Row icon="trending-up" color="#5C7AEA" label="Investments" onPress={() => router.push('/investments')} last />
        </Group>

        <Group>
          <Row icon="arrow-down-circle-outline" color="#16A34A" label="Income" onPress={() => router.push('/income')} />
          <Row icon="receipt-outline" color="#52525B" label="Transactions" onPress={() => router.push('/transactions')} />
          <Row icon="people-outline" color="#4F46E5" label="Friends" onPress={() => router.push('/friends')} />
          <Row
            icon="phone-portrait-outline"
            color="#6BA4B8"
            label="UPI ID"
            detail={user?.upiId ?? 'Set up'}
            onPress={() => router.push('/profile/edit')}
            last
          />
        </Group>

        {/* appearance */}
        <View style={{ backgroundColor: t.surface, borderRadius: 16, borderWidth: 1, borderColor: t.hair, padding: 16, marginBottom: 14 }}>
          <Txt variant="caption" tone="ink2">
            Appearance
          </Txt>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            {(['system', 'light', 'dark'] as const).map((a) => {
              const on = appearance === a;
              return (
                <Pressable
                  key={a}
                  onPress={() => setAppearance(a)}
                  style={{
                    flex: 1,
                    paddingVertical: 9,
                    borderRadius: 10,
                    alignItems: 'center',
                    backgroundColor: on ? t.accentSoft : t.fill,
                    borderWidth: 1,
                    borderColor: on ? hexA(t.accent, 0.3) : 'transparent',
                  }}
                >
                  <Txt color={on ? t.accent : t.ink2} style={{ fontFamily: Font.semibold, fontSize: 13, textTransform: 'capitalize' }}>
                    {a}
                  </Txt>
                </Pressable>
              );
            })}
          </View>
          <Txt variant="caption" tone="ink2" style={{ marginTop: 16 }}>
            Brand accent
          </Txt>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
            {ACCENTS.map((c) => {
              const on = accent === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => setAccent(c)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 999,
                    backgroundColor: c,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: on ? 2.5 : 0,
                    borderColor: t.canvas,
                    ...(on ? t.shadow : {}),
                  }}
                >
                  {on && <Ionicons name="checkmark" size={18} color="#fff" />}
                </Pressable>
              );
            })}
          </View>
        </View>

        <Group>
          <Row icon="notifications-outline" color="#2563EB" label="Notifications" onPress={() => router.push('/settings/notifications')} />
          <Row icon="lock-closed-outline" color="#52525B" label="Privacy & security" onPress={() => router.push('/settings/privacy')} />
          <Row icon="help-circle-outline" color="#6BA4B8" label="Help & support" onPress={() => router.push('/settings/help')} last />
        </Group>

        <Group>
          <Row icon="log-out-outline" color="#DC2626" label="Log out" danger onPress={signOut} last />
        </Group>

        <Txt center tone="ink3" variant="caption" style={{ marginTop: 4 }}>
          Spendes v1.0 · Made in India 🇮🇳
        </Txt>
    </CollapsibleScreen>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return (
    <View
      style={{
        backgroundColor: t.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: t.hair,
        overflow: 'hidden',
        marginBottom: 14,
      }}
    >
      {children}
    </View>
  );
}

function Row({
  icon,
  color,
  label,
  detail,
  onPress,
  last,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
  detail?: string;
  onPress?: () => void;
  last?: boolean;
  danger?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 13,
        paddingHorizontal: 14,
        paddingVertical: 13,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: t.hair,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 9,
          backgroundColor: hexA(color, 0.15),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Txt style={{ flex: 1, fontFamily: Font.medium }} color={danger ? t.danger : t.ink}>
        {label}
      </Txt>
      {detail && (
        <Txt tone="ink3" variant="caption">
          {detail}
        </Txt>
      )}
      {!danger && <Ionicons name="chevron-forward" size={17} color={t.ink3} />}
    </Pressable>
  );
}
