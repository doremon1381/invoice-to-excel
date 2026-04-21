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

  if (props.scroll) {
    const { scroll, contentContainerClassName, className, ...rest } = props;
    return (
      <ThemedView className="flex-1">
        <ScrollView
          className={className}
          contentContainerClassName={`${baseClassName} pb-8 ${contentContainerClassName ?? ''}`.trim()}
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
