import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { TextInput, View } from 'react-native';

import { errorMessage, usersApi } from '@/api';
import { useAuth } from '@/auth/AuthProvider';
import { useTheme } from '@/theme';
import { Font } from '@/theme/fonts';
import { Button, CollapsibleScreen, Txt } from '@/ui';

export default function ProfileEdit() {
  const t = useTheme();
  const router = useRouter();
  const { user, setUser } = useAuth();

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [upiId, setUpiId] = useState(user?.upiId ?? '');
  const [error, setError] = useState<string | null>(null);

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

  return (
    <CollapsibleScreen title="Edit profile" contentContainerStyle={{ padding: 16, gap: 14 }}>
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
