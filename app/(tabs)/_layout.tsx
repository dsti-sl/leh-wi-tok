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
  const safeBottomInset = Math.max(insets.bottom, 10);
  const horizontalInset = width >= 768 ? 24 : 12;
  const maxTabBarWidth = Math.min(width - horizontalInset * 2, 760);
  const tabBarHeight = (isTablet ? 82 : 72) + safeBottomInset;
  const iconContainerSize = isTablet ? 64 : 56;
  const floatingIconOffset = isTablet ? 0 : -8;

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
                    width: maxTabBarWidth,
                    alignSelf: 'center',
                    height: tabBarHeight,
                    paddingBottom: safeBottomInset,
                    paddingTop: isTablet ? 12 : 8,
                  },
                ],
            tabBarItemStyle: [
              styles.tabBarItemStyle,
              {
                minHeight: isTablet ? 62 : 56,
                paddingTop: isTablet ? 4 : 2,
                paddingBottom: 4,
              },
            ],
            tabBarLabelStyle: [
              styles.tabLabel,
              { marginTop: isTablet ? 2 : 0 },
            ],
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
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
    borderRadius: 22,
    overflow: 'visible',
    marginBottom: 0,
    elevation: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  tabBarItemStyle: {
    bottom: 0,
    top: 0,
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  circularIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: '#F4F7F8',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    borderWidth: 0,
  },
});
