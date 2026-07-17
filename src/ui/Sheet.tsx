import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Dimensions, Keyboard, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';
import { IconButton } from './Button';
import { Txt } from './Text';

/**
 * Draggable bottom sheet built on `@gorhom/bottom-sheet` (inline BottomSheet).
 * Controlled via `open`/`onClose`: it mounts closed (index -1) and is driven
 * imperatively from the `open` prop. Drag the grabber down or tap the backdrop
 * to dismiss. Without `snapPoints` it fits its content (dynamic sizing, capped
 * at 86% of the screen).
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

  const ref = useRef<BottomSheet>(null);

  const hasSnaps = !!snapPoints && snapPoints.length > 0;
  const snaps = useMemo(() => (hasSnaps ? snapPoints : undefined), [hasSnaps, snapPoints]);

  // Drive open/close imperatively from the controlled `open` prop. The sheet
  // mounts closed (index -1); opening snaps to the first point, closing dismisses.
  useEffect(() => {
    if (open) ref.current?.snapToIndex(0);
    else ref.current?.close();
  }, [open]);

  const close = useCallback(() => {
    Keyboard.dismiss();
    ref.current?.close();
  }, []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.45} pressBehavior="close" />
    ),
    [],
  );

  // Grabber (+ optional title row) rendered as a pinned handle so it stays put
  // while the content scrolls.
  const renderHandle = useCallback(
    () => (
      <View style={{ paddingTop: 10, paddingBottom: title ? 0 : 6 }}>
        <View style={{ alignSelf: 'center', width: 38, height: 5, borderRadius: 999, backgroundColor: t.line }} />
        {title ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: 4,
            }}
          >
            <Txt variant="title3">{title}</Txt>
            <IconButton name="close" onPress={close} size={32} iconSize={18} bg={t.fill} />
          </View>
        ) : null}
      </View>
    ),
    [title, t.line, t.fill, close],
  );

  const Content = scrollable ? BottomSheetScrollView : BottomSheetView;
  const contentPad = { paddingBottom: insets.bottom + 16 };

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      onClose={onClose}
      snapPoints={snaps}
      enableDynamicSizing={!hasSnaps}
      maxDynamicContentSize={Math.floor(screenH * 0.86)}
      enablePanDownToClose
      topInset={insets.top}
      handleComponent={renderHandle}
      backdropComponent={renderBackdrop}
      backgroundStyle={{
        backgroundColor: t.sheet,
        borderTopLeftRadius: t.radius.sheet,
        borderTopRightRadius: t.radius.sheet,
      }}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
    >
      {scrollable ? (
        <Content
          style={{ flexGrow: 0 }}
          contentContainerStyle={contentPad}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </Content>
      ) : (
        <Content style={contentPad}>{children}</Content>
      )}
    </BottomSheet>
  );
}
