import React, { useEffect, useRef, useState } from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { money } from '@/lib/money';
import { useTheme } from '@/theme';
import { Font, tabularNums } from '@/theme/fonts';

export interface MoneyTextProps {
  value: number;
  size?: number;
  weight?: keyof typeof Font;
  color?: string;
  /** Color positive green / keep negative neutral, and prefix +/−. */
  sign?: boolean;
  paise?: boolean;
  dim?: boolean;
  /** Count up to the value (and between value changes). For hero/summary figures. */
  animate?: boolean;
  /** Render in this currency instead of the viewer's — a group settling in its own. */
  currency?: string | null;
  style?: StyleProp<TextStyle>;
}

const DURATION = 650;
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

/**
 * Drives `display` from its previous value up to `value` over ~650ms with a
 * requestAnimationFrame loop (opt-in via `animate`, and skipped under Reduce
 * Motion). Kept opt-in so list rows stay static and cheap — reserve it for the
 * few hero/summary numbers.
 */
function useCountUp(value: number, enabled: boolean): number {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(enabled && !reduce ? 0 : value);
  const displayRef = useRef(display);
  displayRef.current = display;

  useEffect(() => {
    if (!enabled || reduce) {
      setDisplay(value);
      return;
    }
    const from = displayRef.current;
    const to = value;
    if (from === to) return;

    let raf = 0;
    let start: number | null = null;
    const tick = (ts: number) => {
      if (start === null) start = ts;
      const p = Math.min(1, (ts - start) / DURATION);
      setDisplay(from + (to - from) * easeOutCubic(p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, enabled, reduce]);

  return display;
}

export function MoneyText({
  value,
  size = 16,
  weight = 'semibold',
  color,
  sign = false,
  paise = false,
  dim = false,
  animate = false,
  currency,
  style,
}: MoneyTextProps) {
  const t = useTheme();
  const display = useCountUp(value, animate);

  // Color is resolved from the final `value` (not the animating `display`) so it
  // stays stable while counting.
  let resolved = color;
  if (!resolved) {
    if (sign && value > 0) resolved = t.success;
    else if (sign && value < 0) resolved = t.ink;
    else resolved = dim ? t.ink2 : t.ink;
  }
  return (
    <Text
      style={[
        {
          fontFamily: Font[weight],
          fontSize: size,
          color: resolved,
          letterSpacing: size >= 28 ? -1 : -0.3,
        },
        tabularNums,
        style,
      ]}
    >
      {money(display, { sign, paise, currency })}
    </Text>
  );
}
