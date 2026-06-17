import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';

import { errorMessage } from '@/api';
import { useAuth } from '@/auth/AuthProvider';
import { hexA, useTheme } from '@/theme';
import { Font } from '@/theme/fonts';
import { CollapsibleScreen, Txt } from '@/ui';

const CONFIRM_WORD = 'DELETE';

/** Everything the backend cascade removes — spelled out so the choice is informed. */
const REMOVED = [
  'All your expenses, income, budgets, EMIs, goals and investments',
  'Groups you created — and every expense and settlement inside them',
  'Your splits and settlements, and your spot in shared groups',
  'Your friends, balances, notifications and profile',
];

export default function DeleteAccount() {
  const t = useTheme();
  const router = useRouter();
  const { deleteAccount } = useAuth();

  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const canDelete = confirm.trim().toUpperCase() === CONFIRM_WORD;

  const remove = useMutation({
    mutationFn: () => deleteAccount(),
    onSuccess: () => router.replace('/onboarding'),
    onError: (e) => setError(errorMessage(e)),
  });

  return (
    <CollapsibleScreen title="Delete account" contentContainerStyle={{ padding: 16, gap: 16 }}>
      {/* warning hero */}
      <View style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 4 }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 999,
            backgroundColor: hexA(t.danger, 0.12),
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 14,
          }}
        >
          <Ionicons name="warning-outline" size={32} color={t.danger} />
        </View>
        <Txt variant="title3" center>
          Permanently delete your account?
        </Txt>
        <Txt tone="ink2" center style={{ marginTop: 6, lineHeight: 21, maxWidth: 320 }}>
          This can’t be undone. Once it’s done, your account and everything in it are gone for good.
        </Txt>
      </View>

      {/* what gets removed */}
      <View style={{ backgroundColor: t.surface, borderRadius: 16, borderWidth: 1, borderColor: t.hair, padding: 16, gap: 12 }}>
        <Txt variant="caption" tone="ink2" style={{ fontFamily: Font.semibold }}>
          What gets deleted
        </Txt>
        {REMOVED.map((line) => (
          <View key={line} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
            <Ionicons name="close-circle" size={18} color={t.danger} style={{ marginTop: 1 }} />
            <Txt tone="ink" style={{ flex: 1, lineHeight: 20 }}>
              {line}
            </Txt>
          </View>
        ))}
      </View>

      {/* honest caveat — mirrors the privacy policy */}
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start', paddingHorizontal: 4 }}>
        <Ionicons name="information-circle-outline" size={15} color={t.ink3} style={{ marginTop: 1 }} />
        <Txt tone="ink3" variant="caption" style={{ flex: 1, lineHeight: 18 }}>
          Expenses you shared into groups owned by other people may stay in their records, so their
          balances aren’t broken. You’ll be removed from those groups.
        </Txt>
      </View>

      {/* type-to-confirm */}
      <View style={{ marginTop: 4 }}>
        <Txt variant="caption" tone="ink2" style={{ fontFamily: Font.semibold, marginBottom: 6, paddingHorizontal: 2 }}>
          Type {CONFIRM_WORD} to confirm
        </Txt>
        <TextInput
          value={confirm}
          onChangeText={(v) => {
            setConfirm(v);
            if (error) setError(null);
          }}
          placeholder={CONFIRM_WORD}
          placeholderTextColor={t.ink3}
          autoCapitalize="characters"
          autoCorrect={false}
          editable={!remove.isPending}
          style={{
            backgroundColor: t.surface,
            borderWidth: 1,
            borderColor: canDelete ? t.danger : t.line,
            borderRadius: 12,
            paddingHorizontal: 14,
            height: 50,
            fontFamily: Font.semibold,
            fontSize: 16,
            letterSpacing: 2,
            color: t.ink,
          }}
        />
      </View>

      {error && (
        <Txt tone="danger" variant="caption" style={{ paddingHorizontal: 2 }}>
          {error}
        </Txt>
      )}

      {/* actions */}
      <View style={{ gap: 10, marginTop: 4 }}>
        <Pressable
          onPress={() => {
            if (!canDelete || remove.isPending) return;
            setError(null);
            remove.mutate();
          }}
          disabled={!canDelete || remove.isPending}
          style={({ pressed }) => ({
            height: 52,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            backgroundColor: t.danger,
            opacity: !canDelete ? 0.4 : pressed ? 0.9 : 1,
          })}
        >
          {remove.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="trash-outline" size={19} color="#fff" />
              <Txt color="#fff" style={{ fontFamily: Font.semibold, fontSize: 16 }}>
                Delete my account
              </Txt>
            </>
          )}
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          disabled={remove.isPending}
          style={({ pressed }) => ({ height: 50, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}
        >
          <Txt style={{ fontFamily: Font.semibold }} tone="ink2">
            Cancel
          </Txt>
        </Pressable>
      </View>
    </CollapsibleScreen>
  );
}
