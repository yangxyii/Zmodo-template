import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  Image,
  type TextInput as TextInputType,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../src/components/Screen';
import { login } from '../src/api/auth';
import { useAuth } from '../src/store/authStore';
import { colors, spacing, font } from '../src/theme/tokens';

const ICON_PWD_HIDE = require('../assets/zmodo/icon_pwd_hide.png');
const ICON_PWD_SHOW = require('../assets/zmodo/icon_pwd_show.png');

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordRef = useRef<TextInputType>(null);

  const isDisabled = loading || (email.trim() === '' && password.trim() === '');

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
    <Screen title="Log In" onBack={() => router.back()} scroll>
      <View style={styles.container}>
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Email field — floating label + underline style */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput
            style={styles.fieldInput}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            testID="auth.login.emailInput"
            accessibilityLabel="Email"
            placeholderTextColor={colors.textMuted}
          />
          <View style={styles.fieldUnderline} />
        </View>

        {/* Password field — floating label + underline + eye icon */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              ref={passwordRef}
              style={[styles.fieldInput, styles.passwordInput]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              testID="auth.login.passwordInput"
              accessibilityLabel="Password"
              placeholderTextColor={colors.textMuted}
            />
            <Pressable
              onPress={() => setShowPassword((v) => !v)}
              style={styles.eyeButton}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            >
              <Image
                source={showPassword ? ICON_PWD_SHOW : ICON_PWD_HIDE}
                style={styles.eyeIcon}
                resizeMode="contain"
              />
            </Pressable>
          </View>
          <View style={styles.fieldUnderline} />
        </View>

        {/* Forgot Password */}
        <Pressable
          onPress={() => {/* Forgot Password — coming soon */}}
          accessibilityRole="link"
          style={styles.forgotLink}
        >
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </Pressable>

        {/* Log In button */}
        <Pressable
          testID="login.submit"
          accessibilityRole="button"
          accessibilityLabel="Log In"
          accessibilityState={{ disabled: isDisabled }}
          onPress={isDisabled ? undefined : handleSubmit}
          disabled={isDisabled}
          style={[
            styles.loginButton,
            isDisabled && styles.loginButtonDisabled,
          ]}
        >
          <Text style={styles.loginButtonText}>
            {loading ? 'Logging in…' : 'Log In'}
          </Text>
        </Pressable>

        {/* Login with mobile number */}
        <Pressable
          onPress={() => {/* Login with mobile — coming soon */}}
          accessibilityRole="link"
          style={styles.mobileLink}
        >
          <Text style={styles.mobileLinkText}>Login with mobile number</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
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
  /* Underline field styles */
  fieldContainer: {
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    fontSize: 13,
    color: colors.primary,
    marginBottom: 4,
    fontWeight: '500',
  },
  fieldInput: {
    fontSize: 16,
    color: colors.text,
    paddingVertical: spacing.xs,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  fieldUnderline: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: 2,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
  },
  eyeButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  eyeIcon: {
    width: 22,
    height: 22,
    tintColor: colors.primary,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginBottom: spacing.xl,
  },
  forgotText: {
    fontSize: 13,
    color: colors.textDarkGray,
  },
  loginButton: {
    backgroundColor: colors.primary,
    height: 44,
    borderRadius: 21,
    marginHorizontal: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  loginButtonDisabled: {
    backgroundColor: colors.disabledBtn,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  mobileLink: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  mobileLinkText: {
    color: colors.disabledBtn,
    fontSize: 14,
  },
});
