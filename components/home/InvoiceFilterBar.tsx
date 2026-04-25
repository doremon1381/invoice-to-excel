import { Pressable } from 'react-native';

import { ThemedText } from '@/components/shared/themed-text';
import { Card } from '@/components/shared/ui/Card';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/theme/use-color-scheme';

export type InvoiceFilterOption = {
  label: string;
  value: string;
};

type InvoiceFilterBarProps = {
  options: InvoiceFilterOption[];
  activeValue: string;
  onChange: (value: string) => void;
};

export function InvoiceFilterBar({
  options,
  activeValue,
  onChange,
}: InvoiceFilterBarProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <Card
      className="mb-4 flex-row rounded-[20px] border p-1"
      tone="surfaceAlt"
    >
      {options.map((option) => {
        const isActive = activeValue === option.value;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            className="flex-1 rounded-2xl px-3 py-2.5"
            onPress={() => onChange(option.value)}
            style={{
              backgroundColor: isActive ? colors.surface : "transparent",
              elevation: isActive ? 2 : 0,
              shadowColor: colors.shadow,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: isActive ? 0.06 : 0,
              shadowRadius: 4,
            }}
          >
            <ThemedText
              type="custom"
              className="text-center text-caption font-bold"
              numberOfLines={1}
              scaleRole="chrome"
              style={{
                color: isActive ? colors.foreground : colors.muted,
              }}
            >
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </Card>
  );
}
