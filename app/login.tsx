import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  type TextInput as TextInputType,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../src/components/Screen';
import { TextField } from '../src/components/TextField';
import { Button } from '../src/components/Button';
import { login } from '../src/api/auth';
import { useAuth } from '../src/store/authStore';
import { colors, spacing, font } from '../src/theme/tokens';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordRef = useRef<TextInputType>(null);

  const handleSubmit = async () => {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const { token, user } = await login(email, password);
      useAuth.getState().setSession(token, user);
      router.replace('/home');
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen title="Login" scroll>
      <View style={styles.container}>
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          testID="auth.login.emailInput"
          accessibilityLabel="Email"
        />

        <View style={styles.passwordRow}>
          <View style={styles.passwordField}>
            <TextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              testID="auth.login.passwordInput"
              accessibilityLabel="Password"
            />
          </View>
          <Pressable
            onPress={() => setShowPassword((v) => !v)}
            style={styles.eyeButton}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁'}</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => {/* Forgot Password — coming soon */}}
          accessibilityRole="link"
          style={styles.forgotLink}
        >
          <Text style={styles.linkText}>Forgot Password?</Text>
        </Pressable>

        <Button
          title="Login"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          testID="login.submit"
        />

        <Pressable
          onPress={() => {/* Login with mobile — coming soon */}}
          accessibilityRole="link"
          style={styles.mobileLink}
        >
          <Text style={styles.linkText}>Login with mobile number</Text>
        </Pressable>

        <Pressable
          onPress={() => {/* Sign Up — coming soon */}}
          accessibilityRole="link"
          style={styles.signUpLink}
        >
          <Text style={styles.linkText}>Sign Up</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.bg,
  },
  errorBanner: {
    backgroundColor: colors.dangerBg,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.danger,
    fontSize: font.sm,
  },
  passwordRow: {
    position: 'relative',
  },
  passwordField: {
    flex: 1,
  },
  eyeButton: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.md + 10,
    padding: spacing.xs,
  },
  eyeText: {
    fontSize: 18,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
  },
  mobileLink: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  signUpLink: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  linkText: {
    color: colors.primary,
    fontSize: font.md,
  },
});
