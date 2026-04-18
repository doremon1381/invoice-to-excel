import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { ThemedText } from '@/components/shared/themed-text';
import { IconSymbol } from '@/components/shared/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/theme/use-color-scheme';

function TabPill({
  color,
  colors,
  focused,
  icon,
  label,
  primary = false,
}: {
  color: string;
  colors: (typeof Colors)['light'];
  focused: boolean;
  icon: 'house.fill' | 'camera.fill' | 'gearshape.fill';
  label: string;
  primary?: boolean;
}) {
  const activeBackgroundColor = primary ? colors.tint : colors.background;
  const activeIconColor = primary ? colors.background : colors.text;
  const activeLabelColor = primary ? colors.background : colors.text;

  return (
    <View
      style={{
        alignItems: 'center',
        backgroundColor: focused ? activeBackgroundColor : 'transparent',
        borderColor: focused && !primary ? colors.border : 'transparent',
        borderWidth: focused && !primary ? 1 : 0,
        borderRadius: 22,
        flexDirection: 'row',
        gap: focused ? 8 : 0,
        justifyContent: 'center',
        minHeight: 46,
        minWidth: primary && focused ? 108 : focused ? 92 : 54,
        paddingHorizontal: focused ? 14 : 10,
        paddingVertical: 10,
      }}>
      <IconSymbol size={22} name={icon} color={focused ? activeIconColor : color} />
      {focused ? (
        <ThemedText
          style={{
            color: activeLabelColor,
            fontSize: 12,
            fontWeight: '700',
          }}>
          {label}
        </ThemedText>
      ) : null}
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
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
          color: colors.text,
          fontSize: 20,
          fontWeight: '700',
        },
        headerTintColor: colors.text,
        sceneStyle: {
          backgroundColor: colors.background,
        },
        tabBarButton: HapticTab,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.icon,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          left: 18,
          right: 18,
          bottom: 18,
          height: 78,
          paddingBottom: 12,
          paddingTop: 12,
          borderTopWidth: 0,
          borderRadius: 32,
          backgroundColor: colors.card,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: colorScheme === 'dark' ? 0.24 : 0.1,
          shadowRadius: 18,
          elevation: 10,
        },
        tabBarItemStyle: {
          marginHorizontal: 4,
          marginVertical: 2,
          borderRadius: 24,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: 'Invoice Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <TabPill color={color} colors={colors} focused={focused} icon="house.fill" label="Home" />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          headerTitle: 'Scan Invoice',
          tabBarIcon: ({ color, focused }) => (
            <TabPill color={color} colors={colors} focused={focused} icon="camera.fill" label="Scan" primary />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerTitle: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <TabPill color={color} colors={colors} focused={focused} icon="gearshape.fill" label="Settings" />
          ),
        }}
      />
    </Tabs>
  );
}
