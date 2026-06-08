import { Ionicons } from '@expo/vector-icons';
import * as Contacts from 'expo-contacts';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { errorMessage, MemberInput } from '@/api';
import { useCreateGroup } from '@/features/hooks';
import { hexA, useTheme } from '@/theme';
import { Font } from '@/theme/fonts';
import { Avatar, Button, Card, IconButton, Screen, Sheet, Txt, TopBar } from '@/ui';

interface PickedMember extends MemberInput {
  key: string;
  displayName: string;
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export default function NewGroup() {
  const t = useTheme();
  const router = useRouter();
  const create = useCreateGroup();

  const [name, setName] = useState('');
  const [members, setMembers] = useState<PickedMember[]>([]);
  const [sheet, setSheet] = useState(false);
  const [contacts, setContacts] = useState<{ name: string; phone: string }[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const openContacts = async () => {
    setSheet(true);
    if (contacts.length) return;
    setLoadingContacts(true);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        setLoadingContacts(false);
        return;
      }
      const { data } = await Contacts.getContactsAsync({ fields: [Contacts.Fields.PhoneNumbers] });
      const flat = data
        .filter((c) => c.name && c.phoneNumbers?.length)
        .map((c) => ({ name: c.name!, phone: normalizePhone(c.phoneNumbers![0].number ?? '') }))
        .filter((c) => c.phone.length === 10);
      setContacts(flat);
    } catch {
      // ignore — empty contacts
    }
    setLoadingContacts(false);
  };

  const addMember = (m: { name: string; phone: string }) => {
    if (members.some((x) => x.phoneNumber === m.phone)) return;
    setMembers((prev) => [...prev, { key: m.phone, displayName: m.name, phoneNumber: m.phone }]);
    setSheet(false);
  };

  const removeMember = (key: string) => setMembers((prev) => prev.filter((m) => m.key !== key));

  const submit = () => {
    if (!name.trim()) return;
    setError(null);
    create.mutate(
      { name: name.trim(), members: members.map(({ phoneNumber, displayName }) => ({ phoneNumber, displayName })) },
      {
        onSuccess: (g) => router.replace(`/groups/${g.id}`),
        onError: (e) => setError(errorMessage(e)),
      },
    );
  };

  const filtered = contacts.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search),
  );

  return (
    <Screen>
      <TopBar title="New group" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <View style={{ alignItems: 'center', paddingVertical: 12 }}>
          <View style={{ width: 72, height: 72, borderRadius: 20, backgroundColor: hexA(t.accent, 0.14), alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <Ionicons name="people" size={34} color={t.accent} />
          </View>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Group name"
            placeholderTextColor={t.ink3}
            style={{ fontFamily: Font.bold, fontSize: 19, color: t.ink, textAlign: 'center', minWidth: 200 }}
          />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: 8, marginTop: 12 }}>
          <Txt variant="caption" tone="ink2" style={{ fontFamily: Font.semibold }}>
            Members ({members.length + 1})
          </Txt>
          <Pressable onPress={openContacts} hitSlop={8}>
            <Txt tone="accent" variant="caption" style={{ fontFamily: Font.semibold }}>
              Add from contacts
            </Txt>
          </Pressable>
        </View>

        <Card padding={0} style={{ paddingHorizontal: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: members.length ? 1 : 0, borderBottomColor: t.hair }}>
            <Avatar me name="You" size={40} />
            <Txt variant="headline" style={{ flex: 1 }}>
              You
            </Txt>
            <Txt tone="ink3" variant="caption">
              admin
            </Txt>
          </View>
          {members.map((m, i) => (
            <View
              key={m.key}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 12,
                borderBottomWidth: i === members.length - 1 ? 0 : 1,
                borderBottomColor: t.hair,
              }}
            >
              <Avatar name={m.displayName} seed={m.key} size={40} />
              <View style={{ flex: 1 }}>
                <Txt variant="headline">{m.displayName}</Txt>
                <Txt tone="ink3" variant="caption">
                  +91 {m.phoneNumber}
                </Txt>
              </View>
              <IconButton name="close" size={30} iconSize={16} onPress={() => removeMember(m.key)} />
            </View>
          ))}
        </Card>

        <Pressable
          onPress={openContacts}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.line, marginTop: 12 }}
        >
          <View style={{ width: 40, height: 40, borderRadius: 999, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="person-add" size={20} color={t.accent} />
          </View>
          <Txt variant="headline" tone="accent">
            Add members
          </Txt>
        </Pressable>

        {error && (
          <Txt tone="danger" variant="caption" center style={{ marginTop: 12 }}>
            {error}
          </Txt>
        )}
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, paddingBottom: 30, backgroundColor: t.canvas, borderTopWidth: 1, borderTopColor: t.hair }}>
        <Button size="lg" icon="checkmark" disabled={!name.trim()} loading={create.isPending} onPress={submit}>
          Create group
        </Button>
      </View>

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Add from contacts" scrollable snapPoints={['60%', '90%']}>
        <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: t.fill, borderRadius: 12, paddingHorizontal: 14, height: 44, marginBottom: 8 }}>
            <Ionicons name="search" size={18} color={t.ink3} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search contacts"
              placeholderTextColor={t.ink3}
              style={{ flex: 1, fontFamily: Font.regular, fontSize: 15, color: t.ink }}
            />
          </View>
          <View>
            {loadingContacts ? (
              <Txt tone="ink3" variant="caption" center style={{ paddingVertical: 24 }}>
                Loading contacts…
              </Txt>
            ) : filtered.length === 0 ? (
              <Txt tone="ink3" variant="caption" center style={{ paddingVertical: 24 }}>
                {contacts.length === 0 ? 'No contacts access. Grant permission to import.' : 'No matches.'}
              </Txt>
            ) : (
              filtered.slice(0, 60).map((c, i) => (
                <Pressable
                  key={`${c.phone}-${i}`}
                  onPress={() => addMember(c)}
                  style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, opacity: pressed ? 0.6 : 1 })}
                >
                  <Avatar name={c.name} seed={c.phone} size={40} />
                  <View style={{ flex: 1 }}>
                    <Txt variant="headline">{c.name}</Txt>
                    <Txt tone="ink3" variant="caption">
                      +91 {c.phone}
                    </Txt>
                  </View>
                  <Ionicons name="add-circle" size={24} color={t.accent} />
                </Pressable>
              ))
            )}
          </View>
        </View>
      </Sheet>
    </Screen>
  );
}
