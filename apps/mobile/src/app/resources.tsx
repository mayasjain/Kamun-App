import { useRef, useState } from 'react';
import { Image, Linking, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { ContentCard } from '@/components/content-card';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { useConferenceContent } from '@/contexts/conference-content';
import { useTheme } from '@/hooks/use-theme';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { readableDocumentUrl } from '@/lib/document-link';
import { documentCover } from '@/lib/document-covers';

export default function ResourcesScreen() {
  const theme = useTheme();
  const { width, fontScale } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState(0);
  const availableWidth = containerWidth || Math.min(width - (width < 600 ? 32 : 48), MaxContentWidth - 48);
  const columns = fontScale > 1.3 || availableWidth < 300 ? 1 : availableWidth >= 672 ? 3 : 2;
  const tileWidth = (availableWidth - Spacing.three * (columns - 1)) / columns;
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
      const origin = Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : undefined;
      await Linking.openURL(readableDocumentUrl(parsed.href, origin));
    } catch {
      setDocumentError({ id, message: 'We could not open this document. Check your connection and tap the PDF cover to try again.' });
    } finally {
      opening.current = false;
      setOpeningId(null);
    }
  }

  function renderResource(resource: (typeof resources)[number]) {
    const cover = documentCover(resource.url);
    return (
      <View key={resource.id} style={{ width: tileWidth }}>
        <Pressable
          accessibilityLabel={`Open ${resource.title}`}
          accessibilityRole="link"
          accessibilityHint="Opens the PDF"
          accessibilityState={{ disabled: openingId !== null, busy: openingId === resource.id }}
          disabled={openingId !== null}
          onPress={() => void openDocument(resource.id, resource.url)}
          style={({ pressed }) => ({ borderRadius: 18, opacity: pressed || openingId === resource.id ? 0.7 : 1 })}>
          <View style={[styles.coverFrame, { borderColor: theme.border }]}>
            {cover ? <Image source={cover} resizeMode="contain" style={styles.cover} accessible={false} /> : (
              <View style={styles.fallback}>
                <ThemedText type="smallBold" themeColor="primary">PDF</ThemedText>
                <ThemedText type="smallBold" style={styles.caption}>{resource.title}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">Tap to open</ThemedText>
              </View>
            )}
          </View>
          <ThemedText type="smallBold" style={styles.caption}>{resource.title}</ThemedText>
          {openingId === resource.id ? <ThemedText type="small" themeColor="primary" style={styles.meta}>Opening…</ThemedText> : null}
        </Pressable>
        {documentError?.id === resource.id ? <ThemedText accessibilityRole="alert" accessibilityLiveRegion="polite" type="small" themeColor="danger" style={styles.feedback}>{documentError.message}</ThemedText> : null}
      </View>
    );
  }

  return (
    <Screen eyebrow="PREPARE" title="Resources" subtitle="Your conference reading, all in one place." onRefresh={() => void refresh()} refreshing={isLoading}>
      {generalResources.length ? (
        <View style={styles.section}>
          <ThemedText type="smallBold" style={{ color: theme.primary }}>CONFERENCE ESSENTIALS</ThemedText>
          <View style={styles.grid} onLayout={event => setContainerWidth(event.nativeEvent.layout.width)}>{generalResources.map(renderResource)}</View>
        </View>
      ) : null}
      {committeeResources.length ? (
        <View style={styles.section}>
          <ThemedText type="smallBold" style={{ color: theme.primary }}>STUDY GUIDE</ThemedText>
          <View style={styles.grid} onLayout={event => setContainerWidth(event.nativeEvent.layout.width)}>{committeeResources.map(renderResource)}</View>
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
      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.footerText}>
          © 2026 KAMUN. All rights reserved.{'\n'}Conference materials are for participant use only.
        </ThemedText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  footer: { marginTop: 16, paddingTop: 20, borderTopWidth: StyleSheet.hairlineWidth },
  footerText: { textAlign: 'center', fontSize: 12, lineHeight: 18, fontWeight: '400' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  caption: { textAlign: 'center', marginTop: Spacing.twoAndHalf },
  meta: { textAlign: 'center', marginTop: Spacing.one },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.three, gap: Spacing.two },
  coverFrame: { width: '100%', aspectRatio: 360 / 510, borderWidth: 1, borderRadius: 8, overflow: 'hidden', backgroundColor: '#FFFFFF' },
  cover: { width: '100%', height: '100%' },
  section: { gap: 12 },
  feedback: { paddingTop: 12 },
  retry: { minHeight: 48, paddingVertical: 12 },
});
