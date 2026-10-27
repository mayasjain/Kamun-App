import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#171A16',
    background: '#F5F1E8',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#F5E6A8',
    textSecondary: '#5E625A',
    primary: '#173D2C',
    primarySoft: '#E3ECE5',
    accent: '#D5A900',
    danger: '#B42318',
    border: '#D8D2C4',
  },
  dark: {
    text: '#F7F3E9',
    background: '#10130F',
    backgroundElement: '#1B201B',
    backgroundSelected: '#3B3519',
    textSecondary: '#B7B9B1',
    primary: '#E5C447',
    primarySoft: '#263329',
    accent: '#F0C928',
    danger: '#FF8A80',
    border: '#343A32',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: { serif: 'ui-serif' },
  default: { serif: 'serif' },
  web: { serif: 'var(--font-serif)' },
});

export const Spacing = {
  one: 4,
  two: 8,
  twoAndHalf: 12,
  three: 16,
  four: 24,
  five: 32,
  six: 40,
  seven: 48,
} as const;

export const Radius = {
  control: 12,
  card: 16,
  feature: 24,
  pill: 999,
} as const;

export const Brand = {
  black: '#0A0B09',
  gold: '#F0C928',
  goldDark: '#A77E00',
  cream: '#F5F1E8',
  pine: '#173D2C',
  white: '#FFFFFF',
  parchment: '#FFFCF6',
  burgundy: '#8E2E2B',
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80, web: 112 }) ?? 0;
export const MaxContentWidth = 800;
