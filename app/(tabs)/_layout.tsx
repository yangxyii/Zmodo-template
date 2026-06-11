import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
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
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#9C9C9C',
        tabBarLabelStyle: styles.tabLabel,
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
        name="cloud"
        options={{
          title: 'Cloud',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              onSource={require('../../assets/zmodo/tab_cloud_on.png')}
              offSource={require('../../assets/zmodo/tab_cloud_off.png')}
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
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#C8C8C8',
    height: 50,
  },
  tabLabel: {
    fontSize: 10,
    marginBottom: 2,
  },
  tabIcon: {
    width: 24,
    height: 24,
  },
});
