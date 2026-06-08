import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Keyboard,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';
import { IconButton } from './Button';
import { Txt } from './Text';

/**
 * Draggable bottom sheet (React Native core — Modal + Animated + PanResponder).
 * Controlled via `open`/`onClose`. Drag the grabber to resize between snap
 * points (or fling down to dismiss). Without `snapPoints` it fits its content.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  snapPoints,
  scrollable,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  snapPoints?: (string | number)[];
  scrollable?: boolean;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const screenH = Dimensions.get('window').height;

  const snaps = (snapPoints ?? [])
    .map((p) => (typeof p === 'string' && p.trim().endsWith('%') ? (parseFloat(p) / 100) * screenH : Number(p)))
    .filter((n) => n > 0)
    .sort((a, b) => a - b);
  const hasSnaps = snaps.length > 0;
  const maxH = hasSnaps ? snaps[snaps.length - 1] : Math.floor(screenH * 0.86);

  const [mounted, setMounted] = useState(open);
  const [measuredH, setMeasuredH] = useState(0);
  const [kb, setKb] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => setKb(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKb(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  const translateY = useRef(new Animated.Value(screenH)).current;
  const backdrop = useRef(new Animated.Value(0)).current;
  const curY = useRef(screenH);
  const grantY = useRef(0);

  // The fully-laid-out height we translate against (snap mode uses maxH).
  const sheetH = hasSnaps ? maxH : measuredH || Math.floor(screenH * 0.5);
  const restY = hasSnaps ? maxH - snaps[0] : 0; // resting translate offset

  useEffect(() => {
    const id = translateY.addListener(({ value }) => (curY.current = value));
    return () => translateY.removeListener(id);
  }, [translateY]);

  // mount on open
  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  // animate in / out
  useEffect(() => {
    if (!mounted) return;
    if (open) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: restY, useNativeDriver: true, damping: 24, stiffness: 240, mass: 0.8 }),
        Animated.timing(backdrop, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: sheetH + insets.bottom + 40, duration: 220, useNativeDriver: true }),
        Animated.timing(backdrop, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(({ finished }) => finished && setMounted(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mounted, restY, sheetH]);

  const close = () => {
    Keyboard.dismiss();
    onClose();
  };

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderGrant: () => {
        translateY.stopAnimation();
        grantY.current = curY.current;
      },
      onPanResponderMove: (_, g) => {
        const next = Math.max(0, grantY.current + g.dy);
        translateY.setValue(next);
      },
      onPanResponderRelease: (_, g) => {
        const finalY = Math.max(0, grantY.current + g.dy);
        const shown = sheetH - finalY;
        const smallest = hasSnaps ? snaps[0] : sheetH;
        if (g.vy > 1.1 || shown < smallest * 0.55) {
          close();
          return;
        }
        const targets = hasSnaps ? snaps.map((s) => maxH - s) : [0];
        const nearest = targets.reduce((best, ty) => (Math.abs(ty - finalY) < Math.abs(best - finalY) ? ty : best), targets[0]);
        Animated.spring(translateY, { toValue: nearest, useNativeDriver: true, damping: 24, stiffness: 240 }).start();
      },
    }),
  ).current;

  if (!mounted) return null;

  const Grabber = (
    <View {...pan.panHandlers} style={{ paddingTop: 10, paddingBottom: title ? 0 : 6 }}>
      <View style={{ alignSelf: 'center', width: 38, height: 5, borderRadius: 999, backgroundColor: t.line }} />
      {title ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 }}>
          <Txt variant="title3">{title}</Txt>
          <IconButton name="close" onPress={close} size={32} iconSize={18} bg={t.fill} />
        </View>
      ) : null}
    </View>
  );

  return (
    <Modal visible transparent statusBarTranslucent animationType="none" onRequestClose={close}>
      <View style={{ flex: 1 }}>
        <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', opacity: backdrop }}>
          <Pressable style={{ flex: 1 }} onPress={close} />
        </Animated.View>

        <Animated.View
          onLayout={(e) => {
            if (!hasSnaps) {
              const h = Math.min(e.nativeEvent.layout.height, Math.floor(screenH * 0.86));
              if (Math.abs(h - measuredH) > 1) setMeasuredH(h);
            }
          }}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: kb,
            height: hasSnaps ? maxH : undefined,
            maxHeight: Math.floor(screenH * 0.86),
            backgroundColor: t.sheet,
            borderTopLeftRadius: t.radius.sheet,
            borderTopRightRadius: t.radius.sheet,
            transform: [{ translateY }],
            ...t.shadowLg,
          }}
        >
          {Grabber}
          {scrollable ? (
            <ScrollView
              style={{ flexGrow: 0 }}
              contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
          ) : (
            <View style={{ paddingBottom: insets.bottom + 16 }}>{children}</View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}
