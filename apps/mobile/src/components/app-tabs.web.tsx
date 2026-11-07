import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, View, StyleSheet, useWindowDimensions } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { primaryNavigation } from '@/constants/navigation';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ flex: 1, minHeight: 0 }} />
      <TabList asChild>
        <CustomTabList>
          {primaryNavigation.map((item) => (
            <TabTrigger key={item.name} name={item.name === 'index' ? 'home' : item.name} href={item.href} asChild>
              <TabButton>{item.label}</TabButton>
            </TabTrigger>
          ))}
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

function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable {...props} style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}>
      <ThemedView
        type={isFocused ? 'backgroundSelected' : 'backgroundElement'}
        style={styles.tabButtonView}>
        <ThemedText style={[styles.tabLabel, isFocused && styles.tabLabelActive]} type="small" themeColor={isFocused ? 'primary' : 'textSecondary'}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

function CustomTabList(props: TabListProps) {
  const { width } = useWindowDimensions();
  return (
    <View {...props} style={styles.tabListContainer}>
      <ThemedView type="backgroundElement" style={styles.innerContainer}>
        {width >= 650 ? <ThemedText type="smallBold" style={styles.brandText}>
          KAMUN 2026
        </ThemedText> : null}

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
  brandText: {
    marginRight: 'auto',
    paddingHorizontal: Spacing.two,
    letterSpacing: 0.8,
  },
  pressed: {
    opacity: 0.7,
  },
  tabButton: { flex: 1, minWidth: 0 },
  hiddenTab: { display: 'none' },
  tabLabel: { fontSize: 12, textAlign: 'center' },
  tabLabelActive: { fontWeight: '700' },
  tabButtonView: {
    minHeight: 48,
    justifyContent: 'center',
    paddingVertical: Spacing.one,
    paddingHorizontal: 2,
    borderRadius: Spacing.three,
  },
});
