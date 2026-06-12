import React from 'react';
import { Image, StyleSheet, Text } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/tokens';

type TabIconProps = {
  focused: boolean;
  onSource: ReturnType<typeof require>;
  offSource: ReturnType<typeof require>;
};

function TabIcon({ focused, onSource, offSource }: TabIconProps) {
  return (
    <Image
      source={focused ? onSource : offSource}
      style={styles.tabIcon}
      resizeMode="contain"
    />
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Force labels under the icons; on web react-navigation can otherwise
        // drop them (it infers a label position from the layout width).
        tabBarShowLabel: true,
        tabBarLabelPosition: 'below-icon',
        // Render the label ourselves. react-navigation's built-in Label is an
        // animated component whose height it measures via onLayout; on
        // react-native-web that measurement comes back ~0, leaving the label
        // collapsed to 1px (invisible). A plain <Text> with an explicit
        // lineHeight has a real height and isn't animated.
        tabBarLabel: ({ color, children }: { color: string; children: string }) => (
          <Text numberOfLines={1} style={[styles.tabLabel, { color }]}>
            {children}
          </Text>
        ),
        // react-navigation's icon wrapper is a fixed 28px tall and the item adds
        // 5px padding top+bottom; with a 14px label that needs ~52px. We shrink
        // the icon wrapper to 24px (tabBarIconStyle below) and give the bar 52px
        // of content (60 - 4 top - 4 bottom) so the label is never clipped. Plus
        // the bottom safe-area inset to clear the home indicator.
        tabBarStyle: [
          styles.tabBar,
          { height: 60 + insets.bottom, paddingTop: 4, paddingBottom: insets.bottom + 4 },
        ],
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#9C9C9C',
        tabBarLabelStyle: styles.tabLabel,
        tabBarIconStyle: styles.tabIconWrap,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              onSource={require('../../assets/zmodo/tab_home_on.png')}
              offSource={require('../../assets/zmodo/tab_home_off.png')}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              onSource={require('../../assets/zmodo/tab_events_on.png')}
              offSource={require('../../assets/zmodo/tab_events_off.png')}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          title: 'Store',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              onSource={require('../../assets/zmodo/tab_store_on.png')}
              offSource={require('../../assets/zmodo/tab_store_off.png')}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
          title: 'Vault',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              onSource={require('../../assets/zmodo/tab_vault_on.png')}
              offSource={require('../../assets/zmodo/tab_vault_off.png')}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: 'Me',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              onSource={require('../../assets/zmodo/tab_me_on.png')}
              offSource={require('../../assets/zmodo/tab_me_off.png')}
            />
          ),
        }}
      />
      {/* Keep cloud registered so expo-router doesn't 404 if any deep link hits it */}
      <Tabs.Screen
        name="cloud"
        options={{
          href: null, // hide from tab bar
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#C8C8C8',
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 11,
    lineHeight: 14,
    marginTop: 2,
    marginBottom: 0,
    textAlign: 'center',
  },
  tabIconWrap: {
    // Override react-navigation's fixed 28px-tall icon wrapper so the label
    // below it isn't squeezed (and clipped) on web.
    height: 24,
    marginTop: 0,
  },
  tabIcon: {
    width: 24,
    height: 24,
  },
});
