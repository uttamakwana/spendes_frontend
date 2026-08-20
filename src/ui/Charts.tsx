import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Reanimated, {
  Easing,
  SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';

import { useTheme } from '@/theme';
import { Font } from '@/theme/fonts';
import { Txt } from './Text';

const AnimatedCircle = Reanimated.createAnimatedComponent(Circle);
const AnimatedPath = Reanimated.createAnimatedComponent(Path);

/**
 * A shared value that eases from 0 up to `target` on mount, and animates between
 * values when `target` changes (e.g. after a refresh). Jumps straight to the
 * value under Reduce Motion. This is what gives every chart its draw-in.
 */
function useAnimatedNumber(target: number, duration = 650): SharedValue<number> {
  const reduce = useReducedMotion();
  const v = useSharedValue(reduce ? target : 0);
  useEffect(() => {
    v.value = reduce ? target : withTiming(target, { duration, easing: Easing.out(Easing.cubic) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, reduce]);
  return v;
}

/** Circular progress ring. */
export function ProgressRing({
  pct,
  size = 56,
  stroke = 6,
  color,
  track,
  children,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: React.ReactNode;
}) {
  const t = useTheme();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(1, Math.max(0, pct / 100));
  const p = useAnimatedNumber(clamped);
  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: c * (1 - p.value) }));
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={track ?? t.fill2} strokeWidth={stroke} fill="none" />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color ?? t.accent}
            strokeWidth={stroke}
            strokeDasharray={c}
            strokeLinecap="round"
            fill="none"
            animatedProps={animatedProps}
          />
        </G>
      </Svg>
      {children != null && (
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
          {children}
        </View>
      )}
    </View>
  );
}

export interface DonutSlice {
  value: number;
  color: string;
}

/** One donut arc, drawn in from zero length as `progress` rises. */
function DonutArc({
  size,
  r,
  stroke,
  color,
  len,
  offset,
  c,
  progress,
}: {
  size: number;
  r: number;
  stroke: number;
  color: string;
  len: number;
  offset: number;
  c: number;
  progress: SharedValue<number>;
}) {
  const animatedProps = useAnimatedProps(() => {
    const l = Math.max(0, len * progress.value);
    return { strokeDasharray: `${l} ${c - l}` };
  });
  return (
    <AnimatedCircle
      cx={size / 2}
      cy={size / 2}
      r={r}
      stroke={color}
      strokeWidth={stroke}
      strokeDashoffset={offset}
      fill="none"
      animatedProps={animatedProps}
    />
  );
}

/** Donut chart from weighted slices. */
export function Donut({
  data,
  size = 132,
  stroke = 22,
  gap = 0.02,
  children,
}: {
  data: DonutSlice[];
  size?: number;
  stroke?: number;
  gap?: number;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const progress = useAnimatedNumber(1);
  let acc = 0;
  const arcs = data.map((d, i) => {
    const frac = d.value / total;
    const len = Math.max(0, frac * c - gap * c);
    const offset = -acc * c;
    acc += frac;
    return { key: i, len, offset, color: d.color };
  });
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          {arcs.map((a) => (
            <DonutArc
              key={a.key}
              size={size}
              r={r}
              stroke={stroke}
              color={a.color}
              len={a.len}
              offset={a.offset}
              c={c}
              progress={progress}
            />
          ))}
        </G>
      </Svg>
      {children != null && (
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
          {children}
        </View>
      )}
    </View>
  );
}

/** A single bar that grows from zero to its height on mount. */
function Bar({ barH, color }: { barH: number; color: string }) {
  const h = useAnimatedNumber(barH);
  const style = useAnimatedStyle(() => ({ height: h.value }));
  return <Reanimated.View style={[{ width: '100%', maxWidth: 26, borderRadius: 7, backgroundColor: color }, style]} />;
}

/** Mini bar chart (e.g. spend trend). */
export function Bars({
  data,
  labels,
  height = 92,
  color,
  highlightLast = true,
}: {
  data: number[];
  labels: string[];
  height?: number;
  color?: string;
  highlightLast?: boolean;
}) {
  const t = useTheme();
  const max = Math.max(...data, 1);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height }}>
      {data.map((v, i) => {
        const hl = highlightLast ? i === data.length - 1 : false;
        const barH = Math.max(2, (v / max) * (height - 18));
        return (
          <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
            <Bar barH={barH} color={hl ? color ?? t.accent : t.fill2} />
            <Txt
              tone={hl ? 'ink' : 'ink3'}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
              style={{ fontFamily: hl ? Font.semibold : Font.medium, fontSize: 11, marginTop: 6 }}
            >
              {labels[i]}
            </Txt>
          </View>
        );
      })}
    </View>
  );
}

/** Area sparkline. */
export function Sparkline({
  data,
  width = 96,
  height = 48,
  color,
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  const t = useTheme();
  const col = color ?? t.accent;
  const p = useAnimatedNumber(1, 750);

  const enough = data.length >= 2;
  const max = enough ? Math.max(...data) : 0;
  const min = enough ? Math.min(...data) : 0;
  const range = max - min || 1;
  const pts = enough
    ? data.map((v, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - 6 - ((v - min) / range) * (height - 12);
        return [x, y] as const;
      })
    : [];
  const line = pts.map((pt, i) => `${i ? 'L' : 'M'}${pt[0].toFixed(1)} ${pt[1].toFixed(1)}`).join(' ');
  let length = 0;
  for (let i = 1; i < pts.length; i++) {
    length += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  }

  const lineProps = useAnimatedProps(() => ({ strokeDashoffset: length * (1 - p.value) }));
  const dotProps = useAnimatedProps(() => ({ opacity: p.value }));

  if (!enough) return <View style={{ width, height }} />;
  const last = pts[pts.length - 1];
  return (
    <Svg width={width} height={height}>
      <AnimatedPath
        d={line}
        stroke={col}
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={length}
        animatedProps={lineProps}
      />
      <AnimatedCircle cx={last[0]} cy={last[1]} r={3.5} fill={col} animatedProps={dotProps} />
    </Svg>
  );
}

/** Simple horizontal progress bar. */
export function ProgressBar({
  pct,
  color,
  track,
  height = 8,
}: {
  pct: number;
  color?: string;
  track?: string;
  height?: number;
}) {
  const t = useTheme();
  const [w, setW] = useState(0);
  const frac = Math.min(100, Math.max(0, pct)) / 100;
  const p = useAnimatedNumber(frac);
  const style = useAnimatedStyle(() => ({ width: w * p.value }));
  return (
    <View
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={{ height, borderRadius: 999, backgroundColor: track ?? t.fill2, overflow: 'hidden' }}
    >
      <Reanimated.View style={[{ height: '100%', borderRadius: 999, backgroundColor: color ?? t.accent }, style]} />
    </View>
  );
}
