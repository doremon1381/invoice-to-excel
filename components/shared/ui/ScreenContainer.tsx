import { ScrollView, View, type ScrollViewProps, type ViewProps } from 'react-native';

import { ThemedView } from '@/components/shared/themed-view';

type BaseProps = {
  padded?: boolean;
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
  const { padded = true } = props;
  const baseClassName = padded ? 'flex-1 px-5 pt-4' : 'flex-1';
  const scrollContentClassName = padded ? 'px-5 pt-4' : '';

  if (props.scroll) {
    const {
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
          contentContainerClassName={`${scrollContentClassName} pb-28 ${contentContainerClassName ?? ''}`.trim()}
          contentContainerStyle={[{ flexGrow: 1 }, contentContainerStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          {...rest}
        />
      </ThemedView>
    );
  }

  const { scroll, className, ...rest } = props;
  return (
    <ThemedView className="flex-1">
      <View className={`${baseClassName} ${className ?? ''}`.trim()} {...rest} />
    </ThemedView>
  );
}
