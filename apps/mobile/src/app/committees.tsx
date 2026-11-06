import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { InstagramLinks } from '@/components/instagram-links';
import { ThemedText } from '@/components/themed-text';
import { useConferenceContent } from '@/contexts/conference-content';
import { useTheme } from '@/hooks/use-theme';
import type { Committee } from '@/lib/conference-content';

function CommitteeCard({ committee }: { committee: Committee }) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const metadata = [committee.experienceLevel, committee.participantGroup].filter(Boolean).join(' · ');

  return (
    <Pressable
      accessibilityHint="Shows committee chairs and room information"
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      onPress={() => setExpanded((value) => !value)}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      <View style={styles.cardHeader}>
        <View style={[styles.abbreviation, { backgroundColor: theme.primarySoft, borderColor: committee.colour ?? theme.primary, borderWidth: 2 }]}>
          <ThemedText type="smallBold" style={styles.abbreviationText} themeColor="primary">{committee.abbreviation}</ThemedText>
        </View>
        <View style={styles.cardHeading}>
          <ThemedText type="smallBold" style={{ color: theme.primary }}>{metadata || 'COMMITTEE'}</ThemedText>
          <ThemedText type="subtitle" style={styles.committeeName}>{committee.name}</ThemedText>
        </View>
        <ThemedText
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[styles.chevron, { color: theme.primary }]}>
          {expanded ? '−' : '+'}
        </ThemedText>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />
      <ThemedText type="smallBold" themeColor="textSecondary">TOPIC</ThemedText>
      <ThemedText>{committee.topic ?? 'Topic will be announced.'}</ThemedText>

      {expanded ? (
        <View style={[styles.details, { backgroundColor: theme.primarySoft }]}>
          <View style={styles.detailBlock}>
            <ThemedText type="smallBold" style={{ color: theme.primary }}>CHAIRS</ThemedText>
            <ThemedText themeColor="textSecondary">
              {committee.chairs.length ? committee.chairs.join(' · ') : 'Chair information coming soon'}
            </ThemedText>
          </View>
          <View style={styles.detailBlock}>
            <ThemedText type="smallBold" style={{ color: theme.primary }}>ROOM</ThemedText>
            <ThemedText themeColor="textSecondary">{committee.roomName ?? 'To be announced'}</ThemedText>
          </View>
        </View>
      ) : null}
    </Pressable>
  );
}

export default function CommitteesScreen() {
  const { content, error, isLoading, refresh } = useConferenceContent();
  const committees = content?.committees ?? [];

  return (
    <Screen
      eyebrow="ACADEMIC PROGRAMME"
      title="Committees"
      subtitle="Explore the nine KAMUN 2026 committees, their topics and experience levels.">
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <ThemedText type="subtitle">{committees.length || '—'}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">committees</ThemedText>
        </View>
        <View style={styles.summaryItem}>
          <ThemedText type="subtitle">All levels</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">beginner to expert</ThemedText>
        </View>
      </View>

      {committees.map((committee) => (
        <View key={committee.id} style={styles.committeeGroup}>
          <CommitteeCard committee={committee} />
          {committee.abbreviation.toUpperCase() === 'IPC' ? <InstagramLinks only="ipc" /> : null}
        </View>
      ))}

      {!committees.length ? (
        <View style={styles.emptyState}>
          <ThemedText type="subtitle">{isLoading ? 'Loading committees…' : 'Committees unavailable'}</ThemedText>
          <ThemedText themeColor="textSecondary">
            {error ?? 'Committee information will appear here when it is published.'}
          </ThemedText>
          {!isLoading ? (
            <Pressable accessibilityRole="button" onPress={() => void refresh()}>
              <ThemedText type="smallBold" themeColor="primary">Try again</ThemedText>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  committeeGroup: { gap: 12 },
  summaryRow: { flexDirection: 'row', gap: 12 },
  summaryItem: { flex: 1, gap: 2 },
  card: { borderRadius: 18, borderWidth: 1, gap: 12, padding: 18 },
  pressed: { opacity: 0.72 },
  cardHeader: { alignItems: 'flex-start', flexDirection: 'row', gap: 12 },
  abbreviation: { alignItems: 'center', borderRadius: 10, justifyContent: 'center', minHeight: 42, minWidth: 54, paddingHorizontal: 8 },
  abbreviationText: { fontSize: 12 },
  cardHeading: { flex: 1, gap: 3 },
  committeeName: { fontSize: 18, lineHeight: 23 },
  chevron: { fontSize: 26, fontWeight: '400', lineHeight: 30 },
  divider: { height: StyleSheet.hairlineWidth },
  details: { borderRadius: 12, gap: 14, padding: 14 },
  detailBlock: { gap: 3 },
  emptyState: { alignItems: 'flex-start', gap: 8, paddingVertical: 24 },
});
