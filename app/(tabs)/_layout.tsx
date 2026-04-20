import React from 'react';

import { StyleSheet, View } from 'react-native';

import { Tabs, useSegments } from 'expo-router';

import TabBarIcon from '@/components/navigation/TabBarIcon';
import { Colors } from '@/constants/Colors';

export default function Layout() {
  const segments = useSegments();

  // Hide tab bar on child routes
  const shouldHideTabBar = segments.some(
    segment =>
      segment === 'level' ||
      segment === 'edit-profile' ||
      segment === 'category' ||
      segment === 'definition' ||
      segment === 'help' ||
      segment.startsWith('['),
  );

  return (
    <View style={styles.root}>
      <View style={styles.tabsWrapper}>
        <Tabs
          screenOptions={{
            tabBarShowLabel: true,
            tabBarStyle: shouldHideTabBar ? { display: 'none' } : styles.tabBar,
            tabBarItemStyle: styles.tabBarItemStyle,
            tabBarLabelStyle: styles.tabLabel,
            tabBarActiveTintColor: Colors.primary,
            tabBarInactiveTintColor: '#9E9E9E',
            headerShown: false,
            tabBarHideOnKeyboard: true,
          }}
        >
          <Tabs.Screen
            name="home"
            options={{
              title: 'Home',
              tabBarIcon: ({ color, focused }) => (
                <TabBarIcon
                  tabStyle={styles.iconContainer}
                  activeStyle={styles.activeTab}
                  activeIcon={'home' as 'text'}
                  icon={'home-outline' as 'text'}
                  color={color}
                  focused={focused}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="lessons"
            options={{
              title: 'Lessons',
              tabBarIcon: ({ color, focused }) => (
                <TabBarIcon
                  tabStyle={styles.iconContainer}
                  activeStyle={styles.activeTab}
                  activeIcon={'book' as 'text'}
                  icon={'book-outline' as 'text'}
                  color={color}
                  focused={focused}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="dictionary"
            options={{
              title: 'Dictionary',
              tabBarIcon: ({ color, focused }) => (
                <TabBarIcon
                  tabStyle={styles.circularIconContainer}
                  activeStyle={styles.activeTab}
                  activeIcon={'library' as 'text'}
                  icon={'library-outline' as 'text'}
                  color={color}
                  focused={focused}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="tok"
            options={{
              title: 'Tok',
              tabBarIcon: ({ color, focused }) => (
                <TabBarIcon
                  tabStyle={styles.iconContainer}
                  activeStyle={styles.activeTab}
                  activeIcon={'chatbubble' as 'text'}
                  icon={'chatbubble-outline' as 'text'}
                  color={color}
                  focused={focused}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="account"
            options={{
              title: 'Account',
              tabBarIcon: ({ color, focused }) => (
                <TabBarIcon
                  tabStyle={styles.iconContainer}
                  activeStyle={styles.activeTab}
                  activeIcon={'person' as 'text'}
                  icon={'person-outline' as 'text'}
                  color={color}
                  focused={focused}
                />
              ),
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tabsWrapper: {
    flex: 1,
  },
  tabBar: {
    borderRadius: 10,
    height: 80,
  },
  tabBarItemStyle: {
    bottom: 5,
    top: 0,
  },
  tabLabel: {
    fontSize: 12,
    display: 'flex',
  },
  circularIconContainer: {
    top: -10,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ecf0f1',
    borderWidth: 5,
    borderColor: '#f9f9f9',
  },
  iconContainer: {},
  activeTab: {
    borderWidth: 3,
    borderColor: '#f9f9f9',
    borderTopColor: Colors.primary,
  },
});
