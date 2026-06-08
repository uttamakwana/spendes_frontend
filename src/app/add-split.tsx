import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { CreateSplitBody, SplitStrategy } from '@/api';
import { errorMessage } from '@/api';
import {
  useCreateFriendSplit,
  useCreateGroupSplit,
  useFriend,
  useFriends,
  useGroup,
  useGroups,
} from '@/features/hooks';
import { money } from '@/lib/money';
import { hexA, useTheme } from '@/theme';
import { Font, tabularNums } from '@/theme/fonts';
import {
  Avatar,
  Button,
  Card,
  IconButton,
  MoneyText,
  Screen,
  Segmented,
  Skeleton,
  Txt,
  TopBar,
} from '@/ui';

interface Member {
  id: string;
  name: string;
  me?: boolean;
}

export default function AddSplit() {
  const params = useLocalSearchParams<{ groupId?: string; friendId?: string; amount?: string; category?: string; note?: string }>();
  const [groupId, setGroupId] = useState<string | undefined>(params.groupId);
  const [friendId, setFriendId] = useState<string | undefined>(params.friendId);

  if (!groupId && !friendId) {
    return <TargetPicker onGroup={setGroupId} onFriend={setFriendId} />;
  }
  return (
    <SplitEditor
      groupId={groupId}
      friendId={friendId}
      initialAmount={parseInt(params.amount ?? '0', 10) || 0}
      initialNote={params.note || params.category || ''}
    />
  );
}

// ── pick a group or friend to split with ────────────────────────────────────
function TargetPicker({ onGroup, onFriend }: { onGroup: (id: string) => void; onFriend: (id: string) => void }) {
  const t = useTheme();
  const groups = useGroups();
  const friends = useFriends();
  return (
    <Screen>
      <TopBar title="Split with" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
        <Txt variant="caption" tone="ink2" style={{ fontFamily: Font.semibold, paddingHorizontal: 4 }}>
          Groups
        </Txt>
        {(groups.data?.items ?? []).map((g) => (
          <Card key={g.id} onPress={() => onGroup(g.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: hexA(t.accent, 0.14), alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="people" size={20} color={t.accent} />
            </View>
            <Txt variant="headline" style={{ flex: 1 }}>
              {g.name}
            </Txt>
            <Ionicons name="chevron-forward" size={18} color={t.ink3} />
          </Card>
        ))}
        <Txt variant="caption" tone="ink2" style={{ fontFamily: Font.semibold, paddingHorizontal: 4, marginTop: 10 }}>
          Friends
        </Txt>
        {(friends.data?.friends ?? []).map((f) => (
          <Card key={f.friendshipId} onPress={() => onFriend(f.friendshipId)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Avatar name={f.displayName} seed={f.friendMemberId} size={42} />
            <Txt variant="headline" style={{ flex: 1 }}>
              {f.displayName}
            </Txt>
            <Ionicons name="chevron-forward" size={18} color={t.ink3} />
          </Card>
        ))}
        {(groups.data?.items.length ?? 0) === 0 && (friends.data?.friends.length ?? 0) === 0 && (
          <Txt tone="ink3" variant="caption" center style={{ paddingVertical: 24 }}>
            Create a group or add a friend first.
          </Txt>
        )}
      </ScrollView>
    </Screen>
  );
}

// ── the split editor ─────────────────────────────────────────────────────────
function SplitEditor({
  groupId,
  friendId,
  initialAmount,
  initialNote,
}: {
  groupId?: string;
  friendId?: string;
  initialAmount: number;
  initialNote: string;
}) {
  const t = useTheme();
  const router = useRouter();
  const group = useGroup(groupId ?? '');
  const friend = useFriend(friendId ?? '');
  const createGroupSplit = useCreateGroupSplit(groupId ?? '');
  const createFriendSplit = useCreateFriendSplit(friendId ?? '');

  const members: Member[] = useMemo(() => {
    if (groupId && group.data) {
      return group.data.members
        .filter((m) => m.status !== 'removed')
        .map((m) => ({ id: m.id, name: m.isYou ? 'You' : m.displayName, me: m.isYou }));
    }
    if (friendId && friend.data) {
      return [
        { id: friend.data.myMemberId, name: 'You', me: true },
        { id: friend.data.friendMemberId, name: friend.data.displayName },
      ];
    }
    return [];
  }, [groupId, friendId, group.data, friend.data]);

  const loading = (groupId && group.isLoading) || (friendId && friend.isLoading);

  const [amount, setAmount] = useState(String(initialAmount || ''));
  const [note, setNote] = useState(initialNote);
  const [strategy, setStrategy] = useState<SplitStrategy>('equal');
  const [payer, setPayer] = useState<string | null>(null);
  const [included, setIncluded] = useState<Record<string, boolean>>({});
  const [exact, setExact] = useState<Record<string, string>>({});
  const [pct, setPct] = useState<Record<string, string>>({});
  const [shares, setShares] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  // initialize defaults once members load
  const ready = members.length > 0;
  const me = members.find((m) => m.me);
  const effPayer = payer ?? me?.id ?? members[0]?.id;
  React.useEffect(() => {
    if (ready && Object.keys(included).length === 0) {
      const inc: Record<string, boolean> = {};
      const sh: Record<string, number> = {};
      members.forEach((m) => {
        inc[m.id] = true;
        sh[m.id] = 1;
      });
      setIncluded(inc);
      setShares(sh);
    }
  }, [ready, members, included]);

  const amt = parseInt(amount, 10) || 0;
  const activeMembers = members.filter((m) => included[m.id]);

  const { shareOf, remainder, valid, remainderLabel } = useMemo(() => {
    const shareOf: Record<string, number> = {};
    let remainder = 0;
    let valid = false;
    let remainderLabel = '';
    if (strategy === 'equal') {
      const n = activeMembers.length || 1;
      const base = Math.floor((amt * 100) / n) / 100;
      activeMembers.forEach((m) => (shareOf[m.id] = base));
      const diff = +(amt - base * n).toFixed(2);
      if (activeMembers[0]) shareOf[activeMembers[0].id] = +(base + diff).toFixed(2);
      valid = activeMembers.length > 0 && amt > 0;
    } else if (strategy === 'exact') {
      const sum = members.reduce((s, m) => s + (parseFloat(exact[m.id]) || 0), 0);
      members.forEach((m) => (shareOf[m.id] = parseFloat(exact[m.id]) || 0));
      remainder = +(amt - sum).toFixed(2);
      valid = Math.abs(remainder) < 0.01 && amt > 0;
      remainderLabel = `${money(Math.abs(remainder))} left`;
    } else if (strategy === 'percentage') {
      const sum = members.reduce((s, m) => s + (parseFloat(pct[m.id]) || 0), 0);
      members.forEach((m) => (shareOf[m.id] = +((amt * (parseFloat(pct[m.id]) || 0)) / 100).toFixed(2)));
      remainder = +(100 - sum).toFixed(1);
      valid = Math.abs(remainder) < 0.1 && amt > 0;
      remainderLabel = `${remainder}% left`;
    } else {
      const totalShares = members.reduce((s, m) => s + (included[m.id] ? shares[m.id] || 0 : 0), 0) || 1;
      members.forEach((m) => (shareOf[m.id] = included[m.id] ? +((amt * (shares[m.id] || 0)) / totalShares).toFixed(2) : 0));
      valid = totalShares > 0 && amt > 0;
    }
    return { shareOf, remainder, valid, remainderLabel };
  }, [strategy, members, activeMembers, exact, pct, shares, included, amt]);

  const save = () => {
    if (!valid || !effPayer) return;
    setError(null);
    const splits: CreateSplitBody['splits'] = members
      .filter((m) => {
        if (strategy === 'exact') return (parseFloat(exact[m.id]) || 0) > 0;
        if (strategy === 'percentage') return (parseFloat(pct[m.id]) || 0) > 0;
        return included[m.id];
      })
      .map((m) => {
        if (strategy === 'exact') return { memberId: m.id, exactAmount: parseFloat(exact[m.id]) || 0 };
        if (strategy === 'percentage') return { memberId: m.id, percentage: parseFloat(pct[m.id]) || 0 };
        if (strategy === 'shares') return { memberId: m.id, shares: shares[m.id] || 0 };
        return { memberId: m.id };
      });
    const body: CreateSplitBody = {
      description: note || 'Split expense',
      amount: amt,
      splitStrategy: strategy,
      paidBy: [{ memberId: effPayer, amount: amt }],
      splits,
    };
    const opts = {
      onSuccess: () => router.replace(groupId ? `/groups/${groupId}` : `/friends/${friendId}`),
      onError: (e: unknown) => setError(errorMessage(e)),
    };
    if (groupId) createGroupSplit.mutate(body, opts);
    else createFriendSplit.mutate(body, opts);
  };

  const saving = createGroupSplit.isPending || createFriendSplit.isPending;

  if (loading || !ready) {
    return (
      <Screen>
        <TopBar title="Split expense" />
        <View style={{ padding: 16, gap: 10 }}>
          <Skeleton height={60} radius={14} />
          <Skeleton height={200} radius={14} />
        </View>
      </Screen>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.canvas2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 4, backgroundColor: t.canvas }}>
        <IconButton name="chevron-back" onPress={() => router.back()} />
        <Txt variant="headline">Split expense</Txt>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 16 }}>
        {/* amount + note */}
        <Card padding={16} style={{ alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Txt color={t.ink3} style={{ fontSize: 24, marginRight: 4 }}>
              ₹
            </Txt>
            <TextInput
              value={amount}
              onChangeText={(v) => setAmount(v.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={t.ink3}
              style={[{ fontFamily: Font.bold, fontSize: 34, color: t.ink, minWidth: 80, textAlign: 'center' }, tabularNums]}
            />
          </View>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="What was it for?"
            placeholderTextColor={t.ink3}
            style={{ marginTop: 8, fontFamily: Font.regular, fontSize: 14, color: t.ink, textAlign: 'center', minWidth: 200 }}
          />
        </Card>

        {/* payer */}
        <View>
          <Txt variant="caption" tone="ink2" style={{ fontFamily: Font.semibold, marginBottom: 8, paddingHorizontal: 2 }}>
            Paid by
          </Txt>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {members.map((m) => {
              const on = effPayer === m.id;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => setPayer(m.id)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 7,
                    paddingVertical: 6,
                    paddingLeft: 6,
                    paddingRight: 12,
                    borderRadius: 999,
                    backgroundColor: on ? t.accent : t.surface,
                    borderWidth: 1,
                    borderColor: on ? t.accent : t.line,
                  }}
                >
                  <Avatar name={m.name} seed={m.id} me={m.me} size={26} />
                  <Txt color={on ? '#fff' : t.ink} style={{ fontFamily: Font.semibold, fontSize: 13.5 }}>
                    {m.name.split(' ')[0]}
                  </Txt>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* strategy */}
        <Segmented
          options={[
            { value: 'equal', label: 'Equal' },
            { value: 'exact', label: 'Exact' },
            { value: 'percentage', label: '%' },
            { value: 'shares', label: 'Shares' },
          ]}
          value={strategy}
          onChange={(v) => setStrategy(v as SplitStrategy)}
        />

        {/* members */}
        <View style={{ backgroundColor: t.surface, borderRadius: 16, borderWidth: 1, borderColor: t.hair, overflow: 'hidden' }}>
          {members.map((m, i) => {
            const on = included[m.id];
            return (
              <View
                key={m.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 11,
                  borderBottomWidth: i === members.length - 1 ? 0 : 1,
                  borderBottomColor: t.hair,
                  opacity: on || strategy === 'exact' || strategy === 'percentage' ? 1 : 0.45,
                }}
              >
                {(strategy === 'equal' || strategy === 'shares') && (
                  <Pressable
                    onPress={() => setIncluded((s) => ({ ...s, [m.id]: !s[m.id] }))}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 7,
                      backgroundColor: on ? t.accent : 'transparent',
                      borderWidth: 1.5,
                      borderColor: on ? t.accent : t.line,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {on && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </Pressable>
                )}
                <Avatar name={m.name} seed={m.id} me={m.me} size={36} dim={!on && strategy !== 'exact' && strategy !== 'percentage'} />
                <Txt variant="callout" style={{ flex: 1, fontFamily: Font.semibold }}>
                  {m.name.split(' ')[0]}
                </Txt>

                {strategy === 'exact' && (
                  <InputBox prefix="₹" value={exact[m.id] ?? ''} onChange={(v) => setExact((s) => ({ ...s, [m.id]: v }))} width={70} />
                )}
                {strategy === 'percentage' && (
                  <InputBox suffix="%" value={pct[m.id] ?? ''} onChange={(v) => setPct((s) => ({ ...s, [m.id]: v }))} width={50} />
                )}
                {strategy === 'shares' && on && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginRight: 4 }}>
                    <Stepper onPress={() => setShares((s) => ({ ...s, [m.id]: Math.max(0, (s[m.id] || 0) - 1) }))} icon="remove" />
                    <Txt style={[{ fontFamily: Font.semibold, fontSize: 15, minWidth: 14, textAlign: 'center' }, tabularNums]}>
                      {shares[m.id] ?? 0}
                    </Txt>
                    <Stepper onPress={() => setShares((s) => ({ ...s, [m.id]: (s[m.id] || 0) + 1 }))} icon="add" accent />
                  </View>
                )}

                <Txt color={on ? t.ink : t.ink3} style={[{ fontFamily: Font.bold, fontSize: 14.5, minWidth: 64, textAlign: 'right' }, tabularNums]}>
                  {money(shareOf[m.id] || 0)}
                </Txt>
              </View>
            );
          })}
        </View>

        {error && (
          <Txt tone="danger" variant="caption" center>
            {error}
          </Txt>
        )}
      </ScrollView>

      <View style={{ backgroundColor: t.canvas, borderTopWidth: 1, borderTopColor: t.hair, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 2 }}>
          <Txt tone="ink2" variant="caption">
            {strategy === 'equal' || strategy === 'shares' ? `Split between ${activeMembers.length}` : 'Remaining'}
          </Txt>
          {valid ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="checkmark-circle" size={16} color={t.success} />
              <Txt color={t.success} style={{ fontFamily: Font.semibold }}>
                Splits add up
              </Txt>
            </View>
          ) : (
            <Txt color={t.danger} style={[{ fontFamily: Font.semibold }, tabularNums]}>
              {strategy === 'exact' || strategy === 'percentage' ? remainderLabel : 'Enter an amount'}
            </Txt>
          )}
        </View>
        <Button size="lg" icon="checkmark" disabled={!valid} loading={saving} onPress={save}>
          Save split
        </Button>
      </View>
    </SafeAreaView>
  );
}

function InputBox({ value, onChange, prefix, suffix, width }: { value: string; onChange: (v: string) => void; prefix?: string; suffix?: string; width: number }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: t.fill, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 5 }}>
      {prefix && <Txt tone="ink3" variant="callout">{prefix}</Txt>}
      <TextInput
        value={value}
        onChangeText={(v) => onChange(v.replace(/[^0-9.]/g, ''))}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor={t.ink3}
        style={[{ width, fontFamily: Font.semibold, fontSize: 14.5, color: t.ink, textAlign: 'right' }, tabularNums]}
      />
      {suffix && <Txt tone="ink3" variant="callout">{suffix}</Txt>}
    </View>
  );
}

function Stepper({ onPress, icon, accent }: { onPress: () => void; icon: 'add' | 'remove'; accent?: boolean }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: accent ? t.accentSoft : t.fill, alignItems: 'center', justifyContent: 'center' }}
    >
      <Ionicons name={icon} size={15} color={accent ? t.accent : t.ink} />
    </Pressable>
  );
}
