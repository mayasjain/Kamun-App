import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, View, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { usePathname } from 'expo-router';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { primaryNavigation } from '@/constants/navigation';
import { createNavigationScrollTracker } from '@/lib/navigation-scroll';

// Detail destinations retain the visible selection of their parent section.
const parentSections: Record<string, string> = {
  '/privacy': 'more',
  '/committees': 'resources',
  '/emergency': 'index',
  '/memes': 'index',
  '/gossip': 'index',
  '/partners': 'index',
  '/secretariat': 'index',
};

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ flex: 1, minHeight: 0 }} />
      <TabList asChild>
        <CustomTabList>
          {primaryNavigation.map((item) => (
            <TabTrigger key={item.name} name={item.name === 'index' ? 'home' : item.name} href={item.href} asChild>
              <TabButton section={item.name}>{item.label}</TabButton>
            </TabTrigger>
          ))}
          <TabTrigger name="privacy" href="/privacy" style={styles.hiddenTab} />
          <TabTrigger name="committees" href="/committees" style={styles.hiddenTab} />
          <TabTrigger name="emergency" href="/emergency" style={styles.hiddenTab} />
          <TabTrigger name="memes" href="/memes" style={styles.hiddenTab} />
          <TabTrigger name="gossip" href="/gossip" style={styles.hiddenTab} />
          <TabTrigger name="partners" href="/partners" style={styles.hiddenTab} />
          <TabTrigger name="secretariat" href="/secretariat" style={styles.hiddenTab} />
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

function TabButton({ children, isFocused, section, ...props }: TabTriggerSlotProps & { section: string }) {
  const pathname = usePathname().replace(/\/$/, '');
  const selected = parentSections[pathname] ? parentSections[pathname] === section : isFocused;
  return (
    <Pressable {...props} accessibilityRole="link" aria-current={selected ? 'location' : undefined} style={({ pressed }) => [styles.tabButton, section === 'resources' && styles.resourcesTab, section === 'schedule' && styles.scheduleTab, pressed && styles.pressed]}>
      <ThemedView
        nativeID={`app-navigation-item-${section}`}
        type={selected ? 'backgroundSelected' : 'backgroundElement'}
        style={[styles.tabButtonView, { backgroundColor: selected ? 'rgba(245, 230, 168, 0.6)' : 'transparent' }]}>
        <ThemedText numberOfLines={1} style={[styles.tabLabel, selected && styles.tabLabelActive]} type="small" themeColor={selected ? 'primary' : 'textSecondary'}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

function CustomTabList(props: TabListProps) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const [scrollState, setScrollState] = useState({ pathname, compact: false });
  const compact = scrollState.pathname === pathname && scrollState.compact;
  useEffect(() => {
    const reset = requestAnimationFrame(() => setScrollState({ pathname, compact: false }));
    const trackers = new WeakMap<HTMLElement, ReturnType<typeof createNavigationScrollTracker>>();
    const onScroll = (event: Event) => {
      const target = event.target === document ? document.scrollingElement : event.target;
      if (!(target instanceof HTMLElement) || target.tagName === 'TEXTAREA'
        || target.isContentEditable || target.scrollHeight <= target.clientHeight + 1) return;
      let track = trackers.get(target);
      if (!track) {
        track = createNavigationScrollTracker();
        trackers.set(target, track);
      }
      const next = track(target.scrollTop, target.scrollHeight - target.clientHeight);
      setScrollState(previous => previous.pathname === pathname && previous.compact === next
        ? previous : { pathname, compact: next });
    };
    // ScrollView scroll events don't bubble; capture catches every page's scroll container.
    document.addEventListener('scroll', onScroll, { capture: true, passive: true });
    return () => {
      cancelAnimationFrame(reset);
      document.removeEventListener('scroll', onScroll, true);
    };
  }, [pathname]);
  return (
    <View {...props} style={[styles.tabListContainer, { paddingBottom: Math.max(8, insets.bottom) }]}>
      <ThemedView type="backgroundElement" nativeID={compact ? 'app-navigation-glass-compact' : 'app-navigation-glass'} style={[styles.innerContainer, compact && styles.compactContainer]}>
        {props.children}

      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    flexGrow: 0,
    gap: 4,
    maxWidth: MaxContentWidth,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
  },
  compactContainer: { width: '92%', maxWidth: MaxContentWidth - 80, paddingVertical: 2 },
  pressed: {
    opacity: 0.7,
  },
  tabButton: { flex: 1, minWidth: 44 },
  resourcesTab: { flex: 1.35 },
  scheduleTab: { flex: 1.15 },
  hiddenTab: { display: 'none' },
  tabLabel: { fontSize: 12, textAlign: 'center' },
  tabLabelActive: { fontWeight: '500' },
  tabButtonView: {
    minHeight: 48,
    justifyContent: 'center',
    paddingVertical: Spacing.one,
    paddingHorizontal: 2,
    borderRadius: 26,
  },
});
