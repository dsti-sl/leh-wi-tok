import { TextStyle } from 'react-native';

/**
 * Central typography tokens to keep text sizing consistent and accessible.
 * Line heights follow accessibility guidance for comfortable reading.
 */
export const typography = {
  headingXL: { fontSize: 32, lineHeight: 40, fontWeight: '700' },
  headingLg: { fontSize: 26, lineHeight: 34, fontWeight: '700' },
  headingMd: { fontSize: 22, lineHeight: 30, fontWeight: '700' },
  subheading: { fontSize: 18, lineHeight: 26, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
  caption: { fontSize: 14, lineHeight: 20 },
  label: { fontSize: 15, lineHeight: 22, fontWeight: '600' },
  button: { fontSize: 17, lineHeight: 24, fontWeight: '700' },
} satisfies Record<string, TextStyle>;
