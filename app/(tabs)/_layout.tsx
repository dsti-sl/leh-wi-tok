import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';

import TabBarIcon from '@/components/navigation/TabBarIcon';
import { Colors } from '@/constants/Colors';

export default function Layout() {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: true,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItemStyle,
        tabBarLabelStyle: styles.tabLabel,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: '#9E9E9E',
        headerShown: false,
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
              activeIcon={'book' as 'text'}
              icon={'book-outline' as 'text'}
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
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderRadius: 20,
    backgroundColor: '#f9f9f9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    borderColor: '#f9f9f9',
    paddingTop: 10,
  },
  tabBarItemStyle: { bottom: 5, top: 0 },
  tabLabel: {
    fontSize: 12,
    display: 'flex',
    top: 10,
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
  iconContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTab: {
    borderWidth: 3,
    borderColor: '#f9f9f9',
    borderTopColor: Colors.primary,
  },
});
