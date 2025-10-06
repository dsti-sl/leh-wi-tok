// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/

import React from 'react';

import { View, ViewStyle } from 'react-native';

import Ionicons from '@expo/vector-icons/Ionicons';

type TabItemProps = {
  tabStyle: ViewStyle;
  activeStyle?: ViewStyle;
  activeIcon: 'text';
  icon: 'text';
  size?: number;
  focused: boolean;
  color: string;
};

const TabBarIcon = ({
  tabStyle,
  activeStyle,
  activeIcon,
  icon,
  size = 24,
  color,
  focused,
}: TabItemProps) => {
  return (
    <View style={[tabStyle, focused && activeStyle]}>
      <Ionicons name={focused ? activeIcon : icon} color={color} size={size} />
    </View>
  );
};

export default TabBarIcon;
