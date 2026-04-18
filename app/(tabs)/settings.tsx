import { useRouter, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/shared/themed-text';
import { ThemedView } from '@/components/shared/themed-view';
import { IconSymbol } from '@/components/shared/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useOcrServerUrl } from '@/hooks/settings/useOcrServerUrl';
import { useAppTheme } from '@/hooks/theme/theme-provider';
import { useColorScheme } from '@/hooks/theme/use-color-scheme';
import { checkOCRServerHealth } from '@/lib/ocr';

export default function SettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { colorScheme: themeMode, setThemeMode } = useAppTheme();
  const { isLoading, saveServerUrl, serverUrl } = useOcrServerUrl();
  const [draftServerUrl, setDraftServerUrl] = useState(serverUrl);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    setDraftServerUrl(serverUrl);
  }, [serverUrl]);

  async function handleSaveServerUrl() {
    try {
      await saveServerUrl(draftServerUrl);
      setFeedbackMessage(draftServerUrl.trim() ? 'OCR server URL saved.' : 'OCR server URL removed.');
    } catch {
      setFeedbackMessage('Unable to save the OCR server URL.');
    }
  }

  async function handleTestConnection() {
    if (!draftServerUrl.trim()) {
      setFeedbackMessage('Enter the OCR server URL before testing the connection.');
      return;
    }

    setIsTesting(true);
    setFeedbackMessage(null);

    try {
      const isHealthy = await checkOCRServerHealth(draftServerUrl.trim().replace(/\/$/, ''));
      setFeedbackMessage(isHealthy ? 'OCR server is reachable.' : 'OCR server health check failed.');
    } catch {
      setFeedbackMessage('Unable to reach the OCR server.');
    } finally {
      setIsTesting(false);
    }
  }

  return (
    <ThemedView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView contentContainerClassName="px-5 pb-8 pt-4">
        <View className="gap-2">
          <ThemedText type="title">Settings</ThemedText>
          <ThemedText style={{ color: colors.muted }}>
            Configure appearance, your OCR server, and database tools for the invoice workspace.
          </ThemedText>
        </View>

        <View className="mt-6 rounded-[28px] border p-5" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
          <ThemedText type="defaultSemiBold">Appearance</ThemedText>
          <View className="mt-4 flex-row rounded-full border p-1" style={{ borderColor: colors.border, backgroundColor: colors.background }}>
            {(['light', 'dark'] as const).map((mode) => {
              const isActive = themeMode === mode;

              return (
                <Pressable
                  key={mode}
                  className="flex-1 rounded-full px-4 py-3"
                  onPress={() => void setThemeMode(mode)}
                  style={{ backgroundColor: isActive ? colors.tint : 'transparent' }}>
                  <ThemedText
                    style={{
                      color: isActive ? colors.background : colors.muted,
                      fontWeight: '700',
                      textAlign: 'center',
                      textTransform: 'capitalize',
                    }}>
                    {mode} mode
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="mt-5 rounded-[28px] border p-5" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
          <ThemedText type="defaultSemiBold">PaddleOCR Server</ThemedText>
          {isLoading ? (
            <ActivityIndicator color={colors.tint} style={{ marginTop: 16 }} />
          ) : (
            <View className="mt-4 gap-4">
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                className="min-h-[52px] rounded-2xl border px-4 py-3"
                keyboardType="url"
                onChangeText={setDraftServerUrl}
                placeholder="http://192.168.1.42:8000"
                placeholderTextColor={colors.muted}
                style={{ borderColor: colors.border, color: colors.text }}
                value={draftServerUrl}
              />

              <View className="flex-row gap-3">
                <Pressable
                  className="min-h-12 flex-1 items-center justify-center rounded-2xl px-4"
                  onPress={() => void handleSaveServerUrl()}
                  style={({ pressed }) => ({ backgroundColor: colors.tint, opacity: pressed ? 0.85 : 1 })}>
                  <ThemedText style={{ color: '#FFFFFF', fontWeight: '700' }}>Save URL</ThemedText>
                </Pressable>

                <Pressable
                  className="min-h-12 flex-1 items-center justify-center rounded-2xl border px-4"
                  disabled={isTesting}
                  onPress={() => void handleTestConnection()}
                  style={({ pressed }) => ({
                    borderColor: colors.border,
                    opacity: pressed || isTesting ? 0.85 : 1,
                  })}>
                  <ThemedText>{isTesting ? 'Testing...' : 'Test Health'}</ThemedText>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        <Pressable
          className="mt-5 rounded-[28px] border p-5"
          onPress={() => router.push('/database-management' as Href)}
          style={({ pressed }) => ({
            backgroundColor: colors.card,
            borderColor: colors.border,
            opacity: pressed ? 0.9 : 1,
          })}>
          <View className="flex-row items-center justify-between gap-4">
            <View className="flex-row items-center gap-3">
              <View className="h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: colors.background }}>
                <IconSymbol name="square.and.arrow.up.fill" size={22} color={colors.tint} />
              </View>
              <View>
                <ThemedText type="defaultSemiBold">Database Management</ThemedText>
                <ThemedText style={{ color: colors.muted, fontSize: 13 }}>
                  Review storage, export history, and Excel tools.
                </ThemedText>
              </View>
            </View>
            <IconSymbol name="chevron.right" size={18} color={colors.icon} />
          </View>
        </Pressable>

        <View className="mt-5 rounded-[28px] border p-5" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
          <ThemedText type="defaultSemiBold">Anthropic integration</ThemedText>
          <ThemedText className="mt-2" style={{ color: colors.muted }}>
            Anthropic configuration is intentionally hidden for now. The related code remains in the project so it can be restored later if needed.
          </ThemedText>
        </View>

        {feedbackMessage ? (
          <View className="mt-4 rounded-2xl border p-4" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
            <ThemedText>{feedbackMessage}</ThemedText>
          </View>
        ) : null}

        <Pressable
          className="mt-3 self-start py-2"
          onPress={() =>
            Alert.alert(
              'OCR setup',
              'Use the PaddleOCR Docker server URL here. The scan tab will upload the selected image to that server and store the OCR result locally.',
            )
          }
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
          <ThemedText style={{ color: colors.muted }}>How does OCR setup work?</ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}
