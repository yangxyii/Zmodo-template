import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Image,
  Animated,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getAppDisplayName, getThemeAccentHex, loadRuntimeConfig } from '../src/config';

const BG_IMAGES = [
  require('../assets/zmodo/login_bg_1.png'),
  require('../assets/zmodo/login_bg_2.png'),
  require('../assets/zmodo/login_bg_3.png'),
] as const;

const INTERVAL_MS = 4000;
const FADE_DURATION = 800;

function companyMark(displayName: string) {
  const letters = displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
  return letters || 'C';
}

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const [runtimeBrand, setRuntimeBrand] = useState({
    displayName: getAppDisplayName(),
    accent: getThemeAccentHex(),
  });
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mounted = true;
    void loadRuntimeConfig().then(() => {
      if (!mounted) return;
      setRuntimeBrand({
        displayName: getAppDisplayName(),
        accent: getThemeAccentHex(),
      });
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const next = (currentIndex + 1) % BG_IMAGES.length;
      setNextIndex(next);
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: FADE_DURATION,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setCurrentIndex(next);
          fadeAnim.setValue(0);
        }
      });
    }, INTERVAL_MS);

    return () => clearInterval(interval);
  }, [currentIndex, fadeAnim]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Base background image (current) */}
      <Image
        source={BG_IMAGES[currentIndex]}
        style={[styles.bgImage, { width, height }]}
        resizeMode="cover"
      />

      {/* Next background image (fades in) */}
      <Animated.Image
        source={BG_IMAGES[nextIndex]}
        style={[styles.bgImage, { width, height, opacity: fadeAnim }]}
        resizeMode="cover"
      />

      {/* Dark overlay for text readability */}
      <View style={styles.overlay} />

      {/* Top: Logo + tagline */}
      <View style={[styles.topContent, { marginTop: insets.top + 88 }]}>
        <View style={styles.logoMark}>
          <Text style={styles.logoText}>{companyMark(runtimeBrand.displayName)}</Text>
        </View>
        <Text style={styles.tagline}>Smart Home, Smart Life</Text>
      </View>

      {/* Bottom: Buttons */}
      <View style={[styles.bottomContent, { paddingBottom: insets.bottom + 24 }]}>
        <Pressable
          testID="welcome.login"
          accessibilityRole="button"
          accessibilityLabel="Login"
          style={[styles.loginButton, { backgroundColor: runtimeBrand.accent }]}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.loginButtonText}>Login</Text>
        </Pressable>

        <Pressable
          testID="welcome.signup"
          accessibilityRole="button"
          accessibilityLabel="Sign Up"
          style={styles.signUpButton}
          onPress={() => {/* Sign Up — coming soon */}}
        >
          <Text style={styles.signUpButtonText}>Sign Up</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  topContent: {
    alignItems: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
  },
  logoMark: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 1,
  },
  tagline: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  bottomContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 32,
  },
  loginButton: {
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  signUpButton: {
    marginTop: 20,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
