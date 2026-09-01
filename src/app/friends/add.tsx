import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, TextInput, View } from 'react-native';

import { errorMessage } from '@/api';
import { useAuth } from '@/auth/AuthProvider';
import { DeviceContact, inviteByText, useContacts } from '@/features/contacts/useContacts';
import { useAddFriend } from '@/features/hooks';
import { DEFAULT_COUNTRY, findCountry } from '@/lib/countries';
import { useTheme } from '@/theme';
import { Font } from '@/theme/fonts';
import { Avatar, Button, Card, EmptyState, Screen, Txt, TopBar } from '@/ui';

export default function AddFriend() {
  const t = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  // Numbers stored without a country code are read as the user's own country.
  const home = findCountry(user?.country) ?? DEFAULT_COUNTRY;
  const { contacts, status, load } = useContacts(home);
  const addFriend = useAddFriend();

  const [search, setSearch] = useState('');
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q));
  }, [contacts, search]);

  const onAdd = (c: DeviceContact) => {
    setError(null);
    setPending(c.e164);
    addFriend.mutate(
      // The dial code travels with the number: a friend in the US is not a +91 one.
      { dialCode: c.dialCode, phoneNumber: c.phone, displayName: c.name },
      {
        onSuccess: () => {
          setAdded((s) => ({ ...s, [c.e164]: true }));
          setPending(null);
        },
        onError: (e) => {
          setError(errorMessage(e));
          setPending(null);
        },
      },
    );
  };

  return (
    <Screen>
      <TopBar title="Add friends" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
        {/* search */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            backgroundColor: t.surface,
            borderWidth: 1,
            borderColor: t.line,
            borderRadius: 12,
            paddingHorizontal: 14,
            height: 44,
            marginBottom: 14,
          }}
        >
          <Ionicons name="search" size={18} color={t.ink3} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search name or phone"
            placeholderTextColor={t.ink3}
            style={{ flex: 1, fontFamily: Font.regular, fontSize: 15, color: t.ink }}
          />
        </View>

        {error && (
          <Txt tone="danger" variant="caption" style={{ marginBottom: 10, paddingHorizontal: 4 }}>
            {error}
          </Txt>
        )}

        {status === 'loading' || status === 'idle' ? (
          <Txt tone="ink3" variant="caption" center style={{ paddingVertical: 40 }}>
            Loading contacts…
          </Txt>
        ) : status === 'unavailable' ? (
          <EmptyState
            icon="phone-portrait-outline"
            title="Open on your phone"
            subtitle="Contacts aren’t available on web. Use Spendes on your device to add friends from contacts."
          />
        ) : status === 'denied' ? (
          <EmptyState
            icon="lock-closed-outline"
            title="Contacts permission needed"
            subtitle="Allow contact access so you can add friends and invite people to Spendes."
            actionLabel="Open settings"
            onAction={() => Linking.openSettings()}
          />
        ) : (
          <>
            <Txt variant="caption" tone="ink2" style={{ fontFamily: Font.semibold, paddingHorizontal: 4, paddingBottom: 8 }}>
              From your contacts ({filtered.length})
            </Txt>
            <Card padding={0} style={{ paddingHorizontal: 14 }}>
              {filtered.length === 0 ? (
                <Txt tone="ink3" variant="caption" center style={{ paddingVertical: 20 }}>
                  No matching contacts.
                </Txt>
              ) : (
                filtered.slice(0, 200).map((c, i, arr) => {
                  const isAdded = added[c.e164];
                  const isPending = pending === c.e164;
                  return (
                    <View
                      key={c.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        paddingVertical: 11,
                        borderBottomWidth: i === arr.length - 1 ? 0 : 1,
                        borderBottomColor: t.hair,
                      }}
                    >
                      <Avatar name={c.name} seed={c.phone} size={42} />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Txt variant="headline" numberOfLines={1}>
                          {c.name}
                        </Txt>
                        <Txt tone="ink3" variant="caption">
                          {c.dialCode} {c.phone}
                        </Txt>
                      </View>

                      {/* invite via SMS */}
                      <Pressable
                        onPress={() => inviteByText(c.name, c.e164)}
                        hitSlop={8}
                        style={{ width: 36, height: 36, borderRadius: 999, backgroundColor: t.fill, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Ionicons name="paper-plane-outline" size={17} color={t.ink2} />
                      </Pressable>

                      {/* add as friend */}
                      {isAdded ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, height: 34 }}>
                          <Ionicons name="checkmark-circle" size={18} color={t.success} />
                          <Txt color={t.success} style={{ fontFamily: Font.semibold, fontSize: 13 }}>
                            Added
                          </Txt>
                        </View>
                      ) : (
                        <Button
                          size="sm"
                          variant="soft"
                          full={false}
                          loading={isPending}
                          onPress={() => onAdd(c)}
                          style={{ paddingHorizontal: 16, height: 34 }}
                        >
                          Add
                        </Button>
                      )}
                    </View>
                  );
                })
              )}
            </Card>

            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 16, paddingHorizontal: 4 }}>
              <Ionicons name="information-circle-outline" size={15} color={t.ink3} style={{ marginTop: 1 }} />
              <Txt tone="ink3" variant="caption" style={{ flex: 1 }}>
                Tap the arrow to text an invite. Adding someone who isn’t on Spendes yet
                creates an invited friend that links automatically when they join.
              </Txt>
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
