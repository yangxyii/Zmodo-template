import React from 'react';
import { Image, StyleSheet } from 'react-native';
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
        // Each tab item needs ~47px (5 pad + 24 icon + 13 label + 5 pad). Give
        // the content area 50px so the label isn't clipped on web (native fonts
        // pack tighter, which is why the phone showed labels at a smaller
        // height). Plus the bottom safe-area inset to clear the home indicator.
        tabBarStyle: [
          styles.tabBar,
          { height: 58 + insets.bottom, paddingTop: 4, paddingBottom: insets.bottom + 4 },
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
    marginBottom: 0,
  },
  tabIconWrap: {
    marginTop: 2,
  },
  tabIcon: {
    width: 24,
    height: 24,
  },
});
