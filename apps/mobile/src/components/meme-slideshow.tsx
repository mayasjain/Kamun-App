import { useEffect, useState } from 'react';
import { Image, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import type { Meme } from '@/lib/committee-memes';
import { supabase } from '@/lib/supabase';

export function MemeSlideshow({ slides, title, onClose }: { slides: Meme[]; title: string; onClose: () => void }) {
 const [index, setIndex] = useState(0);
 const [playing, setPlaying] = useState(false);
 const [urls, setUrls] = useState<Record<string, string>>({});
 const [failedUri, setFailedUri] = useState<string | null>(null);
 const slide = slides[index];
 const uri = slide ? urls[slide.id] ?? slide.imageUrl : '';
 const failed = failedUri === uri;
 if (failedUri !== null && failedUri !== uri) setFailedUri(null);
 useEffect(() => {
  if (!playing || slides.length < 2) return;
  const timer = setInterval(() => setIndex(i => (i + 1) % slides.length), 8000);
  return () => clearInterval(timer);
 }, [playing, slides.length]);
 useEffect(() => {
  if (Platform.OS !== 'web') return;
  const key = (event: KeyboardEvent) => {
   if (!['ArrowRight', 'ArrowLeft', 'Escape', ' '].includes(event.key)) return;
   event.preventDefault();
   event.stopImmediatePropagation();
   if (event.repeat) return;
   if (event.key === 'Escape') onClose();
   if (event.key === 'ArrowRight') setIndex(i => Math.min(slides.length - 1, i + 1));
   if (event.key === 'ArrowLeft') setIndex(i => Math.max(0, i - 1));
   if (event.key === ' ') {
    setPlaying(false);
    setIndex(i => Math.min(slides.length - 1, i + 1));
   }
  };
  // Intercept before React Native Web's focused buttons handle Space.
  // Suppress keyup too: Pressable can activate Close when Space is released.
  const release = (event: KeyboardEvent) => {
   if (event.key !== ' ') return;
   event.preventDefault();
   event.stopImmediatePropagation();
  };
  document.addEventListener('keydown', key, true);
  document.addEventListener('keyup', release, true);
  return () => {
   document.removeEventListener('keydown', key, true);
   document.removeEventListener('keyup', release, true);
  };
 }, [onClose, slides.length]);
 useEffect(() => {
  let active = true;
  const refresh = async () => {
   if (!supabase) return;
   const { data, error } = await supabase.storage.from('committee-memes').createSignedUrls(slides.map(s => s.image_path), 300);
   if (!active || error || !data) return;
   setUrls(Object.fromEntries(slides.map(s => [s.id, data.find(u => u.path === s.image_path)?.signedUrl || s.imageUrl])));
  };
  const timer = setInterval(() => { void refresh().catch(() => {}); }, 180000);
  return () => { active = false; clearInterval(timer); };
 }, [slides]);
 return <Modal visible animationType="fade" onRequestClose={onClose} presentationStyle="fullScreen">
  <SafeAreaView style={styles.root}>
   <View style={styles.bar}>
    <ThemedText style={styles.title}>{title} · Slideshow</ThemedText>
    <Control label="Close" onPress={onClose} />
   </View>
   <View style={styles.stage}>
    {failed || !uri ? <ThemedText style={styles.text}>Photo unavailable. Close and restart the slideshow to retry.</ThemedText> : <Image key={uri} source={{ uri }} accessibilityLabel={slide?.caption || 'Committee meme'} resizeMode="contain" style={styles.image} onError={() => { setFailedUri(uri); setPlaying(false); }} />}
   </View>
   {slide?.caption ? <ScrollView style={styles.caption}><ThemedText style={styles.captionText}>{slide.caption}</ThemedText></ScrollView> : null}
   <View style={styles.controls}>
    <Control label="← Previous" disabled={index === 0} onPress={() => { setPlaying(false); setIndex(i => i - 1); }} />
    <ThemedText accessibilityLiveRegion="polite" style={styles.text}>{index + 1} / {slides.length}</ThemedText>
    <Control label={playing ? 'Pause' : 'Autoplay · 8s'} disabled={slides.length < 2} onPress={() => setPlaying(p => !p)} />
    <Control label="Next →" disabled={index === slides.length - 1} onPress={() => { setPlaying(false); setIndex(i => i + 1); }} />
   </View>
  </SafeAreaView>
 </Modal>;
}
function Control({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
 return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, (pressed || disabled) && { opacity: 0.4 }]}><ThemedText style={styles.text}>{label}</ThemedText></Pressable>;
}
const styles = StyleSheet.create({
 root: { flex: 1, backgroundColor: '#0A0B09', padding: 16 },
 bar: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
 title: { color: '#F5F1E8', flexGrow: 1, fontWeight: '500' },
 text: { color: '#F5F1E8', fontSize: 14 },
 stage: { flex: 1, minHeight: 80, justifyContent: 'center', alignItems: 'center', marginVertical: 12 },
 image: { width: '100%', height: '100%' },
 caption: { maxHeight: 100, flexGrow: 0, marginBottom: 12 },
 captionText: { color: '#F5F1E8', textAlign: 'center', fontSize: 18, lineHeight: 26 },
 controls: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 12 },
 button: { minHeight: 48, paddingHorizontal: 16, justifyContent: 'center', borderRadius: 12, backgroundColor: '#263329' },
});
