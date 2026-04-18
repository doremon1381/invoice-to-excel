import { useAppTheme } from '@/hooks/theme/theme-provider';

export function useColorScheme() {
  const { colorScheme } = useAppTheme();
  return colorScheme;
}
