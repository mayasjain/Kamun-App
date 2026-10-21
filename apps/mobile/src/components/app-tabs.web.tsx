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

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ flex: 1, minHeight: 0 }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton>Home</TabButton>
          </TabTrigger>
          <TabTrigger name="schedule" href="/schedule" asChild>
            <TabButton>Schedule</TabButton>
          </TabTrigger>
          <TabTrigger name="updates" href="/updates" asChild>
            <TabButton>Updates</TabButton>
          </TabTrigger>
          <TabTrigger name="resources" href="/resources" asChild>
            <TabButton>Resources</TabButton>
          </TabTrigger>
          <TabTrigger name="more" href="/more" asChild>
            <TabButton>More</TabButton>
          </TabTrigger>
          <TabTrigger name="committees" href="/committees" style={styles.hiddenTab} />
          <TabTrigger name="emergency" href="/emergency" style={styles.hiddenTab} />
          <TabTrigger name="gossip" href="/gossip" style={styles.hiddenTab} />
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable {...props} style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}>
      <ThemedView
        type={isFocused ? 'backgroundSelected' : 'backgroundElement'}
        style={styles.tabButtonView}>
        <ThemedText style={styles.tabLabel} type="small" themeColor={isFocused ? 'text' : 'textSecondary'}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
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
    padding: Spacing.two,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.five,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: 2,
    maxWidth: MaxContentWidth,
  },
  brandText: {
    marginRight: 'auto',
  },
  pressed: {
    opacity: 0.7,
  },
  tabButton: { flex: 1, minWidth: 0 },
  hiddenTab: { display: 'none' },
  tabLabel: { fontSize: 11, textAlign: 'center' },
  tabButtonView: {
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: Spacing.one,
    paddingHorizontal: 2,
    borderRadius: Spacing.three,
  },
});
