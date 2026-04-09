/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useColorScheme } from 'react-native';

const themeColors = {
  light: {
    text: '#11181C',
    background: '#FFFFFF',
    tint: '#0a7ea4',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: '#0a7ea4',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: '#FFFFFF',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#FFFFFF',
  },
} as const;

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof themeColors.light,
) {
  const theme = useColorScheme() ?? 'light';
  const activeTheme = theme === 'dark' ? 'dark' : 'light';
  const colorFromProps = props[activeTheme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return themeColors[activeTheme][colorName];
  }
}
