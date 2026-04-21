import { Pressable, View } from 'react-native';

import { ExpenseDonut } from '@/components/home/ExpenseDonut';
import { ThemedText } from '@/components/shared/themed-text';
import { Card } from '@/components/shared/ui/Card';
import { IconSymbol } from '@/components/shared/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/theme/use-color-scheme';

type DashboardOverviewProps = {
  isCompact: boolean;
  onScanPress: () => void;
};

export function DashboardOverview({
  isCompact,
  onScanPress,
}: DashboardOverviewProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const donutSecondaryColor = colorScheme === 'light' ? '#60A5FA' : '#F472B6';

  return (
    <View>
      <View
        className="gap-3"
        style={{ flexDirection: isCompact ? 'column' : 'row', minHeight: 142 }}
      >
        <Card
          className="items-center justify-center rounded-[24px] border p-4"
          style={{ flex: isCompact ? undefined : 1 }}
        >
          <ExpenseDonut
            primaryColor={colors.accent}
            secondaryColor={donutSecondaryColor}
          />
        </Card>

        <Pressable
          accessibilityRole="button"
          className="rounded-[24px] px-4 py-4"
          onPress={onScanPress}
          style={({ pressed }) => ({
            backgroundColor: colors.accent,
            justifyContent: 'space-between',
            flex: isCompact ? undefined : 1,
            minHeight: 142,
            minWidth: isCompact ? undefined : 160,
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <View
            className="h-11 w-11 items-center justify-center self-end rounded-xl"
            style={{ backgroundColor: colors.surface }}
          >
            <IconSymbol name="camera.fill" size={24} color={colors.accent} />
          </View>
          <View>
            <ThemedText
              style={{
                color: colors.onAccent,
                fontSize: 28,
                fontWeight: '700',
                lineHeight: 31,
              }}
            >
              SCAN NEW
            </ThemedText>
            <ThemedText
              style={{
                color: colors.onAccent,
                fontSize: 28,
                fontWeight: '700',
                lineHeight: 31,
              }}
            >
              INVOICE
            </ThemedText>
          </View>
        </Pressable>
      </View>
    </View>
  );
}
