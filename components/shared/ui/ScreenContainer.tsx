import { ScrollView, View, type ScrollViewProps, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/shared/themed-view';

const HORIZONTAL_PADDING = 20;
const TOP_PADDING = 16;
const TAB_BAR_OFFSET = 96;

type BaseProps = {
  includeTabBarInset?: boolean;
  padded?: boolean;
  safeAreaBottom?: boolean;
  safeAreaTop?: boolean;
};

type StaticContainerProps = BaseProps &
  ViewProps & {
    scroll?: false;
  };

type ScrollContainerProps = BaseProps &
  ScrollViewProps & {
    scroll: true;
  };

type ScreenContainerProps = StaticContainerProps | ScrollContainerProps;

export function ScreenContainer(props: ScreenContainerProps) {
  const insets = useSafeAreaInsets();
  const {
    includeTabBarInset = props.scroll,
    padded = true,
    safeAreaBottom = false,
    safeAreaTop = true,
  } = props;
  const horizontalPadding = padded ? HORIZONTAL_PADDING : 0;
  const topPadding = (safeAreaTop ? insets.top : 0) + (padded ? TOP_PADDING : 0);
  const bottomSafePadding = safeAreaBottom ? Math.max(insets.bottom, 12) : 0;
  const bottomPadding = includeTabBarInset
    ? TAB_BAR_OFFSET + Math.max(insets.bottom, 12)
    : bottomSafePadding;
  const containerPaddingStyle = {
    ...(horizontalPadding > 0 ? { paddingHorizontal: horizontalPadding } : {}),
    ...(topPadding > 0 ? { paddingTop: topPadding } : {}),
    ...(bottomPadding > 0 ? { paddingBottom: bottomPadding } : {}),
  };

  if (props.scroll) {
    const {
      includeTabBarInset: _includeTabBarInset,
      padded: _padded,
      safeAreaBottom: _safeAreaBottom,
      safeAreaTop: _safeAreaTop,
      scroll,
      contentContainerClassName,
      contentContainerStyle,
      className,
      ...rest
    } = props;

    return (
      <ThemedView className="flex-1">
        <ScrollView
          className={`flex-1 ${className ?? ''}`.trim()}
          contentContainerClassName={contentContainerClassName}
          contentContainerStyle={[
            {
              flexGrow: 1,
              ...containerPaddingStyle,
            },
            contentContainerStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          {...rest}
        />
      </ThemedView>
    );
  }

  const {
    className,
    includeTabBarInset: _includeTabBarInset,
    padded: _padded,
    safeAreaBottom: _safeAreaBottom,
    safeAreaTop: _safeAreaTop,
    scroll,
    style,
    ...rest
  } = props;
  return (
    <ThemedView className="flex-1">
      <View
        className={`flex-1 ${className ?? ''}`.trim()}
        style={[
          containerPaddingStyle,
          style,
        ]}
        {...rest}
      />
    </ThemedView>
  );
}
