import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { ThemedText } from "@/components/shared/themed-text";
import { IconSymbol } from "@/components/shared/ui/icon-symbol";
import { Typography } from "@/constants/typography";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/theme/use-color-scheme";

export default function TabLayout() {
  const { t, i18n } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const language = i18n.resolvedLanguage ?? i18n.language;

  return (
    <Tabs
      key={language}
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: true,
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTitleStyle: {
          color: colors.foreground,
          fontSize: Typography.xl.size,
          fontWeight: "700",
        },
        headerTintColor: colors.foreground,
        sceneStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.home"),
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <IconSymbol
              name="house.fill"
              size={22}
              color={focused ? colors.accent : colors.mutedLight}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: t("tabs.scan"),
          headerTitle: t("tabs.scanInvoice"),
          tabBarIcon: ({ focused }) => (
            <IconSymbol
              name="camera.fill"
              size={22}
              color={focused ? colors.accent : colors.mutedLight}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t("tabs.settings"),
          headerTitle: t("tabs.settings"),
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <IconSymbol
              name="gearshape.fill"
              size={22}
              color={focused ? colors.accent : colors.mutedLight}
            />
          ),
        }}
      />
    </Tabs>
  );
}

function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      <View style={styles.tabBarRow}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          const label =
            typeof options.tabBarLabel === "string"
              ? options.tabBarLabel
              : typeof options.title === "string"
                ? options.title
                : route.name;
          const color = isFocused ? colors.accent : colors.mutedLight;
          const icon = options.tabBarIcon?.({ focused: isFocused, color, size: 22 });

          return (
            <HapticTab
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabItem}
            >
              <View
                style={[
                  styles.iconContainer,
                  isFocused && {
                    backgroundColor: colors.accentSoft,
                    borderColor: colors.accentBorder,
                  },
                  isFocused && styles.iconContainerActive,
                ]}
              >
                {icon}
              </View>
              <ThemedText
                className="text-xs font-semibold"
                numberOfLines={1}
                scaleRole="chrome"
                style={[
                  styles.label,
                  {
                    color,
                    fontSize: Typography.xs.size,
                    lineHeight: Typography.xs.lineHeight,
                  },
                ]}
                type="custom"
              >
                {label}
              </ThemedText>
            </HapticTab>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  tabBarRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    minHeight: 68,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainerActive: {
    borderWidth: 1,
  },
  label: {
    marginTop: 4,
    textAlign: "center",
  },
});
