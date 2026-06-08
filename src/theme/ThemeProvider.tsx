import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import { ACCENTS, makeTheme, Theme } from './colors';

type Appearance = 'system' | 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  appearance: Appearance;
  accent: string;
  setAppearance: (a: Appearance) => void;
  setAccent: (c: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORE_KEY = 'spendes.theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [appearance, setAppearanceState] = useState<Appearance>('system');
  const [accent, setAccentState] = useState<string>(ACCENTS[0]);

  // hydrate persisted prefs
  useEffect(() => {
    AsyncStorage.getItem(STORE_KEY).then((raw) => {
      if (!raw) return;
      try {
        const v = JSON.parse(raw) as { appearance?: Appearance; accent?: string };
        if (v.appearance) setAppearanceState(v.appearance);
        if (v.accent) setAccentState(v.accent);
      } catch {
        // ignore malformed prefs
      }
    });
  }, []);

  const persist = (next: { appearance?: Appearance; accent?: string }) => {
    AsyncStorage.setItem(
      STORE_KEY,
      JSON.stringify({ appearance, accent, ...next }),
    ).catch(() => {});
  };

  const setAppearance = (a: Appearance) => {
    setAppearanceState(a);
    persist({ appearance: a });
  };
  const setAccent = (c: string) => {
    setAccentState(c);
    persist({ accent: c });
  };

  const dark = appearance === 'system' ? system === 'dark' : appearance === 'dark';
  const theme = useMemo(() => makeTheme(accent, dark), [accent, dark]);

  const value = useMemo(
    () => ({ theme, appearance, accent, setAppearance, setAccent }),
    [theme, appearance, accent],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx.theme;
}

export function useThemeControls(): Omit<ThemeContextValue, 'theme'> {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeControls must be used within ThemeProvider');
  const { theme: _theme, ...rest } = ctx;
  return rest;
}
