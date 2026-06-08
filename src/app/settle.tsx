import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { errorMessage, friendsApi, splitsApi } from '@/api';
import { useRecordFriendSettlement, useRecordGroupSettlement } from '@/features/hooks';
import { money } from '@/lib/money';
import { useTheme } from '@/theme';
import { Font, tabularNums } from '@/theme/fonts';
import { Avatar, Button, IconButton, MoneyText, Txt } from '@/ui';

export default function Settle() {
  const t = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    kind?: string;
    id?: string;
    toMemberId?: string;
    fromMemberId?: string;
    amount?: string;
    name?: string;
    incoming?: string;
  }>();

  const isFriend = params.kind === 'friend';
  const id = params.id ?? '';
  const toMemberId = params.toMemberId ?? '';
  const fromMemberId = params.fromMemberId;
  const amount = parseInt(params.amount ?? '0', 10) || 0;
  const name = params.name ?? 'them';
  const incoming = params.incoming === '1';

  const [stage, setStage] = useState<'form' | 'done'>('form');
  const [error, setError] = useState<string | null>(null);

  const recordGroup = useRecordGroupSettlement(id);
  const recordFriend = useRecordFriendSettlement(id);
  const record = isFriend ? recordFriend : recordGroup;

  const intent = useMutation({
    mutationFn: () =>
      isFriend
        ? friendsApi.settlementIntent(id, { toMemberId, amount })
        : splitsApi.settlementIntent(id, { toMemberId, amount }),
  });

  const payViaUpi = async () => {
    setError(null);
    try {
      const res = await intent.mutateAsync();
      const canOpen = await Linking.canOpenURL(res.uri);
      if (canOpen) await Linking.openURL(res.uri);
      else setError('No UPI app found. You can still mark this as paid.');
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const markPaid = () => {
    setError(null);
    record.mutate(
      { toMemberId, fromMemberId, amount, method: 'upi' },
      { onSuccess: () => setStage('done'), onError: (e) => setError(errorMessage(e)) },
    );
  };

  if (stage === 'done') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.canvas, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <View style={{ width: 92, height: 92, borderRadius: 999, backgroundColor: t.success, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="checkmark" size={50} color="#fff" />
        </View>
        <Txt variant="title2" style={{ marginTop: 24 }}>
          {incoming ? 'Marked as received' : 'Payment recorded'}
        </Txt>
        <MoneyText value={incoming ? amount : -amount} sign size={18} style={{ marginTop: 6 }} />
        <Txt tone="ink2" center style={{ marginTop: 8 }}>
          You and {name.split(' ')[0]} are now{' '}
          <Txt color={t.success} style={{ fontFamily: Font.semibold }}>
            all settled up
          </Txt>
          .
        </Txt>
        <View style={{ width: '100%', marginTop: 32 }}>
          <Button size="lg" onPress={() => router.replace('/(tabs)/home')}>
            Done
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.canvas }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 4 }}>
        <IconButton name="close" onPress={() => router.back()} />
        <Txt variant="headline">Settle up</Txt>
        <View style={{ width: 38 }} />
      </View>

      <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 28, paddingTop: 32 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Avatar me name="You" size={52} ring />
          <View style={{ width: 30, height: 2, backgroundColor: t.line }} />
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 999,
              backgroundColor: incoming ? t.success : t.accent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={incoming ? 'arrow-down' : 'arrow-up'} size={17} color="#fff" />
          </View>
          <View style={{ width: 30, height: 2, backgroundColor: t.line }} />
          <Avatar name={name} seed={toMemberId} size={52} ring />
        </View>

        <Txt tone="ink2" style={{ marginTop: 16 }}>
          {incoming ? (
            <>
              You’ll mark <Txt color={t.ink} style={{ fontFamily: Font.semibold }}>{name.split(' ')[0]}</Txt>’s payment received
            </>
          ) : (
            <>
              You’re paying <Txt color={t.ink} style={{ fontFamily: Font.semibold }}>{name}</Txt>
            </>
          )}
        </Txt>

        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 18 }}>
          <Txt color={t.ink3} style={{ fontSize: 28, marginTop: 6 }}>
            ₹
          </Txt>
          <Txt style={[{ fontFamily: Font.bold, fontSize: 52 }, tabularNums]}>{money(amount).replace('₹', '')}</Txt>
        </View>

        {error && (
          <Txt tone="danger" variant="caption" center style={{ marginTop: 16 }}>
            {error}
          </Txt>
        )}
      </View>

      <View style={{ paddingHorizontal: 24, paddingBottom: 24, gap: 10 }}>
        {!incoming && (
          <Button size="lg" icon="phone-portrait" loading={intent.isPending} onPress={payViaUpi}>
            Pay {money(amount)} via UPI
          </Button>
        )}
        <Button size="lg" variant={incoming ? 'primary' : 'soft'} icon="checkmark" loading={record.isPending} onPress={markPaid}>
          {incoming ? 'Mark as received' : 'Mark as paid'}
        </Button>
      </View>
    </SafeAreaView>
  );
}
