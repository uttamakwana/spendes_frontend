import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';

import { useTheme } from '@/theme';
import { Font } from '@/theme/fonts';
import { Txt } from './Text';

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
  const off = c * (1 - clamped);
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={track ?? t.fill2} strokeWidth={stroke} fill="none" />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color ?? t.accent}
            strokeWidth={stroke}
            strokeDasharray={c}
            strokeDashoffset={off}
            strokeLinecap="round"
            fill="none"
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
  let acc = 0;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          {data.map((d, i) => {
            const frac = d.value / total;
            const len = Math.max(0, frac * c - gap * c);
            const el = (
              <Circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={d.color}
                strokeWidth={stroke}
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-acc * c}
                fill="none"
              />
            );
            acc += frac;
            return el;
          })}
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
            <View
              style={{
                width: '100%',
                maxWidth: 26,
                height: barH,
                borderRadius: 7,
                backgroundColor: hl ? color ?? t.accent : t.fill2,
              }}
            />
            <Txt
              tone={hl ? 'ink' : 'ink3'}
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
  if (data.length < 2) return <View style={{ width, height }} />;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - 6 - ((v - min) / range) * (height - 12);
    return [x, y] as const;
  });
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  return (
    <Svg width={width} height={height}>
      <Path d={line} stroke={col} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={3.5} fill={col} />
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
  return (
    <View style={{ height, borderRadius: 999, backgroundColor: track ?? t.fill2, overflow: 'hidden' }}>
      <View
        style={{
          width: `${Math.min(100, Math.max(0, pct))}%`,
          height: '100%',
          borderRadius: 999,
          backgroundColor: color ?? t.accent,
        }}
      />
    </View>
  );
}
