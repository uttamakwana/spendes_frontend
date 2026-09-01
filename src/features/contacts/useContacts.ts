import * as Contacts from 'expo-contacts';
import { useCallback, useState } from 'react';
import { Linking, Platform, Share } from 'react-native';

import type { CountryReference } from '@/api';
import { COUNTRIES, DEFAULT_COUNTRY } from '@/lib/countries';

export interface DeviceContact {
  id: string;
  name: string;
  /** National number, without the dial code. */
  phone: string;
  /** E.164 dial code — the contact's own where they wrote one, else the user's. */
  dialCode: string;
  /** `+15551234567` — what an SMS or an invite is actually addressed to. */
  e164: string;
}

export type ContactsStatus = 'idle' | 'loading' | 'granted' | 'denied' | 'unavailable';

/** Dial codes longest-first, so `+1` never swallows a `+91` number. */
const DIAL_CODES = [...new Set(COUNTRIES.map((c) => c.dialCode))].sort(
  (a, b) => b.length - a.length,
);

/**
 * Splits a contact's number into a dial code and a national number.
 *
 * A phone book holds numbers in every shape: `+1 (415) 555-0132`, `00 91 98765
 * 43210`, or a bare local number with no country at all. Only the first two say
 * where they are — for the third we have to assume the user's own country, which is
 * exactly what a phone does when you dial it.
 *
 * The old version kept the last 10 digits and threw the country away, which quietly
 * turned every foreign contact into an Indian one.
 */
export function parseContactNumber(
  raw: string,
  home: CountryReference,
): { dialCode: string; phone: string } | null {
  const trimmed = raw.replace(/[^\d+]/g, '');
  // `00` is the international prefix outside NANP; treat it as a `+`.
  const international = trimmed.startsWith('+')
    ? trimmed.slice(1)
    : trimmed.startsWith('00')
      ? trimmed.slice(2)
      : null;

  if (international) {
    for (const dialCode of DIAL_CODES) {
      const code = dialCode.slice(1);
      if (!international.startsWith(code)) continue;
      const national = international.slice(code.length);
      const country = COUNTRIES.find((c) => c.dialCode === dialCode);
      if (country && !country.phoneLengths.includes(national.length)) continue;
      return { dialCode, phone: national };
    }
    return null;
  }

  // No country marker: it's a local number in the user's own country. Trailing
  // digits win, because people store numbers with trunk prefixes (0 in India/UK).
  const digits = trimmed.replace(/\D/g, '');
  const length = home.phoneLengths.find((n) => digits.length >= n);
  if (!length) return null;
  return { dialCode: home.dialCode, phone: digits.slice(-length) };
}

/**
 * Permission-aware device-contacts loader (native only). `home` is the signed-in
 * user's country — the assumption applied to numbers stored without one.
 */
export function useContacts(home: CountryReference = DEFAULT_COUNTRY) {
  const [contacts, setContacts] = useState<DeviceContact[]>([]);
  const [status, setStatus] = useState<ContactsStatus>('idle');

  const load = useCallback(async () => {
    if (Platform.OS === 'web') {
      setStatus('unavailable');
      return;
    }
    setStatus('loading');
    try {
      const { status: perm } = await Contacts.requestPermissionsAsync();
      if (perm !== 'granted') {
        setStatus('denied');
        return;
      }
      const { data } = await Contacts.getContactsAsync({ fields: [Contacts.Fields.PhoneNumbers] });
      const seen = new Set<string>();
      const flat: DeviceContact[] = [];
      for (const c of data) {
        if (!c.name || !c.phoneNumbers?.length) continue;
        const parsed = parseContactNumber(c.phoneNumbers[0]?.number ?? '', home);
        if (!parsed) continue;
        const e164 = `${parsed.dialCode}${parsed.phone}`;
        if (seen.has(e164)) continue;
        seen.add(e164);
        flat.push({ id: c.id ?? e164, name: c.name, phone: parsed.phone, dialCode: parsed.dialCode, e164 });
      }
      flat.sort((a, b) => a.name.localeCompare(b.name));
      setContacts(flat);
      setStatus('granted');
    } catch {
      setStatus('denied');
    }
  }, [home]);

  return { contacts, status, load };
}

const INVITE_LINK = 'https://spendes.netlify.app';

/**
 * Open the SMS composer addressed to a contact with a prefilled invite. Addressed
 * in full E.164 so a friend abroad gets the text, rather than a wrong local number.
 */
export async function inviteByText(name: string, e164: string) {
  const first = name.split(' ')[0];
  const message = `Hi ${first}! I'm using Spendes to track and split expenses — settle up in a tap. Join me: ${INVITE_LINK}`;
  const sep = Platform.OS === 'ios' ? '&' : '?';
  const url = `sms:${e164}${sep}body=${encodeURIComponent(message)}`;
  try {
    const can = await Linking.canOpenURL(url);
    if (can) {
      await Linking.openURL(url);
      return;
    }
  } catch {
    // fall through to the share sheet
  }
  await Share.share({ message }).catch(() => {});
}
