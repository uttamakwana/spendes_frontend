import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Reanimated, { FadeIn, FadeInDown, useReducedMotion } from 'react-native-reanimated';

/**
 * Fades its children in on mount (optionally rising up), softening the pop when
 * content replaces a skeleton. Use `delay` to stagger a column into a cascade.
 * No-op under Reduce Motion.
 */
export function Appear({
  children,
  delay = 0,
  duration = 360,
  rise = true,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  /** Rise up while fading (off = pure fade, e.g. to avoid compounding child motion). */
  rise?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <Reanimated.View style={style}>{children}</Reanimated.View>;
  const entering = (rise ? FadeInDown : FadeIn).duration(duration).delay(delay);
  return (
    <Reanimated.View style={style} entering={entering}>
      {children}
    </Reanimated.View>
  );
}
