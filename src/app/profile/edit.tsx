import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';

import type { PaymentHandleType } from '@/api';
import { errorMessage, usersApi } from '@/api';
import { useAuth } from '@/auth/AuthProvider';
import { useWriteMutation } from '@/features/useWriteMutation';
import { findCountry } from '@/lib/countries';
import { PAYMENT_RAILS, RAIL_ORDER } from '@/lib/payment-rails';
import { hexA, useTheme } from '@/theme';
import { Font } from '@/theme/fonts';
import { Avatar, Button, CollapsibleScreen, Sheet, Txt } from '@/ui';

/** The rail we suggest for someone who hasn't chosen one — their country's. */
const DEFAULT_RAIL_FOR = (country?: string): PaymentHandleType =>
  findCountry(country)?.defaultHandle ?? 'upi';

export default function ProfileEdit() {
  const t = useTheme();
  const router = useRouter();
  const { user, setUser } = useAuth();

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');

  // How friends pay this user back. The rail is theirs to choose — the country only
  // decided which one we suggested at sign-up.
  const [handleType, setHandleType] = useState<PaymentHandleType>(
    user?.paymentHandle?.type ?? DEFAULT_RAIL_FOR(user?.country),
  );
  const [handleValue, setHandleValue] = useState(user?.paymentHandle?.value ?? '');
  const [railPicker, setRailPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Brief success confirmation — needed because a local upload finishes almost
  // instantly, so a spinner alone gives no perceptible feedback.
  const [showUpdated, setShowUpdated] = useState(false);

  const save = useWriteMutation({
    mutationFn: () =>
      usersApi.updateMe({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || undefined,
        // Clearing the field removes the handle entirely rather than saving a blank.
        paymentHandle: handleValue.trim()
          ? { type: handleType, value: handleValue.trim() }
          : undefined,
      }),
    onSuccess: (u) => {
      setUser(u);
      router.back();
    },
    onError: (e) => setError(errorMessage(e)),
  });

  const upload = useWriteMutation({
    mutationFn: (file: { uri: string; name: string; type: string }) => usersApi.uploadAvatar(file),
    onSuccess: (u) => {
      setUser(u);
      setError(null);
      setShowUpdated(true);
      setTimeout(() => setShowUpdated(false), 2500);
    },
    onError: (e) => setError(errorMessage(e)),
  });
  const removeAvatar = useWriteMutation({
    mutationFn: () => usersApi.removeAvatar(),
    onSuccess: (u) => {
      setUser(u);
      setShowUpdated(false);
    },
    onError: (e) => setError(errorMessage(e)),
  });
  const busy = upload.isPending || removeAvatar.isPending;

  const rail = PAYMENT_RAILS[handleType];
  const handleBad = handleValue.trim().length > 0 && !rail.validate(handleValue);

  const pickAndUpload = async () => {
    setError(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError('Allow photo access to choose a picture.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    const asset = res.canceled ? undefined : res.assets[0];
    if (!asset) return;
    upload.mutate({
      uri: asset.uri,
      name: asset.fileName ?? 'avatar.jpg',
      type: asset.mimeType ?? 'image/jpeg',
    });
  };

  return (
    // The sheet is a sibling of the screen, not part of its scrolling content:
    // an inline bottom sheet only overlays what comes *before* it, so nested in
    // the content it renders behind anything below it (the Save button).
    <View style={{ flex: 1 }}>
      <CollapsibleScreen
        title="Edit profile"
        // Extra bottom room so the last field and Save button clear the keyboard.
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 48 }}
      >
          {/* profile photo */}
          <View style={{ alignItems: 'center', gap: 8, paddingTop: 4, paddingBottom: 6 }}>
            <Pressable onPress={pickAndUpload} disabled={busy} style={{ width: 96, height: 96 }}>
              <Avatar name={user?.fullName} seed={user?.id} uri={user?.avatarUrl} me size={96} />
              {/* dim + spinner while working — visible even for instant local uploads */}
              {busy && (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: 96,
                    height: 96,
                    borderRadius: 999,
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ActivityIndicator color="#fff" />
                </View>
              )}
              <View
                style={{
                  position: 'absolute',
                  right: -2,
                  bottom: -2,
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  backgroundColor: t.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 3,
                  borderColor: t.canvas2,
                }}
              >
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            </Pressable>

            {busy ? (
              <Txt tone="ink2" variant="caption" style={{ fontFamily: Font.semibold }}>
                {upload.isPending ? 'Uploading photo…' : 'Removing…'}
              </Txt>
            ) : showUpdated ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="checkmark-circle" size={15} color={t.success} />
                <Txt color={t.success} variant="caption" style={{ fontFamily: Font.semibold }}>
                  Photo updated
                </Txt>
              </View>
            ) : user?.avatarUrl ? (
              <Pressable onPress={() => { setError(null); removeAvatar.mutate(); }} hitSlop={8}>
                <Txt tone="danger" variant="caption" style={{ fontFamily: Font.semibold }}>
                  Remove photo
                </Txt>
              </Pressable>
            ) : (
              <Txt tone="ink3" variant="caption">
                Tap to add a photo
              </Txt>
            )}
          </View>

          <Field label="First name" value={firstName} onChange={setFirstName} autoCapitalize="words" />
          <Field label="Last name" value={lastName} onChange={setLastName} autoCapitalize="words" />
          <Field label="Email" value={email} onChange={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Pressable
            onPress={() => setRailPicker(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 11,
              backgroundColor: t.surface,
              borderWidth: 1,
              borderColor: t.line,
              borderRadius: 12,
              paddingHorizontal: 14,
              height: 50,
            }}
          >
            <Ionicons name={rail.icon} size={19} color={t.ink2} />
            <View style={{ flex: 1 }}>
              <Txt variant="micro" tone="ink3">
                How friends pay you back
              </Txt>
              <Txt style={{ fontFamily: Font.semibold, fontSize: 15 }}>{rail.label}</Txt>
            </View>
            <Ionicons name="chevron-down" size={16} color={t.ink3} />
          </Pressable>

          <Field
            label={rail.fieldLabel}
            value={handleValue}
            onChange={setHandleValue}
            placeholder={rail.placeholder}
            autoCapitalize="none"
            hint={handleBad ? `That doesn’t look right — try ${rail.placeholder}.` : rail.hint}
            hintTone={handleBad ? 'danger' : undefined}
          />

          {error && (
            <Txt tone="danger" variant="caption">
              {error}
            </Txt>
          )}

          <View style={{ marginTop: 8 }}>
            <Button size="lg" loading={save.isPending} disabled={!firstName.trim() || !lastName.trim() || handleBad} onPress={() => { setError(null); save.mutate(); }}>
              Save changes
            </Button>
          </View>
      </CollapsibleScreen>

      <Sheet open={railPicker} onClose={() => setRailPicker(false)} title="How should friends pay you?">
        <View style={{ paddingHorizontal: 20, paddingBottom: 16, gap: 8 }}>
          {RAIL_ORDER.map((type) => {
            const option = PAYMENT_RAILS[type];
            const on = type === handleType;
            return (
              <Pressable
                key={type}
                onPress={() => {
                  // A handle only means something on its own rail, so switching
                  // clears it rather than carrying a UPI id into a Venmo field.
                  if (type !== handleType) setHandleValue('');
                  setHandleType(type);
                  setRailPicker(false);
                }}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 13,
                  paddingHorizontal: 14,
                  borderRadius: 14,
                  backgroundColor: pressed ? t.fill : t.surface,
                  borderWidth: 1,
                  borderColor: on ? hexA(t.accent, 0.4) : t.line,
                })}
              >
                <Ionicons name={option.icon} size={19} color={on ? t.accent : t.ink2} />
                <View style={{ flex: 1 }}>
                  <Txt style={{ fontFamily: Font.medium }}>{option.label}</Txt>
                  <Txt tone="ink3" variant="micro" style={{ marginTop: 1 }}>
                    {option.hint}
                  </Txt>
                </View>
                {on && <Ionicons name="checkmark-circle" size={20} color={t.accent} />}
              </Pressable>
            );
          })}
        </View>
      </Sheet>
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
  hintTone,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
  hint?: string;
  /** `danger` turns the hint into the validation message for this field. */
  hintTone?: 'ink3' | 'danger';
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'words' | 'sentences';
}) {
  const t = useTheme();
  return (
    <View>
      <Txt variant="caption" tone="ink2" style={{ fontFamily: Font.semibold, marginBottom: 6, paddingHorizontal: 2 }}>
        {label}
      </Txt>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={t.ink3}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={{
          backgroundColor: t.surface,
          borderWidth: 1,
          borderColor: t.line,
          borderRadius: 12,
          paddingHorizontal: 14,
          height: 50,
          fontFamily: Font.medium,
          fontSize: 16,
          color: t.ink,
        }}
      />
      {hint && (
        <Txt tone={hintTone ?? 'ink3'} variant="caption" style={{ marginTop: 6, paddingHorizontal: 2 }}>
          {hint}
        </Txt>
      )}
    </View>
  );
}
