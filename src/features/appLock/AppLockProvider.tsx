import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, StyleSheet, View } from 'react-native';

import { hexA, useTheme } from '@/theme';
import { Button, Txt } from '@/ui';

const STORAGE_KEY = 'spendes.appLock.enabled';

interface AppLockValue {
  /** Whether app lock is currently turned on. */
  enabled: boolean;
  /** Whether the device can do biometric / device-credential auth at all. */
  isAvailable: boolean;
  /** Turn app lock on/off — authenticates first; resolves to whether the change applied. */
  setEnabled: (next: boolean) => Promise<boolean>;
}

const AppLockContext = createContext<AppLockValue | null>(null);

export function useAppLock(): AppLockValue {
  const ctx = useContext(AppLockContext);
  if (!ctx) throw new Error('useAppLock must be used within AppLockProvider');
  return ctx;
}

/** Device-credential auth is possible (biometric enrolled, or a device passcode is set). */
async function deviceCanAuth(): Promise<boolean> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && enrolled;
  } catch {
    return false;
  }
}

async function runAuth(promptMessage: string): Promise<boolean> {
  try {
    const res = await LocalAuthentication.authenticateAsync({ promptMessage, cancelLabel: 'Cancel' });
    return res.success;
  } catch {
    return false;
  }
}

/**
 * Gates the whole app behind device biometrics / passcode when "App lock" is on.
 * Locks on cold start and whenever the app returns to the foreground. The in-memory
 * cover while we read the stored flag prevents content flashing before the lock shows.
 */
export function AppLockProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabledState] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [locked, setLocked] = useState(false);
  const [ready, setReady] = useState(false);
  const promptingRef = useRef(false);
  const wentBackground = useRef(false);

  // Load the saved flag + device capability on mount.
  useEffect(() => {
    let active = true;
    (async () => {
      const [available, stored] = await Promise.all([
        deviceCanAuth(),
        AsyncStorage.getItem(STORAGE_KEY).catch(() => null),
      ]);
      if (!active) return;
      const on = available && stored === '1';
      setIsAvailable(available);
      setEnabledState(on);
      setLocked(on);
      setReady(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  const promptUnlock = useCallback(async () => {
    if (promptingRef.current) return;
    promptingRef.current = true;
    try {
      // Safety net: if biometrics were removed after enabling, don't trap the user.
      if (!(await deviceCanAuth())) {
        setLocked(false);
        return;
      }
      if (await runAuth('Unlock Spendes')) setLocked(false);
    } finally {
      promptingRef.current = false;
    }
  }, []);

  // Auto-prompt as soon as the lock screen is shown.
  useEffect(() => {
    if (ready && locked) void promptUnlock();
  }, [ready, locked, promptUnlock]);

  // Re-lock after a real trip to the background (ignores transient iOS
  // active→inactive→active peeks like Notification Center or the app switcher).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'background') {
        wentBackground.current = true;
      } else if (next === 'active') {
        if (wentBackground.current && enabled) setLocked(true);
        wentBackground.current = false;
      }
    });
    return () => sub.remove();
  }, [enabled]);

  const setEnabled = useCallback(async (next: boolean): Promise<boolean> => {
    if (!(await deviceCanAuth())) {
      setIsAvailable(false);
      return false;
    }
    setIsAvailable(true);
    // Require auth for either direction so the setting can't be flipped by someone
    // holding an already-open phone.
    const okAuth = await runAuth(next ? 'Confirm to turn on App Lock' : 'Confirm to turn off App Lock');
    if (!okAuth) return false;
    await AsyncStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    setEnabledState(next);
    return true;
  }, []);

  const value = useMemo<AppLockValue>(
    () => ({ enabled, isAvailable, setEnabled }),
    [enabled, isAvailable, setEnabled],
  );

  return (
    <AppLockContext.Provider value={value}>
      {children}
      {(!ready || locked) && <LockOverlay showUnlock={ready && locked} onUnlock={promptUnlock} />}
    </AppLockContext.Provider>
  );
}

function LockOverlay({ showUnlock, onUnlock }: { showUnlock: boolean; onUnlock: () => void }) {
  const t = useTheme();
  return (
    <View style={[StyleSheet.absoluteFillObject, styles.overlay, { backgroundColor: t.canvas }]}>
      {showUnlock && (
        <View style={{ alignItems: 'center', paddingHorizontal: 32 }}>
          <View
            style={{
              width: 76,
              height: 76,
              borderRadius: 999,
              backgroundColor: hexA(t.accent, 0.12),
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}
          >
            <Ionicons name="lock-closed" size={36} color={t.accent} />
          </View>
          <Txt variant="title3" center>
            Spendes is locked
          </Txt>
          <Txt tone="ink2" center style={{ marginTop: 6, lineHeight: 21, maxWidth: 300 }}>
            Unlock with Face ID, fingerprint or your device passcode to continue.
          </Txt>
          <View style={{ marginTop: 24, alignSelf: 'stretch' }}>
            <Button icon="finger-print" onPress={onUnlock}>
              Unlock
            </Button>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    zIndex: 9999,
    elevation: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
