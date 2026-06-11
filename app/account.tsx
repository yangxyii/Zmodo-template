/**
 * Me / Profile screen — rebuilt to match the native Zmodo iOS design.
 * Exported as default so app/(tabs)/me.tsx (which re-exports this) and the
 * standalone /account route both render it.
 *
 * IMPORTANT: testID="settings.logoutButton" is preserved on the Log out row
 * so that app/__tests__/account.test.tsx continues to pass unchanged.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  type ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { logout } from '../src/api/auth';
import { useAuth } from '../src/store/authStore';
import { colors, spacing, font } from '../src/theme/tokens';
import { SettingsRow } from '../src/components/SettingsRow';
import { CardGroup } from '../src/components/CardGroup';

// ─── Asset imports ────────────────────────────────────────────────────────────
const IMG_MAIL = require('../assets/zmodo/mine_message.png') as ImageSourcePropType;
const IMG_AVATAR = require('../assets/zmodo/avatar_default.png') as ImageSourcePropType;
const IMG_SUPPORT = require('../assets/zmodo/icon_mine_support.png') as ImageSourcePropType;
const IMG_SHARE = require('../assets/zmodo/icon_share.png') as ImageSourcePropType;
const IMG_MOMENTS = require('../assets/zmodo/icon_moments.png') as ImageSourcePropType;
const IMG_PAYMENT = require('../assets/zmodo/icon_payment.png') as ImageSourcePropType;
const IMG_ORDERS = require('../assets/zmodo/icon_orders.png') as ImageSourcePropType;
const IMG_SETTINGS = require('../assets/zmodo/icon_system_setting.png') as ImageSourcePropType;
const IMG_HELP = require('../assets/zmodo/icon_help.png') as ImageSourcePropType;
const IMG_LOGOUT = require('../assets/zmodo/icon_logout.png') as ImageSourcePropType;

// ─── Component ────────────────────────────────────────────────────────────────
export default function AccountScreen() {
  const router = useRouter();
  const token = useAuth((s) => s.token);
  const user = useAuth((s) => s.user);
  const [loggingOut, setLoggingOut] = useState(false);

  const displayEmail =
    user?.email ?? user?.nickname ?? user?.username ?? '';

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout(token!);
    } finally {
      useAuth.getState().clear();
      router.replace('/welcome');
    }
  };

  const handleSystemSettings = () => {
    router.push('/system-settings');
  };

  // Phase-1 placeholder handler
  const comingSoon = () => {
    // TODO(phase-2): navigate to the relevant sub-page
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* ── Top-right mail button ─────────────────────────────────────── */}
      <View style={styles.topBar}>
        <Pressable
          style={styles.mailButton}
          onPress={comingSoon}
          testID="me.mail"
          accessibilityLabel="Messages"
          accessibilityRole="button"
        >
          <Image source={IMG_MAIL} style={styles.mailIcon} resizeMode="contain" />
          {/* Red notification badge */}
          <View style={styles.mailBadge} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar block ─────────────────────────────────────────────── */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            <Image
              source={IMG_AVATAR}
              style={styles.avatar}
              resizeMode="cover"
            />
            {/* Red dot badge on avatar */}
            <View style={styles.avatarBadge} />
          </View>
          <Text style={styles.emailText} numberOfLines={1}>
            {displayEmail}
          </Text>
        </View>

        {/* ── Card A: Contact Support ───────────────────────────────────── */}
        <CardGroup style={styles.card}>
          <SettingsRow
            iconImage={IMG_SUPPORT}
            label="Contact Support"
            onPress={comingSoon}
            testID="me.row.contactSupport"
          />
        </CardGroup>

        {/* ── Card B: Sharing / Moments / Payment / Orders ─────────────── */}
        <CardGroup style={styles.card}>
          <SettingsRow
            iconImage={IMG_SHARE}
            label="Sharing"
            onPress={comingSoon}
            testID="me.row.sharing"
          />
          <SettingsRow
            iconImage={IMG_MOMENTS}
            label="Moments"
            onPress={comingSoon}
            testID="me.row.moments"
          />
          <SettingsRow
            iconImage={IMG_PAYMENT}
            label="Payment Management"
            onPress={comingSoon}
            testID="me.row.payment"
          />
          <SettingsRow
            iconImage={IMG_ORDERS}
            label="Order History"
            onPress={comingSoon}
            testID="me.row.orders"
          />
        </CardGroup>

        {/* ── Card C: System Settings / Help ───────────────────────────── */}
        <CardGroup style={styles.card}>
          <SettingsRow
            iconImage={IMG_SETTINGS}
            label="System Settings"
            onPress={handleSystemSettings}
            testID="me.row.systemSettings"
          />
          <SettingsRow
            iconImage={IMG_HELP}
            label="Help"
            onPress={comingSoon}
            testID="me.row.help"
          />
        </CardGroup>

        {/* ── Card D: Log out ──────────────────────────────────────────── */}
        <CardGroup style={styles.card}>
          <SettingsRow
            iconImage={IMG_LOGOUT}
            label="Log out"
            onPress={() => {
              if (!loggingOut) handleLogout().catch(() => {});
            }}
            testID="settings.logoutButton"
            accessibilityLabel="Log out"
          />
        </CardGroup>

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'android' ? 8 : 4,
    paddingBottom: 4,
  },
  mailButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mailIcon: {
    width: 28,
    height: 28,
    tintColor: '#4A4A4A',
  },
  mailBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#BA0C2F',
    borderWidth: 1,
    borderColor: colors.pageBg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  // Avatar section
  avatarSection: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 32,
  },
  avatarWrap: {
    position: 'relative',
    width: 72,
    height: 72,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#D0D0D0',
  },
  avatarBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#BA0C2F',
    borderWidth: 1.5,
    borderColor: colors.pageBg,
  },
  emailText: {
    marginTop: 13,
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  // Card spacing
  card: {
    marginTop: 16,
  },
  bottomPad: {
    height: 16,
  },
});
