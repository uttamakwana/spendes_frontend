import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';

import type { PersonBalance } from '@/api';
import { useBalances } from '@/features/hooks';
import { money } from '@/lib/money';
import { useRefresh } from '@/lib/useRefresh';
import { hexA, useTheme } from '@/theme';
import { Font } from '@/theme/fonts';
import { Avatar, Card, CollapsibleScreen, EmptyState, MoneyText, Skeleton, Txt } from '@/ui';

/**
 * Who owes whom, across everything.
 *
 * A friendship total on its own was never the real answer: rent you fronted for a
 * flat is owed to you just as much as a one-on-one loan, and the same person can
 * owe you in one group while you owe them in another. This nets it per person and
 * shows the working, so "how much do I owe Rahul" has one number and an
 * explanation.
 *
 * Balances are lifetime, not this month — a debt from March is still a debt in
 * September.
 */
export default function Balances() {
  const t = useTheme();
  const router = useRouter();
  const { data, isLoading, refetch } = useBalances();
  const { refreshing, onRefresh } = useRefresh([{ refetch }]);

  const people = data?.people ?? [];
  const owedTo = people.filter((p) => p.net > 0);
  const owedBy = people.filter((p) => p.net < 0);

  return (
    <CollapsibleScreen
      title="Balances"
      subtitle="Everything outstanding, across friends and groups"
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
    >
      {isLoading ? (
        <View style={{ gap: 10 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={72} radius={16} />
          ))}
        </View>
      ) : people.length === 0 && (data?.otherCurrency.length ?? 0) === 0 ? (
        <EmptyState
          icon="checkmark-done-outline"
          title="Everyone's settled up"
          subtitle="When you split something, what's owed shows up here — from friends and groups alike."
        />
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 6 }}>
            <Total
              label="You’re owed"
              value={data?.youAreOwed ?? 0}
              color={t.success}
              currency={data?.currency}
            />
            <Total
              label="You owe"
              value={data?.youOwe ?? 0}
              color={t.danger}
              currency={data?.currency}
            />
          </View>
          <Txt tone="ink3" variant="caption" style={{ paddingHorizontal: 4, marginBottom: 16 }}>
            Total outstanding, not just this month.
          </Txt>

          {owedBy.length > 0 && (
            <Section title="You need to pay">
              {owedBy.map((p) => (
                <PersonRow key={rowKey(p)} person={p} onOpen={openSource(router)} />
              ))}
            </Section>
          )}

          {owedTo.length > 0 && (
            <Section title="Owed to you">
              {owedTo.map((p) => (
                <PersonRow key={rowKey(p)} person={p} onOpen={openSource(router)} />
              ))}
            </Section>
          )}

          {(data?.otherCurrency.length ?? 0) > 0 && (
            <Section title="In another currency">
              <Txt tone="ink3" variant="caption" style={{ paddingBottom: 10, lineHeight: 18 }}>
                Kept separate from the totals above — Spendes doesn’t convert between
                currencies.
              </Txt>
              {data!.otherCurrency.map((p) => (
                <PersonRow key={rowKey(p)} person={p} onOpen={openSource(router)} />
              ))}
            </Section>
          )}
        </>
      )}
    </CollapsibleScreen>
  );
}

// ── Pieces ──────────────────────────────────────────────────────────────────

const rowKey = (p: PersonBalance): string =>
  p.userId ?? `${p.dialCode ?? ''}${p.phoneNumber ?? p.name}`;

/** Opening a line goes where that money actually lives, which is where you settle it. */
const openSource =
  (router: ReturnType<typeof useRouter>) =>
  (kind: 'friend' | 'group', id: string): void => {
    router.push(kind === 'friend' ? `/friends/${id}` : `/groups/${id}`);
  };

function Total({
  label,
  value,
  color,
  currency,
}: {
  label: string;
  value: number;
  color: string;
  currency?: string;
}) {
  const t = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: hexA(color, t.dark ? 0.14 : 0.09),
        borderRadius: 16,
        padding: 14,
      }}
    >
      <Txt variant="caption" tone="ink2">
        {label}
      </Txt>
      <MoneyText
        value={value}
        size={20}
        weight="bold"
        color={color}
        currency={currency}
        animate
        style={{ marginTop: 3 }}
      />
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Txt
        variant="caption"
        tone="ink2"
        style={{ fontFamily: Font.semibold, paddingHorizontal: 4, paddingBottom: 8 }}
      >
        {title}
      </Txt>
      {children}
    </View>
  );
}

/**
 * One person's net, with the groups it came from underneath. The breakdown is the
 * point: a single number is only trustworthy if you can see what it's made of.
 */
function PersonRow({
  person,
  onOpen,
}: {
  person: PersonBalance;
  onOpen: (kind: 'friend' | 'group', id: string) => void;
}) {
  const t = useTheme();
  const owed = person.net > 0;
  const first = person.name.split(' ')[0];
  // One source needs no breakdown — the row already says it.
  const showSources = person.sources.length > 1;

  return (
    <Card padding={0} style={{ marginBottom: 8, paddingHorizontal: 14, paddingVertical: 12 }}>
      <Pressable
        onPress={() => {
          const target = person.friendshipId
            ? ({ kind: 'friend', id: person.friendshipId } as const)
            : ({ kind: person.sources[0].kind, id: person.sources[0].id } as const);
          onOpen(target.kind, target.id);
        }}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <Avatar name={person.name} seed={rowKey(person)} uri={person.avatarUrl} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Txt variant="headline" numberOfLines={1}>
            {person.name}
          </Txt>
          <Txt tone="ink3" variant="caption">
            {owed ? `${first} owes you` : `You owe ${first}`}
            {!person.isRegistered ? ' · invited' : ''}
          </Txt>
        </View>
        <MoneyText
          value={Math.abs(person.net)}
          size={16}
          weight="bold"
          color={owed ? t.success : t.danger}
          currency={person.currency}
        />
      </Pressable>

      {showSources && (
        <View style={{ marginTop: 10, gap: 6 }}>
          {person.sources.map((source) => (
            <Pressable
              key={`${source.kind}:${source.id}`}
              onPress={() => onOpen(source.kind, source.id)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingVertical: 5,
                paddingHorizontal: 10,
                borderRadius: 10,
                backgroundColor: pressed ? t.fill : 'transparent',
                borderWidth: 1,
                borderColor: t.hair,
              })}
            >
              <Ionicons
                name={source.kind === 'friend' ? 'person-outline' : 'people-outline'}
                size={13}
                color={t.ink3}
              />
              <Txt tone="ink2" variant="caption" style={{ flex: 1 }} numberOfLines={1}>
                {source.kind === 'friend' ? '1-on-1' : source.name}
              </Txt>
              <Txt
                variant="caption"
                color={source.net > 0 ? t.success : t.danger}
                style={{ fontFamily: Font.semibold }}
              >
                {source.net > 0 ? '+' : '−'}
                {money(Math.abs(source.net), { currency: person.currency })}
              </Txt>
            </Pressable>
          ))}
        </View>
      )}
    </Card>
  );
}
