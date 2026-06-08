import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';

import { useTheme } from '@/theme';
import { Button } from './Button';
import { Txt } from './Text';

export function EmptyState({
  icon = 'sparkles-outline',
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const t = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32 }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          backgroundColor: t.fill,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <Ionicons name={icon} size={30} color={t.ink3} />
      </View>
      <Txt variant="title3" center>
        {title}
      </Txt>
      {subtitle && (
        <Txt tone="ink2" center style={{ marginTop: 6, maxWidth: 260 }}>
          {subtitle}
        </Txt>
      )}
      {actionLabel && onAction && (
        <View style={{ marginTop: 18 }}>
          <Button size="sm" full={false} onPress={onAction}>
            {actionLabel}
          </Button>
        </View>
      )}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <EmptyState
      icon="cloud-offline-outline"
      title="Something went wrong"
      subtitle={message ?? 'We couldn’t load this. Check your connection and try again.'}
      actionLabel={onRetry ? 'Retry' : undefined}
      onAction={onRetry}
    />
  );
}
