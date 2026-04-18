import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Switch, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/shared/themed-text';
import { ThemedView } from '@/components/shared/themed-view';
import { Colors } from '@/constants/theme';
import { useStoredApiKey } from '@/hooks/settings/useStoredApiKey';
import { useColorScheme } from '@/hooks/theme/use-color-scheme';
import { testAnthropicConnection } from '@/lib/anthropic';

export default function SettingsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { apiKey, isLoading, saveApiKey } = useStoredApiKey();
  const [draftApiKey, setDraftApiKey] = useState(apiKey);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    setDraftApiKey(apiKey);
  }, [apiKey]);

  async function handleSave() {
    try {
      await saveApiKey(draftApiKey);
      setFeedbackMessage(draftApiKey.trim() ? 'API key saved successfully.' : 'API key removed.');
    } catch {
      setFeedbackMessage('Unable to save the API key.');
    }
  }

  async function handleTestConnection() {
    if (!draftApiKey.trim()) {
      setFeedbackMessage('Enter your API key before testing the connection.');
      return;
    }

    setIsTesting(true);
    setFeedbackMessage(null);

    try {
      await testAnthropicConnection(draftApiKey.trim());
      setFeedbackMessage('Connection successful.');
    } catch {
      setFeedbackMessage('Connection test failed. Please verify the API key and network.');
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
            Save your Anthropic API key securely before scanning invoices.
          </ThemedText>
        </View>

        <View className="mt-6 rounded-3xl border p-5" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
          <ThemedText type="defaultSemiBold">Anthropic API Key</ThemedText>
          {isLoading ? (
            <ActivityIndicator color={colors.tint} style={{ marginTop: 12 }} />
          ) : (
            <View className="mt-4 gap-4">
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                className="min-h-[52px] rounded-2xl border px-4 py-3"
                onChangeText={setDraftApiKey}
                placeholder="sk-ant-..."
                placeholderTextColor={colors.muted}
                secureTextEntry={!showApiKey}
                style={{ borderColor: colors.border, color: colors.text }}
                value={draftApiKey}
              />

              <View className="flex-row items-center justify-between">
                <ThemedText>Show API key</ThemedText>
                <Switch onValueChange={setShowApiKey} value={showApiKey} />
              </View>

              <Pressable
                className="min-h-12 items-center justify-center rounded-2xl px-4"
                onPress={handleSave}
                style={({ pressed }) => ({ backgroundColor: colors.tint, opacity: pressed ? 0.85 : 1 })}>
                <ThemedText style={{ color: '#FFFFFF', fontWeight: '700' }}>Save API Key</ThemedText>
              </Pressable>

              <Pressable
                className="min-h-12 items-center justify-center rounded-2xl border px-4"
                disabled={isTesting}
                onPress={handleTestConnection}
                style={({ pressed }) => ({
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                  opacity: pressed || isTesting ? 0.85 : 1,
                })}>
                <ThemedText>{isTesting ? 'Testing...' : 'Test Connection'}</ThemedText>
              </Pressable>
            </View>
          )}
        </View>

        {feedbackMessage ? (
          <View className="mt-4 rounded-2xl border p-4" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
            <ThemedText>{feedbackMessage}</ThemedText>
          </View>
        ) : null}

        <Pressable
          className="mt-3 self-start py-2"
          onPress={() => Alert.alert('Tip', 'Set your API key here before scanning invoices.')}
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
          <ThemedText style={{ color: colors.muted }}>Why do I need this?</ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}
