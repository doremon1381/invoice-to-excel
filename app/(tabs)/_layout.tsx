import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs, useSegments } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { ThemedText } from "@/components/shared/themed-text";
import { IconSymbol } from "@/components/shared/ui/icon-symbol";
import { Typography } from "@/constants/typography";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/theme/use-color-scheme";

const APP_HEADER_LABEL = "Doremon";
const APP_HEADER_MIN_HEIGHT = 96;
const APP_HEADER_CONTENT_HEIGHT = 44;
const APP_HEADER_MIN_TOP_PADDING = 16;
const APP_HEADER_BOTTOM_PADDING = 12;

function shouldShowAppShell(segments: string[]) {
  if (segments[0] !== "(tabs)") {
    return false;
  }

  if (segments.length === 1) {
    return true;
  }

  return segments.length === 2 && segments[1] === "settings";
}

export default function TabLayout() {
  const { t, i18n } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const showAppShell = shouldShowAppShell(segments);
  const headerTopPadding = Math.max(insets.top, APP_HEADER_MIN_TOP_PADDING);
  const appShellHeight = showAppShell
    ? Math.max(
        APP_HEADER_MIN_HEIGHT,
        headerTopPadding + APP_HEADER_CONTENT_HEIGHT + APP_HEADER_BOTTOM_PADDING,
      )
    : 0;

  return (
    <View style={[styles.layoutRoot, { backgroundColor: colors.background }]}>
      <Tabs
        key={language}
        detachInactiveScreens
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{
          headerShown: false,
          freezeOnBlur: true,
          animation: "none",
          sceneStyle: {
            backgroundColor: colors.background,
            paddingTop: appShellHeight,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t("tabs.home"),
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

      {showAppShell ? (
        <View
          pointerEvents="none"
          style={[
            styles.appShell,
            {
              height: appShellHeight,
              paddingTop: headerTopPadding,
              paddingBottom: APP_HEADER_BOTTOM_PADDING,
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
              shadowColor: colors.foreground,
            },
          ]}
        >
          <View style={styles.appShellContent}>
            <ThemedText
              accessibilityRole="header"
              className="text-center font-bold"
              scaleRole="chrome"
              style={{
                color: colors.accent,
                fontSize: Typography.display.size,
                lineHeight: Typography.display.lineHeight,
              }}
              type="custom"
            >
              {APP_HEADER_LABEL}
            </ThemedText>
          </View>
        </View>
      ) : null}
    </View>
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
      <View pointerEvents="none" style={styles.tabBarAccentLine}>
        <LinearGradient
          colors={["transparent", colors.accent, "transparent"]}
          end={{ x: 1, y: 0 }}
          start={{ x: 0, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

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
  layoutRoot: {
    flex: 1,
  },
  appShell: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 20,
    justifyContent: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  appShellContent: {
    minHeight: APP_HEADER_CONTENT_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  tabBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  tabBarAccentLine: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 2,
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
