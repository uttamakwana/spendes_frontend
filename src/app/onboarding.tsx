import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { CountryReference, PaymentHandleType } from '@/api';
import { authApi, errorMessage, referenceApi } from '@/api';
import { useAuth } from '@/auth/AuthProvider';
import { Keypad } from '@/features/auth/Keypad';
import {
  COUNTRIES,
  deviceTimezone,
  examplePhone,
  findCountry,
  formatNationalNumber,
  guessCountry,
} from '@/lib/countries';
import { PAYMENT_RAILS, RAIL_ORDER } from '@/lib/payment-rails';
import { hexA, useTheme } from '@/theme';
import { Font, tabularNums } from '@/theme/fonts';
import {
  Avatar,
  BalancePill,
  Button,
  Card,
  CategoryIcon,
  IconButton,
  MoneyText,
  Sheet,
  Txt,
  Wordmark,
} from '@/ui';

type Stage = 'intro' | 'phone' | 'otp' | 'name';



const SLIDES = [
  {
    hero: HeroSafe,
    title: 'All your money,\nfinally calm.',
    body: 'Track every payment across apps, cards and cash. See what’s truly safe to spend — at a glance.',
  },
  {
    hero: HeroSplit,
    title: 'Split without\nthe awkward.',
    body: 'Equal, exact, shares or percentages. Spendes does the math so the group stays friends.',
  },
  {
    hero: HeroSettle,
    title: 'Settle up in\none tap.',
    body: 'Simplified balances tell you exactly who pays whom — then pay them without leaving the app.',
  },
];

export default function Onboarding() {
  const t = useTheme();
  const router = useRouter();
  const { signIn } = useAuth();

  const [stage, setStage] = useState<Stage>('intro');
  const [slide, setSlide] = useState(0);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // The country decides the dial code, how many digits the number has, which
  // currency the account keeps its books in, and which settle-up rail we offer.
  const [countries, setCountries] = useState<CountryReference[]>(COUNTRIES);
  const [country, setCountry] = useState<CountryReference>(() => guessCountry());
  const [handleType, setHandleType] = useState<PaymentHandleType>(country.defaultHandle);
  const [handleValue, setHandleValue] = useState('');

  // The shipped country list works offline; this refreshes it so a build from
  // before a market opened still offers it.
  useEffect(() => {
    let alive = true;
    referenceApi
      .countries()
      .then((res) => {
        if (!alive || res.countries.length === 0) return;
        setCountries(res.countries);
        setCountry((current) => findCountry(current.code, res.countries) ?? current);
      })
      .catch(() => {
        // Offline or the endpoint is unreachable — the bundled list is fine.
      });
    return () => {
      alive = false;
    };
  }, []);
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestOtp = useMutation({
    mutationFn: () =>
      authApi.requestOtp({
        dialCode: country.dialCode,
        phoneNumber: phone,
        country: country.code,
      }),
    onSuccess: (res) => {
      setIsRegistered(res.isRegistered);
      setOtp('');
      setStage('otp');
    },
    onError: (e) => setError(errorMessage(e)),
  });

  const login = useMutation({
    mutationFn: () =>
      authApi.login({ dialCode: country.dialCode, phoneNumber: phone, country: country.code, otp }),
    onSuccess: async (res) => {
      await signIn(res);
      router.replace('/(tabs)/home');
    },
    onError: (e) => {
      setError(errorMessage(e));
      setOtp(''); // let the user re-enter a corrected code
    },
  });

  const register = useMutation({
    mutationFn: () =>
      authApi.register({
        dialCode: country.dialCode,
        phoneNumber: phone,
        country: country.code,
        // The device's zone, so "this month" means their month from day one.
        timezone: deviceTimezone(country.timezone),
        firstName,
        lastName,
        // Omitted entirely when left blank — the field is optional, and an empty
        // value would fail the server's per-rail format check.
        paymentHandle: handleValue.trim()
          ? { type: handleType, value: handleValue.trim() }
          : undefined,
        otp,
      }),
    onSuccess: async (res) => {
      await signIn(res);
      router.replace('/(tabs)/home');
    },
    onError: (e) => {
      setError(errorMessage(e));
      setOtp('');
      setStage('otp'); // send them back to fix the code
    },
  });

  const goPhone = () => {
    setError(null);
    setStage('phone');
  };

  const submitOtp = () => {
    setError(null);
    if (isRegistered) login.mutate();
    else setStage('name');
  };

  if (stage === 'intro') {
    return <Intro slide={slide} setSlide={setSlide} onSkip={goPhone} onDone={goPhone} />;
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: t.canvas }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
        <IconButton
          name="chevron-back"
          onPress={() => {
            setError(null);
            if (stage === 'phone') setStage('intro');
            else if (stage === 'otp') setStage('phone');
            else setStage('otp');
          }}
        />
      </View>

      {stage === 'phone' && (
        <PhoneStage
          phone={phone}
          setPhone={setPhone}
          country={country}
          countries={countries}
          onCountry={(next) => {
            setCountry(next);
            setPhone('');
            setHandleType(next.defaultHandle);
            setError(null);
          }}
          error={error}
          loading={requestOtp.isPending}
          onSubmit={() => {
            setError(null);
            requestOtp.mutate();
          }}
        />
      )}

      {stage === 'otp' && (
        <OtpStage
          phone={`${country.dialCode} ${formatNationalNumber(phone, country)}`}
          otp={otp}
          setOtp={setOtp}
          error={error}
          loading={login.isPending}
          onSubmit={submitOtp}
          onResend={() => requestOtp.mutate()}
        />
      )}

      {stage === 'name' && (
        <NameStage
          firstName={firstName}
          lastName={lastName}
          country={country}
          handleType={handleType}
          handleValue={handleValue}
          setFirstName={setFirstName}
          setLastName={setLastName}
          setHandleType={setHandleType}
          setHandleValue={setHandleValue}
          error={error}
          loading={register.isPending}
          onSubmit={() => {
            setError(null);
            register.mutate();
          }}
        />
      )}
    </SafeAreaView>
  );
}

// ── Intro slides ─────────────────────────────────────────────────────────────
function Intro({
  slide,
  setSlide,
  onSkip,
  onDone,
}: {
  slide: number;
  setSlide: (n: number) => void;
  onSkip: () => void;
  onDone: () => void;
}) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);

  const goTo = (i: number) => {
    scrollRef.current?.scrollTo({ x: i * width, animated: true });
    setSlide(i);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: t.canvas }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 22,
          paddingTop: 8,
        }}
      >
        <Wordmark />
        <Pressable onPress={onSkip} hitSlop={8}>
          <Txt tone="ink3" style={{ fontFamily: Font.semibold }}>
            Skip
          </Txt>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / width);
          if (i !== slide) setSlide(i);
        }}
        style={{ flex: 1 }}
      >
        {SLIDES.map((s) => {
          const SlideHero = s.hero;
          return (
            <View
              key={s.title}
              style={{ width, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}
            >
              <View style={{ height: 230, justifyContent: 'center' }}>
                <SlideHero />
              </View>
              <Txt variant="title1" center style={{ marginTop: 28 }}>
                {s.title}
              </Txt>
              <Txt tone="ink2" center style={{ marginTop: 14, maxWidth: 300, fontSize: 15.5, lineHeight: 23 }}>
                {s.body}
              </Txt>
            </View>
          );
        })}
      </ScrollView>

      <View style={{ paddingHorizontal: 24, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 7, marginBottom: 24 }}>
          {SLIDES.map((_, i) => (
            <Pressable key={i} onPress={() => goTo(i)} hitSlop={8}>
              <View
                style={{
                  height: 7,
                  width: i === slide ? 22 : 7,
                  borderRadius: 999,
                  backgroundColor: i === slide ? t.accent : t.line,
                }}
              />
            </Pressable>
          ))}
        </View>
        <Button size="lg" onPress={() => (slide < SLIDES.length - 1 ? goTo(slide + 1) : onDone())}>
          {slide < SLIDES.length - 1 ? 'Continue' : 'Get started'}
        </Button>
      </View>
    </SafeAreaView>
  );
}

// Slide 1 — "Safe to spend" tracking card
function HeroSafe() {
  const t = useTheme();
  return (
    <Card padding={20} style={{ width: 252 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            backgroundColor: t.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="wallet" size={22} color="#fff" />
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            backgroundColor: t.successBg,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 999,
          }}
        >
          <View style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: t.success }} />
          <Txt color={t.success} style={{ fontFamily: Font.semibold, fontSize: 12 }}>
            On track
          </Txt>
        </View>
      </View>
      <Txt tone="ink2" variant="caption" style={{ marginTop: 18 }}>
        Safe to spend
      </Txt>
      <MoneyText value={38420} size={32} weight="bold" style={{ marginTop: 2 }} />
      <View style={{ height: 8, borderRadius: 999, backgroundColor: t.fill2, marginTop: 14, overflow: 'hidden' }}>
        <View style={{ width: '62%', height: '100%', backgroundColor: t.accent, borderRadius: 999 }} />
      </View>
      <Txt tone="ink3" variant="micro" style={{ marginTop: 8 }}>
        after bills &amp; goals · 22 days left
      </Txt>
    </Card>
  );
}

// Slide 2 — a split expense with per-member balances
function HeroSplit() {
  const t = useTheme();
  const rows = [
    { name: 'Priya', net: 1680 },
    { name: 'Rohan', net: -640 },
    { name: 'Aisha', net: 480 },
  ];
  return (
    <Card padding={16} style={{ width: 256 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <CategoryIcon name="Food" size={38} />
        <View style={{ flex: 1 }}>
          <Txt variant="headline" numberOfLines={1}>
            Dinner — Thalassa
          </Txt>
          <Txt tone="ink3" variant="caption">
            Split 5 ways · equal
          </Txt>
        </View>
        <MoneyText value={8400} size={15} weight="bold" />
      </View>
      {rows.map((r, i) => (
        <View
          key={r.name}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 9,
            paddingVertical: 7,
            borderTopWidth: i ? 1 : 0,
            borderTopColor: t.hair,
          }}
        >
          <Avatar name={r.name} size={26} />
          <Txt variant="callout" style={{ flex: 1 }}>
            {r.name}
          </Txt>
          <BalancePill net={r.net} size="sm" showLabel={false} />
        </View>
      ))}
    </Card>
  );
}

// Slide 3 — settle up with a friend over UPI
function HeroSettle() {
  const t = useTheme();
  return (
    <Card padding={18} style={{ width: 224, alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <Avatar me name="You" size={36} ring />
        <View style={{ height: 1.5, width: 22, backgroundColor: t.line }} />
        <View
          style={{
            width: 26,
            height: 26,
            borderRadius: 999,
            backgroundColor: t.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="arrow-forward" size={15} color="#fff" />
        </View>
        <View style={{ height: 1.5, width: 22, backgroundColor: t.line }} />
        <Avatar name="Karan" size={36} ring />
      </View>
      <Txt tone="ink2" variant="caption">
        You’ll pay Karan
      </Txt>
      <MoneyText value={2280} size={26} weight="bold" style={{ marginTop: 2, marginBottom: 12 }} />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 7,
          height: 42,
          borderRadius: 12,
          backgroundColor: t.accent,
          alignSelf: 'stretch',
        }}
      >
        <Ionicons name="phone-portrait" size={18} color="#fff" />
        <Txt color="#fff" style={{ fontFamily: Font.semibold }}>
          Settle up
        </Txt>
      </View>
    </Card>
  );
}

// ── Phone stage ──────────────────────────────────────────────────────────────
function PhoneStage({
  phone,
  setPhone,
  country,
  countries,
  onCountry,
  error,
  loading,
  onSubmit,
}: {
  phone: string;
  setPhone: (s: string) => void;
  country: CountryReference;
  countries: CountryReference[];
  onCountry: (c: CountryReference) => void;
  error: string | null;
  loading: boolean;
  onSubmit: () => void;
}) {
  const t = useTheme();
  const [picker, setPicker] = useState(false);
  const [search, setSearch] = useState('');

  // How long a number may be is the country's business, not a global rule.
  const maxDigits = Math.max(...country.phoneLengths);
  const valid = country.phoneLengths.includes(phone.length);
  const display = phone ? formatNationalNumber(phone, country) : examplePhone(country);

  const matches = search.trim()
    ? countries.filter((c) => {
        const q = search.trim().toLowerCase();
        return c.name.toLowerCase().includes(q) || c.dialCode.includes(q) || c.code.toLowerCase() === q;
      })
    : countries;

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, paddingHorizontal: 28, paddingTop: 24 }}>
        <Txt variant="title1">What’s your number?</Txt>
        <Txt tone="ink2" style={{ marginTop: 10, lineHeight: 22 }}>
          We’ll text a 6-digit code to verify it’s really you. Standard rates may apply.
        </Txt>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            backgroundColor: t.fill,
            borderRadius: 14,
            paddingHorizontal: 16,
            height: 60,
            marginTop: 32,
            borderWidth: 1.5,
            borderColor: valid ? t.accent : 'transparent',
          }}
        >
          <Pressable
            onPress={() => {
              setSearch('');
              setPicker(true);
            }}
            hitSlop={8}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}
          >
            <Txt style={{ fontSize: 22 }}>{country.flag}</Txt>
            <Txt style={{ fontFamily: Font.semibold, fontSize: 19 }}>{country.dialCode}</Txt>
            <Ionicons name="chevron-down" size={15} color={t.ink3} />
          </Pressable>
          <View style={{ width: 1, height: 26, backgroundColor: t.line }} />
          <Txt
            color={phone ? t.ink : t.ink3}
            style={[{ fontFamily: Font.semibold, fontSize: 21, flex: 1, letterSpacing: 1 }, tabularNums]}
            numberOfLines={1}
          >
            {display}
          </Txt>
        </View>
        <Txt tone="ink3" variant="caption" style={{ marginTop: 8 }}>
          Your money will be tracked in {country.currency} ({country.currencySymbol}).
        </Txt>
        {error && (
          <Txt tone="danger" variant="caption" style={{ marginTop: 12 }}>
            {error}
          </Txt>
        )}
      </View>
      <Keypad
        onKey={(d) => phone.length < maxDigits && setPhone(phone + d)}
        onDelete={() => setPhone(phone.slice(0, -1))}
      />
      <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 8 }}>
        <Button size="lg" disabled={!valid} loading={loading} onPress={onSubmit}>
          Send code
        </Button>
      </View>

      <Sheet open={picker} onClose={() => setPicker(false)} title="Choose your country" scrollable snapPoints={['70%']}>
        <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search country or code"
            placeholderTextColor={t.ink3}
            autoCorrect={false}
            style={{
              backgroundColor: t.fill,
              borderRadius: 12,
              paddingHorizontal: 14,
              height: 44,
              marginBottom: 10,
              fontFamily: Font.medium,
              fontSize: 15,
              color: t.ink,
            }}
          />
          {matches.map((c) => {
            const on = c.code === country.code;
            return (
              <Pressable
                key={c.code}
                onPress={() => {
                  onCountry(c);
                  setPicker(false);
                }}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 4,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Txt style={{ fontSize: 22 }}>{c.flag}</Txt>
                <Txt style={{ flex: 1, fontFamily: on ? Font.semibold : Font.medium }} numberOfLines={1}>
                  {c.name}
                </Txt>
                <Txt tone="ink3" variant="caption" style={tabularNums}>
                  {c.dialCode}
                </Txt>
                {on && <Ionicons name="checkmark-circle" size={19} color={t.accent} />}
              </Pressable>
            );
          })}
          {matches.length === 0 && (
            <Txt tone="ink3" variant="caption" center style={{ paddingVertical: 24, lineHeight: 19 }}>
              No match. Spendes isn’t in every country yet — tell us where you are and we’ll add it.
            </Txt>
          )}
        </View>
      </Sheet>
    </View>
  );
}

// ── OTP stage ────────────────────────────────────────────────────────────────
function OtpStage({
  phone,
  otp,
  setOtp,
  error,
  loading,
  onSubmit,
  onResend,
}: {
  phone: string;
  otp: string;
  setOtp: (s: string) => void;
  error: string | null;
  loading: boolean;
  onSubmit: () => void;
  onResend: () => void;
}) {
  const t = useTheme();
  const [secs, setSecs] = useState(28);
  const submittedRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => setSecs((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (otp.length === 6 && !submittedRef.current) {
      submittedRef.current = true;
      onSubmit();
    }
    if (otp.length < 6) submittedRef.current = false;
  }, [otp, onSubmit]);

  const display = phone.replace(/(\d{5})(\d+)/, '$1 $2');

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, paddingHorizontal: 28, paddingTop: 24 }}>
        <Txt variant="title1">Enter the code</Txt>
        <Txt tone="ink2" style={{ marginTop: 10, lineHeight: 22 }}>
          Sent to <Txt color={t.ink} style={{ fontFamily: Font.semibold }}>+91 {display}</Txt>
        </Txt>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 32 }}>
          {Array.from({ length: 6 }).map((_, i) => {
            const filled = i < otp.length;
            const active = i === otp.length;
            return (
              <View
                key={i}
                style={{
                  width: 48,
                  height: 56,
                  borderRadius: 14,
                  backgroundColor: filled ? t.accentSoft : t.fill,
                  borderWidth: 1.5,
                  borderColor: active ? t.accent : filled ? hexA(t.accent, 0.3) : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Txt style={[{ fontFamily: Font.bold, fontSize: 26 }, tabularNums]}>{filled ? otp[i] : ''}</Txt>
              </View>
            );
          })}
        </View>

        {error && (
          <Txt tone="danger" variant="caption" style={{ marginTop: 16 }}>
            {error}
          </Txt>
        )}

        <View style={{ marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {secs > 0 ? (
            <Txt tone="ink2">
              Resend code in <Txt color={t.ink} style={[{ fontFamily: Font.semibold }, tabularNums]}>0:{String(secs).padStart(2, '0')}</Txt>
            </Txt>
          ) : (
            <Pressable
              onPress={() => {
                setSecs(28);
                onResend();
              }}
            >
              <Txt tone="accent" style={{ fontFamily: Font.semibold }}>
                Resend code
              </Txt>
            </Pressable>
          )}
        </View>

        {__DEV__ && (
          <Txt tone="ink3" variant="caption" style={{ marginTop: 12 }}>
            Dev: use code 123456
          </Txt>
        )}
      </View>

      {loading && (
        <View style={{ alignItems: 'center', paddingBottom: 8 }}>
          <Txt tone="ink3" variant="caption">
            Verifying…
          </Txt>
        </View>
      )}
      <Keypad onKey={(d) => otp.length < 6 && setOtp(otp + d)} onDelete={() => setOtp(otp.slice(0, -1))} />
      <View style={{ height: 16 }} />
    </View>
  );
}

// ── Name stage (first registration) ─────────────────────────────────────────
function NameStage({
  firstName,
  lastName,
  country,
  handleType,
  handleValue,
  setFirstName,
  setLastName,
  setHandleType,
  setHandleValue,
  error,
  loading,
  onSubmit,
}: {
  firstName: string;
  lastName: string;
  country: CountryReference;
  handleType: PaymentHandleType;
  handleValue: string;
  setFirstName: (s: string) => void;
  setLastName: (s: string) => void;
  setHandleType: (t: PaymentHandleType) => void;
  setHandleValue: (s: string) => void;
  error: string | null;
  loading: boolean;
  onSubmit: () => void;
}) {
  const t = useTheme();
  const [railPicker, setRailPicker] = useState(false);
  const rail = PAYMENT_RAILS[handleType];
  const value = handleValue.trim();

  // Blank is fine (the field is optional); malformed is not, and catching it here
  // beats a server 400 at the very end of sign-up.
  const handleBad = value.length > 0 && !rail.validate(value);
  const valid = firstName.trim().length > 0 && lastName.trim().length > 0 && !handleBad;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 28, paddingTop: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Txt variant="title1">Welcome! Let’s set you up.</Txt>
        <Txt tone="ink2" style={{ marginTop: 10, lineHeight: 22 }}>
          Your name is how friends will recognise you in groups and splits.
        </Txt>

        <View style={{ marginTop: 28, gap: 12 }}>
          <Field label="First name" value={firstName} onChange={setFirstName} autoFocus />
          <Field label="Last name" value={lastName} onChange={setLastName} />

          <Pressable
            onPress={() => setRailPicker(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              backgroundColor: t.fill,
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 13,
            }}
          >
            <Ionicons name={rail.icon} size={19} color={t.ink2} />
            <View style={{ flex: 1 }}>
              <Txt tone="ink3" variant="micro">
                How friends pay you back (optional)
              </Txt>
              <Txt style={{ fontFamily: Font.semibold, fontSize: 15, marginTop: 1 }}>{rail.label}</Txt>
            </View>
            <Ionicons name="chevron-down" size={16} color={t.ink3} />
          </Pressable>

          <Field
            label={rail.fieldLabel}
            value={handleValue}
            onChange={setHandleValue}
            placeholder={rail.placeholder}
            autoCapitalize="none"
          />
        </View>

        <Txt
          tone={handleBad ? 'danger' : 'ink3'}
          variant="caption"
          style={{ marginTop: 10, lineHeight: 18 }}
        >
          {handleBad
            ? `That doesn’t look like a ${rail.label} handle — try ${rail.placeholder}.`
            : `${rail.hint} You can add or change this later in your profile.`}
        </Txt>

        {error && (
          <Txt tone="danger" variant="caption" style={{ marginTop: 16 }}>
            {error}
          </Txt>
        )}

        <View style={{ flex: 1, minHeight: 24 }} />
        <Button size="lg" disabled={!valid} loading={loading} onPress={onSubmit}>
          Create account
        </Button>
        <View style={{ height: 16 }} />
      </ScrollView>

      <Sheet open={railPicker} onClose={() => setRailPicker(false)} title="How should friends pay you?">
        <View style={{ paddingHorizontal: 20, paddingBottom: 16, gap: 8 }}>
          <Txt tone="ink2" variant="caption" style={{ lineHeight: 19, paddingBottom: 4 }}>
            Most people in {country.name} use {PAYMENT_RAILS[country.defaultHandle].label}. Skip it
            entirely if you’d rather just settle up in person.
          </Txt>
          {RAIL_ORDER.map((type) => {
            const option = PAYMENT_RAILS[type];
            const on = type === handleType;
            return (
              <Pressable
                key={type}
                onPress={() => {
                  setHandleType(type);
                  setHandleValue('');
                  setRailPicker(false);
                }}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 13,
                  paddingHorizontal: 14,
                  borderRadius: 14,
                  backgroundColor: pressed ? t.fill : t.surface,
                  borderWidth: 1,
                  borderColor: on ? hexA(t.accent, 0.4) : t.line,
                })}
              >
                <Ionicons name={option.icon} size={19} color={on ? t.accent : t.ink2} />
                <View style={{ flex: 1 }}>
                  <Txt style={{ fontFamily: Font.medium }}>{option.label}</Txt>
                  <Txt tone="ink3" variant="micro" style={{ marginTop: 1 }}>
                    {option.hint}
                  </Txt>
                </View>
                {on && <Ionicons name="checkmark-circle" size={20} color={t.accent} />}
              </Pressable>
            );
          })}
        </View>
      </Sheet>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChange,
  autoFocus,
  placeholder,
  autoCapitalize = 'words',
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  autoFocus?: boolean;
  placeholder?: string;
  autoCapitalize?: 'none' | 'words';
}) {
  const t = useTheme();
  return (
    <View style={{ backgroundColor: t.fill, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10 }}>
      <Txt tone="ink3" variant="micro">
        {label}
      </Txt>
      <TextInputField
        value={value}
        onChange={onChange}
        autoFocus={autoFocus}
        placeholder={placeholder}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

function TextInputField({
  value,
  onChange,
  autoFocus,
  placeholder,
  autoCapitalize = 'words',
}: {
  value: string;
  onChange: (s: string) => void;
  autoFocus?: boolean;
  placeholder?: string;
  autoCapitalize?: 'none' | 'words';
}) {
  const t = useTheme();
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      autoFocus={autoFocus}
      autoCapitalize={autoCapitalize}
      autoCorrect={autoCapitalize === 'none' ? false : undefined}
      placeholder={placeholder}
      placeholderTextColor={t.ink3}
      style={{ fontFamily: Font.semibold, fontSize: 17, color: t.ink, paddingVertical: 4 }}
    />
  );
}
