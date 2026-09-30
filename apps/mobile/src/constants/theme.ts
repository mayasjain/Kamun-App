/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#102A43',
    background: '#F7F9FC',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#DCEAF2',
    textSecondary: '#52667A',
    primary: '#0B6E69',
    primarySoft: '#DDF4F1',
    accent: '#D79B28',
    danger: '#B42318',
    border: '#D9E2EC',
  },
  dark: {
    text: '#F7FAFC',
    background: '#0B1620',
    backgroundElement: '#152633',
    backgroundSelected: '#244254',
    textSecondary: '#A9BBC9',
    primary: '#54C7BE',
    primarySoft: '#173B3A',
    accent: '#F0BF5A',
    danger: '#FF8A80',
    border: '#2D4657',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
