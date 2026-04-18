import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useStoredApiKey } from '@/hooks/useStoredApiKey';
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
      setFeedbackMessage('API key saved successfully.');
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
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title">Settings</ThemedText>
        <ThemedText style={[styles.description, { color: colors.muted }]}>
          Save your Anthropic API key securely before scanning invoices.
        </ThemedText>

        <View style={styles.section}>
          <ThemedText type="defaultSemiBold">Anthropic API Key</ThemedText>
          {isLoading ? (
            <ActivityIndicator color={colors.tint} style={styles.loading} />
          ) : (
            <>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={setDraftApiKey}
                placeholder="sk-ant-..."
                placeholderTextColor={colors.muted}
                secureTextEntry={!showApiKey}
                style={[
                  styles.input,
                  {
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={draftApiKey}
              />

              <View style={styles.toggleRow}>
                <ThemedText>Show API key</ThemedText>
                <Switch onValueChange={setShowApiKey} value={showApiKey} />
              </View>

              <Pressable
                onPress={handleSave}
                style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.tint, opacity: pressed ? 0.85 : 1 }]}>
                <ThemedText lightColor="#FFFFFF" darkColor="#FFFFFF">Save API Key</ThemedText>
              </Pressable>

              <Pressable
                disabled={isTesting}
                onPress={handleTestConnection}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                    opacity: pressed || isTesting ? 0.85 : 1,
                  },
                ]}>
                <ThemedText>{isTesting ? 'Testing...' : 'Test Connection'}</ThemedText>
              </Pressable>
            </>
          )}
        </View>

        {feedbackMessage ? (
          <View style={[styles.feedbackCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText>{feedbackMessage}</ThemedText>
          </View>
        ) : null}

        <Pressable
          onPress={() => Alert.alert('Tip', 'Set your API key here before scanning invoices.')}
          style={({ pressed }) => [styles.helpButton, { opacity: pressed ? 0.8 : 1 }]}>
          <ThemedText style={{ color: colors.muted }}>Why do I need this?</ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    gap: 16,
    padding: 20,
  },
  description: {
    marginTop: 4,
  },
  section: {
    gap: 12,
    marginTop: 12,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  toggleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  primaryButton: {
    alignItems: 'center',
    borderRadius: 12,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  secondaryButton: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 14,
  },
  feedbackCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  helpButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  loading: {
    marginTop: 12,
  },
});
