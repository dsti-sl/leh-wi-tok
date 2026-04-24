import React from 'react';

import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { Tabs, useSegments } from 'expo-router';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import TabBarIcon from '@/components/navigation/TabBarIcon';
import { Colors } from '@/constants/Colors';
import { isTabletLayout } from '@/utils/layout';

export default function Layout() {
  const segments = useSegments();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isTablet = isTabletLayout(width, height);
  const tabBarHeight = (isTablet ? 78 : 68) + Math.max(insets.bottom, 8);
  const iconContainerSize = isTablet ? 68 : 60;
  const floatingIconOffset = isTablet ? -14 : -10;

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
            tabBarStyle: shouldHideTabBar
              ? { display: 'none' }
              : [
                  styles.tabBar,
                  {
                    height: tabBarHeight,
                    paddingBottom: Math.max(insets.bottom, 10),
                    paddingTop: isTablet ? 10 : 6,
                  },
                ],
            tabBarItemStyle: [
              styles.tabBarItemStyle,
              { paddingTop: isTablet ? 2 : 0 },
            ],
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
                  tabStyle={{
                    ...styles.circularIconContainer,
                    top: floatingIconOffset,
                    width: iconContainerSize,
                    height: iconContainerSize,
                    borderRadius: iconContainerSize / 2,
                  }}
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
  },
  tabBarItemStyle: {
    bottom: 0,
    top: 0,
  },
  tabLabel: {
    fontSize: 12,
    display: 'flex',
  },
  circularIconContainer: {
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
