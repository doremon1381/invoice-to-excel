import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/shared/themed-text";
import { Button } from "@/components/shared/ui/Button";
import { Card } from "@/components/shared/ui/Card";
import { ScreenContainer } from "@/components/shared/ui/ScreenContainer";
import { SectionTitle } from "@/components/shared/ui/SectionTitle";
import { Colors } from "@/constants/theme";
import { useAppTheme } from "@/hooks/theme/theme-provider";
import { useColorScheme } from "@/hooks/theme/use-color-scheme";
import { OPENAI_BASE_URL, OPENAI_MODEL } from "@/lib/constants";

export default function SettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { colorScheme: themeMode, setThemeMode } = useAppTheme();

  return (
    <ScreenContainer scroll className="mb-5">
      <SectionTitle
        title="Settings"
        description="Configure appearance and database tools for the invoice workspace. Scanning uses the AI extraction API only."
      />

      <Card className="mt-4 rounded-[28px] border py-5 px-4">
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
                  backgroundColor: isActive ? colors.accent : "transparent",
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
      </Card>

      <Card className="mt-5 rounded-[28px] border p-5">
        <ThemedText type="defaultSemiBold">AI extraction</ThemedText>
        <ThemedText className="mt-2" style={{ color: colors.muted }}>
          Invoice scans are sent to the OpenAI-compatible chat completions API
          configured in the app. Endpoint{" "}
          <ThemedText style={{ color: colors.foreground }}>
            {OPENAI_BASE_URL}
          </ThemedText>
          , model{" "}
          <ThemedText style={{ color: colors.foreground }}>
            {OPENAI_MODEL}
          </ThemedText>
          . No separate OCR server is used.
        </ThemedText>
      </Card>

      <Card className="mt-5 rounded-[28px] border p-5">
        <ThemedText type="defaultSemiBold">Database</ThemedText>
        <ThemedText className="mt-2" style={{ color: colors.muted }}>
          Review storage, export history, and Excel tools.
        </ThemedText>
        <Button
          className="mt-4"
          label="OPEN DATABASE MANAGEMENT"
          onPress={() => router.push("/(tabs)/settings/database-management")}
        />
      </Card>
    </ScreenContainer>
  );
}
