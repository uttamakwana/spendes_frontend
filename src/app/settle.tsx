import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { AppState, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { errorMessage, friendsApi, splitsApi } from '@/api';
import {
  useConfirmNotification,
  useRecordFriendSettlement,
  useRecordGroupSettlement,
} from '@/features/hooks';
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
    /** Set when we arrived from a split request — paying it is also confirming it. */
    notificationId?: string;
  }>();

  const isFriend = params.kind === 'friend';
  const id = params.id ?? '';
  const toMemberId = params.toMemberId ?? '';
  const fromMemberId = params.fromMemberId;
  const amount = parseInt(params.amount ?? '0', 10) || 0;
  const name = params.name ?? 'them';
  const incoming = params.incoming === '1';

  const [stage, setStage] = useState<'form' | 'confirm' | 'done'>('form');
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState<{ vpa: string; name: string } | null>(null);
  // The UPI intent's transaction reference — passed back when recording so the
  // payment is correlated and can't be double-recorded.
  const [reference, setReference] = useState<string | undefined>();
  // Set once we hand off to a UPI app; when the user returns we ask them to confirm.
  const awaitingReturn = useRef(false);

  const recordGroup = useRecordGroupSettlement(id);
  const recordFriend = useRecordFriendSettlement(id);
  const record = isFriend ? recordFriend : recordGroup;
  const confirmRequest = useConfirmNotification();

  const intent = useMutation({
    mutationFn: () =>
      isFriend
        ? friendsApi.settlementIntent(id, { toMemberId, amount })
        : splitsApi.settlementIntent(id, { toMemberId, amount }),
  });

  // We can't get a payment confirmation from a UPI app (no callback for a
  // non-merchant; iOS returns nothing). So when the user comes back to Spendes
  // after we opened their UPI app, ask whether it went through and record on yes.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active' && awaitingReturn.current) {
        awaitingReturn.current = false;
        setStage('confirm');
      }
    });
    return () => sub.remove();
  }, []);

  const payViaUpi = async () => {
    setError(null);
    setManual(null);
    try {
      const res = await intent.mutateAsync();
      setReference(res.reference);
      // Open the UPI app directly. We deliberately don't gate on Linking.canOpenURL:
      // for an undeclared scheme it returns false on real iOS devices even when a
      // UPI app is installed, which is exactly the "nothing opens" bug. openURL is
      // not subject to that, and rejects only when no app can actually handle it.
      try {
        await Linking.openURL(res.uri);
        awaitingReturn.current = true;
      } catch {
        setManual({ vpa: res.payeeVpa, name: res.payeeName });
      }
    } catch (e) {
      // Intent build failed on the server (e.g. payee hasn't added a UPI id).
      setError(errorMessage(e));
    }
  };

  const markPaid = () => {
    setError(null);
    awaitingReturn.current = false;
    record.mutate(
      { toMemberId, fromMemberId, amount, method: 'upi', reference },
      {
        onSuccess: () => {
          // Settling a request answers it: nobody should be asked "is this right?"
          // about a bill they just paid. Best-effort — the payment is what matters.
          if (params.notificationId) {
            confirmRequest.mutate(params.notificationId, { onError: () => {} });
          }
          setStage('done');
        },
        onError: (e) => setError(errorMessage(e)),
      },
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

  if (stage === 'confirm') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.canvas }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 4 }}>
          <IconButton name="close" onPress={() => router.back()} />
          <Txt variant="headline">Confirm payment</Txt>
          <View style={{ width: 38 }} />
        </View>

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 }}>
          <View style={{ width: 84, height: 84, borderRadius: 999, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="card-outline" size={40} color={t.accent} />
          </View>
          <Txt variant="title2" center style={{ marginTop: 22 }}>
            Did your payment go through?
          </Txt>
          <Txt tone="ink2" center style={{ marginTop: 8, lineHeight: 21 }}>
            Confirm you paid{' '}
            <Txt color={t.ink} style={{ fontFamily: Font.semibold }}>
              {money(amount)}
            </Txt>{' '}
            to{' '}
            <Txt color={t.ink} style={{ fontFamily: Font.semibold }}>
              {name.split(' ')[0]}
            </Txt>{' '}
            and we’ll record the settlement and update your balance.
          </Txt>
          {error && (
            <Txt tone="danger" variant="caption" center style={{ marginTop: 16 }}>
              {error}
            </Txt>
          )}
        </View>

        <View style={{ paddingHorizontal: 24, paddingBottom: 24, gap: 10 }}>
          <Button size="lg" icon="checkmark" loading={record.isPending} onPress={markPaid}>
            Yes, I’ve paid
          </Button>
          <Button size="lg" variant="ghost" onPress={() => { setError(null); setStage('form'); }}>
            Not yet
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

        {manual && (
          <View
            style={{
              marginTop: 22,
              alignSelf: 'stretch',
              backgroundColor: t.surface,
              borderWidth: 1,
              borderColor: t.line,
              borderRadius: 16,
              padding: 16,
              gap: 10,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="information-circle" size={18} color={t.accent} />
              <Txt style={{ fontFamily: Font.semibold }}>Pay manually</Txt>
            </View>
            <Txt tone="ink2" variant="caption" style={{ lineHeight: 19 }}>
              No UPI app opened automatically. Open any UPI app (GPay, PhonePe, Paytm) and send{' '}
              <Txt color={t.ink} style={{ fontFamily: Font.semibold }}>
                {money(amount)}
              </Txt>{' '}
              to this UPI ID:
            </Txt>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: t.fill,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 11,
              }}
            >
              <Text selectable style={{ fontFamily: Font.semibold, fontSize: 15, color: t.ink }}>
                {manual.vpa}
              </Text>
              <Txt tone="ink3" variant="micro">
                long-press to copy
              </Txt>
            </View>
            <Txt tone="ink3" variant="micro">
              Then tap “Mark as paid” below once you’ve sent it.
            </Txt>
          </View>
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
