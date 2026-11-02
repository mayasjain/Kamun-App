import { useRef, useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, View } from 'react-native';

import { ContentCard } from '@/components/content-card';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { useConferenceContent } from '@/contexts/conference-content';
import { useTheme } from '@/hooks/use-theme';
import { documentCover } from '@/lib/document-covers';

export default function ResourcesScreen() {
  const theme = useTheme();
  const { content, error, isLoading, refresh } = useConferenceContent();
  const resources = content?.resources ?? [];
  const opening = useRef(false);
  const [documentError, setDocumentError] = useState<{ id: string; message: string } | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const generalResources = resources.filter((resource) => resource.committeeId === null);
  const committeeResources = resources.filter((resource) => resource.committeeId !== null);

  async function openDocument(id: string, url: string) {
    if (opening.current) return;
    opening.current = true;
    setOpeningId(id);
    setDocumentError(null);
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:' || parsed.username || parsed.password) {
        setDocumentError({ id, message: 'This document link is unavailable. Please contact the Secretariat.' });
        return;
      }
      // Open directly to preserve the tap gesture in browsers.
      await Linking.openURL(parsed.href);
    } catch {
      setDocumentError({ id, message: 'We could not open this document. Check your connection and tap Open document to try again.' });
    } finally {
      opening.current = false;
      setOpeningId(null);
    }
  }

  function renderResource(resource: (typeof resources)[number]) {
    const cover = documentCover(resource.url);
    return (
      <ContentCard key={resource.id} label={resource.kind.replaceAll('_', ' ').toUpperCase()} title={resource.title}
        preview={cover ? (
          <Pressable accessibilityRole="link" accessibilityLabel={`Open ${resource.title} from its cover`}
            disabled={openingId !== null} accessibilityState={{ disabled: openingId !== null }}
            onPress={() => void openDocument(resource.id, resource.url)}
            style={({ pressed }) => [styles.coverFrame, { borderColor: theme.border, opacity: pressed ? 0.7 : 1 }]}>
            <Image source={cover} resizeMode="contain" style={styles.cover} accessible={false} />
          </Pressable>
        ) : undefined}>
        {resource.committeeId ? <ThemedText type="small" themeColor="textSecondary">{content?.committees.find((committee) => committee.id === resource.committeeId)?.abbreviation ?? 'Committee document'}</ThemedText> : null}
        <View style={styles.documentFooter}>
          <Pressable
            accessibilityLabel={`Open ${resource.title}`}
            accessibilityRole="link"
            accessibilityHint="Opens outside KAMUN"
            accessibilityState={{ disabled: openingId !== null, busy: openingId === resource.id }}
            disabled={openingId !== null}
            style={({ pressed }) => [styles.openButton, { backgroundColor: theme.primary, opacity: pressed ? 0.7 : 1 }]}
            hitSlop={8}
            onPress={() => void openDocument(resource.id, resource.url)}>
            <ThemedText type="smallBold" style={[styles.open, { color: '#FFFFFF' }]}>
              {openingId === resource.id ? 'Opening…' : 'Open document'}
            </ThemedText>
          </Pressable>
        </View>
        {documentError?.id === resource.id ? <ThemedText accessibilityRole="alert" accessibilityLiveRegion="polite" type="small" themeColor="danger" style={styles.feedback}>{documentError.message}</ThemedText> : null}
      </ContentCard>
    );
  }

  return (
    <Screen eyebrow="PREPARE" title="Resources" subtitle="Your conference reading, all in one place.">
      {generalResources.length ? (
        <View style={styles.section}>
          <ThemedText type="smallBold" style={{ color: theme.primary }}>CONFERENCE ESSENTIALS</ThemedText>
          {generalResources.map(renderResource)}
        </View>
      ) : null}
      {committeeResources.length ? (
        <View style={styles.section}>
          <ThemedText type="smallBold" style={{ color: theme.primary }}>COMMITTEE DOCUMENTS</ThemedText>
          {committeeResources.map(renderResource)}
        </View>
      ) : null}
      {!resources.length ? (
        <ContentCard label="DOCUMENTS" title={isLoading ? 'Loading resources…' : error ? 'Resources unavailable' : 'Your reading starts here'}>
          <ThemedText themeColor="textSecondary">The Code of Conduct, guides and committee documents will appear here when published.</ThemedText>
          {!isLoading ? (
            <Pressable accessibilityRole="button" hitSlop={8} onPress={() => void refresh()}>
              <ThemedText type="smallBold" style={[styles.retry, { color: theme.primary }]}>Check again</ThemedText>
            </Pressable>
          ) : null}
        </ContentCard>
      ) : null}
      {error ? (
        <View>
          <ThemedText accessibilityRole="alert" type="small" themeColor="danger">We could not refresh resources. Check your connection and try again.</ThemedText>
          {resources.length > 0 ? <Pressable accessibilityRole="button" disabled={isLoading} onPress={() => void refresh()}><ThemedText type="smallBold" style={[styles.retry, { color: theme.primary }]}>{isLoading ? 'Refreshing…' : 'Try again →'}</ThemedText></Pressable> : null}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  coverFrame: { width: '38%', maxWidth: 200, flexShrink: 0, aspectRatio: 360 / 510, borderWidth: 1, borderRadius: 8, overflow: 'hidden', backgroundColor: '#FFFFFF' },
  cover: { width: '100%', height: '100%' },
  section: { gap: 12 },
  documentFooter: { alignItems: 'flex-start', gap: 14, paddingTop: 14 },
  openButton: { minHeight: 48, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, justifyContent: 'center' },
  open: { flexShrink: 1 },
  feedback: { paddingTop: 12 },
  retry: { minHeight: 48, paddingVertical: 12 },
});
