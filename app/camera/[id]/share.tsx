import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../../../src/components/Screen';
import { TextField } from '../../../src/components/TextField';
import { Button } from '../../../src/components/Button';
import { shareAdd } from '../../../src/api/share';
import { useAuth } from '../../../src/store/authStore';
import { colors, spacing, font } from '../../../src/theme/tokens';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ShareScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const token = useAuth((s) => s.token);

  const [email, setEmail] = useState('');
  const [validationError, setValidationError] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    // Validate
    if (!email.trim()) {
      setValidationError('Email is required.');
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setValidationError('Please enter a valid email address.');
      return;
    }
    setValidationError('');
    setStatus('loading');
    try {
      await shareAdd(token!, id!, email.trim());
      setStatus('success');
      setMessage(`Shared with ${email.trim()}`);
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Failed to share device. Please try again.');
    }
  };

  return (
    <Screen title="Share Device" onBack={() => router.back()}>
      <View style={styles.container}>
        <TextField
          label="Recipient Email"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (validationError) setValidationError('');
            if (status !== 'idle') setStatus('idle');
          }}
          placeholder="friend@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          testID="share.email"
          accessibilityLabel="Recipient Email"
        />
        {!!validationError && (
          <Text style={styles.errorText}>{validationError}</Text>
        )}
        {status === 'success' && (
          <Text style={styles.successText}>{message}</Text>
        )}
        {status === 'error' && (
          <Text style={styles.errorText}>{message}</Text>
        )}
        <Button
          title="Share"
          onPress={() => void handleSubmit()}
          loading={status === 'loading'}
          disabled={status === 'loading'}
          testID="share.submit"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  errorText: {
    color: colors.danger,
    fontSize: font.sm,
    marginBottom: spacing.md,
  },
  successText: {
    color: colors.online,
    fontSize: font.sm,
    marginBottom: spacing.md,
  },
});
