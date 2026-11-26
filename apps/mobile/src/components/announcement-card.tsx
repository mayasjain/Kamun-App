import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import type { Announcement } from '@/lib/conference-content';
import { formatAnnouncementTime } from '@/lib/date-format';

export function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const urgent = announcement.priority === 'urgent';
  const date = formatAnnouncementTime(announcement.publishedAt);
  const close = () => setOpen(false);
  const badges = <View style={styles.badges}>
    <View style={[styles.badge, { backgroundColor: theme.danger }]}><ThemedText type="smallBold" themeColor="onDanger">URGENT</ThemedText></View>
  </View>;

  return <View>
    <Pressable accessibilityRole="button" accessibilityLabel={`Read ${urgent ? 'urgent announcement: ' : ''}${announcement.title}`}
      accessibilityHint="Opens the full announcement" onPress={() => setOpen(true)}
      style={({ pressed }) => [styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border, borderLeftColor: urgent ? theme.danger : theme.primary }, pressed && styles.pressed]}>
      {urgent ? badges : null}
      <ThemedText type="smallBold" style={styles.title} numberOfLines={2}>{announcement.title}</ThemedText>
      <ThemedText themeColor="textSecondary" numberOfLines={2}>{announcement.body}</ThemedText>
      <View style={styles.cardFooter}>
        <ThemedText type="small" themeColor="textSecondary">{date}</ThemedText>
        <ThemedText type="smallBold" themeColor="primary">Read more →</ThemedText>
      </View>
    </Pressable>
    {open ? <Modal visible transparent animationType="fade" onRequestClose={close}>
      <View style={[styles.overlay, { paddingTop: Math.max(16, insets.top), paddingBottom: Math.max(16, insets.bottom) }]}>
        <Pressable accessibilityElementsHidden importantForAccessibility="no-hide-descendants" accessible={false} focusable={false} onPress={close} style={styles.backdrop} />
        <View accessibilityViewIsModal style={[styles.dialog, { backgroundColor: theme.backgroundElement, maxHeight: Math.max(160, height - Math.max(16, insets.top) - Math.max(16, insets.bottom)) }]}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.message}>
            {urgent ? badges : null}
            <ThemedText accessibilityRole="header" style={styles.dialogTitle}>{announcement.title}</ThemedText>
            <ThemedText selectable style={styles.body}>{announcement.body}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">{date}</ThemedText>
          </ScrollView>
          <View style={styles.dialogFooter}>
            <Pressable accessibilityRole="button" accessibilityLabel="Close announcement" onPress={close}
              style={({ pressed }) => [styles.closeButton, { backgroundColor: theme.primary }, pressed && styles.pressed]}>
              <ThemedText type="smallBold" themeColor="onPrimary">Close</ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal> : null}
  </View>;
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderLeftWidth: 5, borderRadius: 18, padding: 18, gap: 10 },
  title: { fontSize: 18, lineHeight: 25 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 2 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  badge: { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0, 0, 0, 0.45)' },
  dialog: { width: '100%', maxWidth: 600, borderRadius: 24, overflow: 'hidden', flexShrink: 1 },
  scroll: { flexShrink: 1 },
  message: { padding: 24, gap: 20 },
  dialogTitle: { fontSize: 23, lineHeight: 30, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 26 },
  dialogFooter: { paddingHorizontal: 24, paddingTop: 4, paddingBottom: 24 },
  closeButton: { minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  pressed: { opacity: 0.7 },
});
