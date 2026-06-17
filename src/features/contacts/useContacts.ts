import * as Contacts from 'expo-contacts';
import { useCallback, useState } from 'react';
import { Linking, Platform, Share } from 'react-native';

export interface DeviceContact {
  id: string;
  name: string;
  /** 10-digit national number (India). */
  phone: string;
}

export type ContactsStatus = 'idle' | 'loading' | 'granted' | 'denied' | 'unavailable';

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

/** Permission-aware device-contacts loader (native only). */
export function useContacts() {
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
        const phone = normalizePhone(c.phoneNumbers[0]?.number ?? '');
        if (phone.length !== 10 || seen.has(phone)) continue;
        seen.add(phone);
        flat.push({ id: c.id ?? phone, name: c.name, phone });
      }
      flat.sort((a, b) => a.name.localeCompare(b.name));
      setContacts(flat);
      setStatus('granted');
    } catch {
      setStatus('denied');
    }
  }, []);

  return { contacts, status, load };
}

const INVITE_LINK = 'https://spendes.netlify.app';

/** Open the SMS composer addressed to a contact with a prefilled invite. */
export async function inviteByText(name: string, phone: string) {
  const first = name.split(' ')[0];
  const message = `Hi ${first}! I'm using Spendes to track and split expenses — settle up over UPI in a tap. Join me: ${INVITE_LINK}`;
  const sep = Platform.OS === 'ios' ? '&' : '?';
  const url = `sms:+91${phone}${sep}body=${encodeURIComponent(message)}`;
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
