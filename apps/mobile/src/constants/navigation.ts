import type { Href } from 'expo-router';

export const primaryNavigation = [
  { name: 'index', label: 'Home', href: '/', sfIcon: 'house.fill', materialIcon: 'home' },
  { name: 'schedule', label: 'Schedule', href: '/schedule', sfIcon: 'calendar', materialIcon: 'calendar_month' },
  { name: 'updates', label: 'Updates', href: '/updates', sfIcon: 'bell.fill', materialIcon: 'notifications' },
  { name: 'resources', label: 'Resources', href: '/resources', sfIcon: 'doc.fill', materialIcon: 'description' },
  { name: 'more', label: 'More', href: '/more', sfIcon: 'ellipsis.circle', materialIcon: 'more_horiz' },
] as const satisfies readonly {
  name: 'index' | 'schedule' | 'updates' | 'resources' | 'more';
  label: string;
  href: Href;
  sfIcon: string;
  materialIcon: string;
}[];
