import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { ThemedText } from '@/components/shared/themed-text';

type ExpenseDonutProps = {
  primaryColor: string;
  secondaryColor: string;
  size?: number;
};

export function ExpenseDonut({
  primaryColor,
  secondaryColor,
  size = 116,
}: ExpenseDonutProps) {
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const primaryArc = circumference * 0.66;
  const secondaryArc = circumference * 0.26;
  const gap = circumference - primaryArc - secondaryArc;

  return (
    <View
      className="items-center justify-center"
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={primaryColor}
          strokeDasharray={`${primaryArc} ${circumference - primaryArc}`}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
          fill="transparent"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={secondaryColor}
          strokeDasharray={`${secondaryArc} ${circumference - secondaryArc}`}
          strokeDashoffset={-(primaryArc + gap / 2)}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
          fill="transparent"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View className="absolute inset-0 items-center justify-center">
        <ThemedText type="defaultSemiBold" style={{ fontSize: 15 }}>
          Expense
        </ThemedText>
      </View>
    </View>
  );
}
