import { Tabs } from "expo-router";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/shared/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/theme/use-color-scheme";

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTitleStyle: {
          color: colors.foreground,
          fontSize: 20,
          fontWeight: "700",
        },
        headerTintColor: colors.foreground,
        sceneStyle: {
          backgroundColor: colors.background,
        },
        tabBarButton: HapticTab,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.mutedLight,
        tabBarShowLabel: false,
        tabBarStyle: {
          minHeight: 56,
          paddingTop: 8,
          paddingBottom: 8,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
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
          title: "Scan",
          headerTitle: "Scan Invoice",
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
          title: "Settings",
          headerTitle: "Settings",
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
