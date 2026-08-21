import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';

import type { DisputeReason, NotificationDetail } from '@/api';
import { errorMessage } from '@/api';
import { useConfirmNotification, useDisputeNotification, useNotification } from '@/features/hooks';
import { money } from '@/lib/money';
import { hexA, useTheme } from '@/theme';
import { Font } from '@/theme/fonts';
import { Avatar, Button, Card, Screen, Sheet, Skeleton, Txt, TopBar } from '@/ui';

/**
 * The review screen — what a split request actually looks like from the receiving
 * end.
 *
 * Someone can add you and split with you before you have ever added them back, so
 * this is the one place that answers "who is this, what are they claiming, and what
 * are my options?" in a single view. The three honest answers sit side by side:
 * confirm it, pay it, or say it's wrong. Confirming or paying is also what makes the
 * friendship mutual — you never have to accept a stranger first just to see a bill.
 */
export default function NotificationReview() {
  const t = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: n, isLoading } = useNotification(id);

  const confirm = useConfirmNotification();
  const dispute = useDisputeNotification();
  const [flagOpen, setFlagOpen] = useState(false);

  const onConfirm = () =>
    confirm.mutate(id, {
      onError: (e) => Alert.alert('Couldn’t confirm', errorMessage(e)),
    });

  const onFlag = (reason: DisputeReason) => {
    setFlagOpen(false);
    dispute.mutate(
      { id, reason },
      {
        onSuccess: () =>
          Alert.alert(
            'Sent ✓',
            reason === 'dont_know_them'
              ? `We’ve told ${firstName(n)} they may have used the wrong number. Nothing was deleted — they decide what to do next.`
              : `We’ve told ${firstName(n)} so they can fix it. Nothing was deleted — the amount stays until they change it.`,
          ),
        onError: (e) => Alert.alert('Couldn’t send', errorMessage(e)),
      },
    );
  };

  const goSettle = () => {
    if (!n?.connection || !n.actions.payeeMemberId) return;
    const kind = n.connection.isDirect ? 'friend' : 'group';
    const name = encodeURIComponent(n.actor?.name ?? n.connection.name);
    // `notificationId` is what lets the settle flow close this request: paying a
    // split is agreeing with it, so we never ask again afterwards.
    router.push(
      `/settle?kind=${kind}&id=${n.connection.id}&toMemberId=${n.actions.payeeMemberId}&amount=${n.actions.payAmount}&name=${name}&notificationId=${n.id}`,
    );
  };

  const goHistory = () => {
    if (!n?.connection) return;
    router.push(
      n.connection.isDirect ? `/friends/${n.connection.id}` : `/groups/${n.connection.id}`,
    );
  };

  return (
    <Screen>
      <TopBar title="Request" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        {isLoading || !n ? (
          <View style={{ gap: 12, marginTop: 8 }}>
            <Skeleton height={120} radius={16} />
            <Skeleton height={150} radius={16} />
          </View>
        ) : (
          <>
            <Who n={n} />
            <Ask n={n} />
            {n.balance && n.connection && <Standing n={n} onPress={goHistory} />}
            <Answered n={n} />
            <Actions
              n={n}
              confirming={confirm.isPending}
              onConfirm={onConfirm}
              onPay={goSettle}
              onFlag={() => setFlagOpen(true)}
            />
          </>
        )}
      </ScrollView>

      <Sheet open={flagOpen} onClose={() => setFlagOpen(false)} title="What’s wrong?">
        <View style={{ paddingHorizontal: 20, paddingBottom: 12, gap: 8 }}>
          <Txt tone="ink2" variant="caption" style={{ lineHeight: 19, paddingBottom: 4 }}>
            We’ll pass this on to {firstName(n)}. Nothing gets deleted — they decide how to fix it.
          </Txt>
          {flagOptions(n).map((o) => (
            <Pressable
              key={o.reason}
              onPress={() => onFlag(o.reason)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 13,
                paddingHorizontal: 14,
                borderRadius: 14,
                backgroundColor: pressed ? t.fill : t.surface,
                borderWidth: 1,
                borderColor: t.line,
              })}
            >
              <Ionicons name={o.icon} size={19} color={t.ink2} />
              <Txt style={{ flex: 1, fontFamily: Font.medium }}>{o.label}</Txt>
              <Ionicons name="chevron-forward" size={16} color={t.ink3} />
            </Pressable>
          ))}
        </View>
      </Sheet>
    </Screen>
  );
}

// ── Sections ────────────────────────────────────────────────────────────────

/** Identity first: a bill from a stranger is only reviewable if you can tell who they are. */
function Who({ n }: { n: NotificationDetail }) {
  const t = useTheme();
  const actor = n.actor;
  const unknown = n.connection?.addedByThem && n.connection.consent === 'pending';
  const phone =
    actor?.dialCode && actor.phoneNumber ? `${actor.dialCode} ${actor.phoneNumber}` : undefined;

  return (
    <View style={{ alignItems: 'center', paddingTop: 8 }}>
      <Avatar name={actor?.name ?? n.actorName ?? '?'} seed={n.id} uri={actor?.avatarUrl} size={72} />
      <Txt variant="title2" style={{ marginTop: 12 }}>
        {actor?.name ?? n.actorName ?? 'Someone'}
      </Txt>
      {phone && (
        <Txt tone="ink3" variant="caption" style={{ marginTop: 3 }}>
          {phone}
        </Txt>
      )}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          marginTop: 10,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 999,
          backgroundColor: unknown ? hexA(t.warning, 0.13) : t.fill,
        }}
      >
        <Ionicons
          name={unknown ? 'person-add-outline' : 'checkmark-circle'}
          size={14}
          color={unknown ? t.warning : t.ink2}
        />
        <Txt variant="micro" color={unknown ? t.warning : t.ink2} style={{ fontFamily: Font.semibold }}>
          {unknown ? 'They added you — not in your friends yet' : 'In your friends'}
        </Txt>
      </View>
    </View>
  );
}

/** What they're claiming, with your share as the headline — that's the number you're answering. */
function Ask({ n }: { n: NotificationDetail }) {
  const t = useTheme();
  const e = n.expense;

  if (!e) {
    return (
      <Card style={{ marginTop: 20 }}>
        <Txt variant="callout" style={{ fontFamily: Font.semibold }}>
          {n.title}
        </Txt>
        <Txt tone="ink2" variant="caption" style={{ marginTop: 4, lineHeight: 19 }}>
          {n.body}
        </Txt>
        {n.connection && !n.connection.isDirect && (
          <Txt tone="ink3" variant="micro" style={{ marginTop: 8 }}>
            {n.connection.memberCount} people in {n.connection.name}
          </Txt>
        )}
      </Card>
    );
  }

  const splitLabel =
    e.splitStrategy === 'equal'
      ? `split equally between ${e.splitCount}`
      : `${e.splitStrategy} split between ${e.splitCount}`;

  return (
    <Card style={{ marginTop: 20 }}>
      <Txt tone="ink3" variant="micro" style={{ fontFamily: Font.semibold, letterSpacing: 0.4 }}>
        YOUR SHARE
      </Txt>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 2 }}>
        <Txt style={{ fontFamily: Font.bold, fontSize: 34 }}>{money(e.myShare)}</Txt>
        <Txt tone="ink3" variant="caption" style={{ paddingBottom: 7 }}>
          of {money(e.amount)}
        </Txt>
      </View>

      <View style={{ height: 1, backgroundColor: t.hair, marginVertical: 14 }} />

      <Row icon="receipt-outline" label="For" value={e.description} />
      <Row icon="card-outline" label="Paid by" value={e.paidByName} />
      <Row icon="pie-chart-outline" label="Split" value={splitLabel} />
      <Row icon="calendar-outline" label="On" value={format(new Date(e.spentAt), 'd MMM yyyy')} last />
      {e.notes ? (
        <Txt tone="ink2" variant="caption" style={{ marginTop: 10, lineHeight: 19 }}>
          “{e.notes}”
        </Txt>
      ) : null}
    </Card>
  );
}

/** Where the two of you stand overall — context for whether paying now makes sense. */
function Standing({ n, onPress }: { n: NotificationDetail; onPress: () => void }) {
  const t = useTheme();
  const net = n.balance?.myNet ?? 0;
  const name = firstName(n);
  const settled = net === 0;
  const owed = net > 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 14,
        backgroundColor: settled ? t.fill : owed ? t.successBg : t.dangerBg,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Txt variant="caption" tone="ink2" style={{ flex: 1 }}>
        {settled ? (
          `You and ${name} are all settled up`
        ) : (
          <>
            {owed ? `${name} owes you ` : `In total you owe ${name} `}
            <Txt
              color={owed ? t.success : t.danger}
              style={{ fontFamily: Font.bold, fontSize: 15 }}
            >
              {money(Math.abs(net))}
            </Txt>
          </>
        )}
      </Txt>
      <Ionicons name="chevron-forward" size={16} color={t.ink3} />
    </Pressable>
  );
}

/** The already-answered banner, so a reviewed item never looks like an open question. */
function Answered({ n }: { n: NotificationDetail }) {
  const t = useTheme();
  if (!n.isConfirmed && !n.isDisputed) return null;

  const flagged = n.isDisputed;
  const color = flagged ? t.danger : t.success;

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 10,
        marginTop: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 14,
        backgroundColor: hexA(color, t.dark ? 0.14 : 0.09),
      }}
    >
      <Ionicons name={flagged ? 'flag' : 'checkmark-circle'} size={18} color={color} />
      <Txt variant="caption" tone="ink2" style={{ flex: 1, lineHeight: 19 }}>
        {!flagged
          ? `You confirmed this. ${firstName(n)} has been told.`
          : n.expense
            ? `You flagged this${reasonLabel(n.disputeReason)}. We’ve told ${firstName(n)} — the amount stays until they change it.`
            : `You told us you don’t know ${firstName(n)}. They’ve been told they may have the wrong number.`}
      </Txt>
    </View>
  );
}

/**
 * The three answers. Confirming leads when the connection is still unanswered —
 * agreeing costs nothing and moves no money — and paying leads once it isn't.
 */
function Actions({
  n,
  confirming,
  onConfirm,
  onPay,
  onFlag,
}: {
  n: NotificationDetail;
  confirming: boolean;
  onConfirm: () => void;
  onPay: () => void;
  onFlag: () => void;
}) {
  const t = useTheme();
  const a = n.actions;
  const owes = a.payAmount > 0;
  const confirmFirst = a.canConfirm;

  if (!a.canConfirm && !a.canDispute && !owes) {
    return null;
  }

  const confirmBtn = a.canConfirm ? (
    <Button
      key="confirm"
      size="lg"
      variant={confirmFirst ? 'primary' : 'soft'}
      icon="checkmark"
      loading={confirming}
      onPress={onConfirm}
    >
      Looks right
    </Button>
  ) : null;

  const payBtn = a.canPay ? (
    <Button
      key="pay"
      size="lg"
      variant={confirmFirst ? 'soft' : 'primary'}
      icon="phone-portrait"
      onPress={onPay}
    >
      Pay {money(a.payAmount)} via UPI
    </Button>
  ) : null;

  const markBtn =
    a.canMarkPaid && !a.canPay ? (
      <Button key="mark" size="lg" variant="outline" icon="checkmark-done" onPress={onPay}>
        Settle {money(a.payAmount)}
      </Button>
    ) : a.canMarkPaid ? (
      <Button key="mark" size="lg" variant="outline" onPress={onPay}>
        I’ve already paid
      </Button>
    ) : null;

  return (
    <View style={{ marginTop: 22, gap: 10 }}>
      {confirmFirst ? [confirmBtn, payBtn, markBtn] : [payBtn, markBtn, confirmBtn]}

      {a.canConfirm && (
        <Txt tone="ink3" variant="micro" center style={{ lineHeight: 17, paddingHorizontal: 12 }}>
          Confirming just tells {firstName(n)} you agree — it doesn’t send any money.
        </Txt>
      )}

      {a.payBlockedReason && owes && (
        <Txt tone="ink3" variant="micro" center style={{ lineHeight: 17 }}>
          {a.payBlockedReason}, so you can only record a payment you made yourself.
        </Txt>
      )}

      {a.canDispute && (
        <Pressable onPress={onFlag} style={{ alignItems: 'center', paddingVertical: 12 }}>
          <Txt color={t.danger} variant="caption" style={{ fontFamily: Font.semibold }}>
            This isn’t right
          </Txt>
        </Pressable>
      )}
    </View>
  );
}

// ── Bits ────────────────────────────────────────────────────────────────────

function Row({
  icon,
  label,
  value,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  last?: boolean;
}) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingBottom: last ? 0 : 10,
      }}
    >
      <Ionicons name={icon} size={16} color={t.ink3} />
      <Txt tone="ink3" variant="caption" style={{ width: 62 }}>
        {label}
      </Txt>
      <Txt variant="caption" style={{ flex: 1, fontFamily: Font.medium }} numberOfLines={2}>
        {value}
      </Txt>
    </View>
  );
}

const firstName = (n?: NotificationDetail): string =>
  (n?.actor?.name ?? n?.actorName ?? 'them').split(' ')[0];

/** A friend request has different failure modes than a split, so it gets different reasons. */
function flagOptions(
  n?: NotificationDetail,
): { reason: DisputeReason; label: string; icon: keyof typeof Ionicons.glyphMap }[] {
  const dontKnow = {
    reason: 'dont_know_them' as const,
    label: 'I don’t know this person',
    icon: 'help-circle-outline' as const,
  };

  if (!n?.expense) {
    return [dontKnow, { reason: 'other', label: 'Something else', icon: 'ellipsis-horizontal' }];
  }

  return [
    { reason: 'not_mine', label: 'I wasn’t part of this', icon: 'close-circle-outline' },
    { reason: 'wrong_amount', label: 'The amount is wrong', icon: 'calculator-outline' },
    { reason: 'already_paid', label: 'I already paid this', icon: 'checkmark-done-outline' },
    dontKnow,
  ];
}

function reasonLabel(reason?: DisputeReason): string {
  switch (reason) {
    case 'not_mine':
      return ' as not yours';
    case 'wrong_amount':
      return ' as the wrong amount';
    case 'already_paid':
      return ' as already paid';
    case 'dont_know_them':
      return ' as someone you don’t know';
    default:
      return '';
  }
}
