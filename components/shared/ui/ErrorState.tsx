import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/shared/themed-text';
import { Card } from '@/components/shared/ui/Card';
import { Button } from '@/components/shared/ui/Button';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/theme/use-color-scheme';

type ErrorStateProps = {
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
  /** Force dark palette (e.g. full-screen scan chrome). */
  variant?: 'dark' | 'default';
};

export function ErrorState({
  message,
  onRetry,
  retryLabel: retryLabelProp,
  variant = 'default',
}: ErrorStateProps) {
  const { t } = useTranslation();
  const retryLabel = retryLabelProp ?? t('common.retry');
  const colorScheme = useColorScheme() ?? 'light';
  const colors = variant === 'dark' ? Colors.dark : Colors[colorScheme];

  return (
    <Card className="rounded-[24px] px-4 py-3" tone={variant === 'dark' ? 'surfaceAlt' : 'surface'}>
      <View className="gap-3">
        {variant === 'dark' ? (
          <ThemedText style={{ color: colors.danger }}>{message}</ThemedText>
        ) : (
          <ThemedText style={{ color: colors.danger }}>{message}</ThemedText>
        )}
        {onRetry ? (
          <Button
            label={retryLabel}
            onPress={onRetry}
            size="sm"
            variant="secondary"
            style={{ alignSelf: 'flex-start' }}
          />
        ) : null}
      </View>
    </Card>
  );
}
