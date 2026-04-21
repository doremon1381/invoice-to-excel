import { useRouter, type Href } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";

import { ThemedText } from "@/components/shared/themed-text";
import { ThemedView } from "@/components/shared/themed-view";
import { IconSymbol } from "@/components/shared/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useAppTheme } from "@/hooks/theme/theme-provider";
import { useColorScheme } from "@/hooks/theme/use-color-scheme";
import { ANTHROPIC_BASE_URL, ANTHROPIC_MODEL } from "@/lib/constants";

export default function SettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { colorScheme: themeMode, setThemeMode } = useAppTheme();

  return (
    <ThemedView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <ScrollView contentContainerClassName="px-5 pb-8 pt-4">
        <View className="gap-2">
          <ThemedText type="title">Settings</ThemedText>
          <ThemedText style={{ color: colors.muted }}>
            Configure appearance and database tools for the invoice workspace.
            Scanning uses the AI extraction API only.
          </ThemedText>
        </View>

        <View
          className="mt-6 rounded-[28px] border p-5"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <ThemedText type="defaultSemiBold">Appearance</ThemedText>
          <View
            className="mt-4 flex-row rounded-full border p-1"
            style={{
              borderColor: colors.border,
              backgroundColor: colors.background,
            }}
          >
            {(["light", "dark"] as const).map((mode) => {
              const isActive = themeMode === mode;

              return (
                <Pressable
                  key={mode}
                  className="flex-1 rounded-full px-4 py-3"
                  onPress={() => void setThemeMode(mode)}
                  style={{
                    backgroundColor: isActive ? colors.tint : "transparent",
                  }}
                >
                  <ThemedText
                    style={{
                      color: isActive ? colors.background : colors.muted,
                      fontWeight: "700",
                      textAlign: "center",
                      textTransform: "capitalize",
                    }}
                  >
                    {mode} mode
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View
          className="mt-5 rounded-[28px] border p-5"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <ThemedText type="defaultSemiBold">AI extraction</ThemedText>
          <ThemedText className="mt-2" style={{ color: colors.muted }}>
            Invoice scans are sent to the OpenAI-compatible chat completions
            API configured in the app. Endpoint{" "}
            <ThemedText style={{ color: colors.text }}>{ANTHROPIC_BASE_URL}</ThemedText>
            , model{" "}
            <ThemedText style={{ color: colors.text }}>{ANTHROPIC_MODEL}</ThemedText>
            . No separate OCR server is used.
          </ThemedText>
        </View>

        <Pressable
          className="mt-5 rounded-[28px] border p-5"
          onPress={() => router.push("/database-management" as Href)}
          style={({ pressed }) => ({
            backgroundColor: colors.card,
            borderColor: colors.border,
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <View className="flex-row items-center justify-between gap-4">
            <View className="flex-row items-center gap-3">
              <View
                className="h-12 w-12 items-center justify-center rounded-2xl"
                style={{ backgroundColor: colors.background }}
              >
                <IconSymbol
                  name="square.and.arrow.up.fill"
                  size={22}
                  color={colors.tint}
                />
              </View>
              <View>
                <ThemedText type="defaultSemiBold">
                  Database Management
                </ThemedText>
                <ThemedText style={{ color: colors.muted, fontSize: 13 }}>
                  Review storage, export history, and Excel tools.
                </ThemedText>
              </View>
            </View>
            <IconSymbol name="chevron.right" size={18} color={colors.icon} />
          </View>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}
