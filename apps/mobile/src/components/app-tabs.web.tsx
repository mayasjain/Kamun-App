import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, View, StyleSheet } from 'react-native';
import { usePathname } from 'expo-router';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { primaryNavigation } from '@/constants/navigation';

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
    <Pressable {...props} accessibilityRole="link" aria-current={selected ? 'location' : undefined} style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}>
      <ThemedView
        type={selected ? 'backgroundSelected' : 'backgroundElement'}
        style={styles.tabButtonView}>
        <ThemedText style={[styles.tabLabel, selected && styles.tabLabelActive]} type="small" themeColor={selected ? 'primary' : 'textSecondary'}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

function CustomTabList(props: TabListProps) {
  const insets = useSafeAreaInsets();
  return (
    <View {...props} style={[styles.tabListContainer, { paddingBottom: Math.max(8, insets.bottom) }]}>
      <ThemedView type="backgroundElement" style={styles.innerContainer}>
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
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: 4,
    maxWidth: MaxContentWidth,
    borderWidth: 1,
    borderColor: 'rgba(127, 127, 127, 0.22)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
  },
  pressed: {
    opacity: 0.7,
  },
  tabButton: { flex: 1, minWidth: 0 },
  hiddenTab: { display: 'none' },
  tabLabel: { fontSize: 12, textAlign: 'center' },
  tabLabelActive: { fontWeight: '500' },
  tabButtonView: {
    minHeight: 48,
    justifyContent: 'center',
    paddingVertical: Spacing.one,
    paddingHorizontal: 2,
    borderRadius: Spacing.three,
  },
});
