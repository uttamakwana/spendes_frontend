import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';

import { errorMessage, usersApi } from '@/api';
import { useAuth } from '@/auth/AuthProvider';
import { useTheme } from '@/theme';
import { Font } from '@/theme/fonts';
import { Avatar, Button, CollapsibleScreen, Txt } from '@/ui';

export default function ProfileEdit() {
  const t = useTheme();
  const router = useRouter();
  const { user, setUser } = useAuth();

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [upiId, setUpiId] = useState(user?.upiId ?? '');
  const [error, setError] = useState<string | null>(null);
  // Brief success confirmation — needed because a local upload finishes almost
  // instantly, so a spinner alone gives no perceptible feedback.
  const [showUpdated, setShowUpdated] = useState(false);

  const save = useMutation({
    mutationFn: () =>
      usersApi.updateMe({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || undefined,
        upiId: upiId.trim() || undefined,
      }),
    onSuccess: (u) => {
      setUser(u);
      router.back();
    },
    onError: (e) => setError(errorMessage(e)),
  });

  const upload = useMutation({
    mutationFn: (file: { uri: string; name: string; type: string }) => usersApi.uploadAvatar(file),
    onSuccess: (u) => {
      setUser(u);
      setError(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setShowUpdated(true);
      setTimeout(() => setShowUpdated(false), 2500);
    },
    onError: (e) => setError(errorMessage(e)),
  });
  const removeAvatar = useMutation({
    mutationFn: () => usersApi.removeAvatar(),
    onSuccess: (u) => {
      setUser(u);
      setShowUpdated(false);
    },
    onError: (e) => setError(errorMessage(e)),
  });
  const busy = upload.isPending || removeAvatar.isPending;

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
    <CollapsibleScreen title="Edit profile" contentContainerStyle={{ padding: 16, gap: 14 }}>
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
        <Field
          label="UPI ID"
          value={upiId}
          onChange={setUpiId}
          placeholder="name@okhdfcbank"
          autoCapitalize="none"
          hint="Friends pay you here when settling up over UPI."
        />

        {error && (
          <Txt tone="danger" variant="caption">
            {error}
          </Txt>
        )}

        <View style={{ marginTop: 8 }}>
          <Button size="lg" loading={save.isPending} disabled={!firstName.trim() || !lastName.trim()} onPress={() => { setError(null); save.mutate(); }}>
            Save changes
          </Button>
        </View>
    </CollapsibleScreen>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
  hint?: string;
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
        <Txt tone="ink3" variant="caption" style={{ marginTop: 6, paddingHorizontal: 2 }}>
          {hint}
        </Txt>
      )}
    </View>
  );
}
