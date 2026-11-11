import { Link } from 'expo-router';
import { Image, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { secretariat } from '@/constants/secretariat';
import { useTheme } from '@/hooks/use-theme';

export default function SecretariatScreen() {
 const theme = useTheme();
 const { width, fontScale } = useWindowDimensions();
 const photoSize = width < 600 ? 72 : 80;
 const photoScale = photoSize / 112;
 const compact = width < 360 || fontScale > 1.3;
 return <Screen eyebrow="KAMUN 2026" title="Secretariat" subtitle="Meet the people behind the Black Forest Summit.">
  {secretariat.map(person => <View key={person.name} style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }, compact && styles.compact]}>
   <View style={[styles.photoFrame, { backgroundColor: theme.primarySoft, width: photoSize, height: photoSize, borderRadius: photoSize / 2 }]}>{person.photo && person.photoLayout ? <Image source={person.photo} resizeMode="contain" style={[styles.photo, { width: person.photoLayout.width * photoScale, height: person.photoLayout.height * photoScale, left: person.photoLayout.left * photoScale, top: person.photoLayout.top * photoScale }]} accessibilityLabel={person.name} /> : <ThemedText themeColor="primary" style={styles.initials} accessible={false}>{person.name.split(/\s+/).map(part => part[0]).join('')}</ThemedText>}</View>
   <View style={styles.copy}>
    <ThemedText type="smallBold" style={styles.name}>{person.name}</ThemedText>
    <ThemedText type="small" themeColor="textSecondary">{person.role}</ThemedText>
    {person.linkedin ? <Link href={person.linkedin} target="_blank" rel="noopener noreferrer" asChild>
     <Pressable accessibilityRole="link" accessibilityLabel={`${person.name} on LinkedIn, opens in a new tab`} style={({ pressed }) => [styles.link, pressed && { opacity: 0.65 }]}><Image source={require('../../assets/branding/linkedin.png')} style={styles.linkedinLogo} resizeMode="contain" accessible={false} /><ThemedText type="small" themeColor="primary" style={{ fontWeight: '400' }}>LinkedIn</ThemedText></Pressable>
    </Link> : null}
   </View>
  </View>)}
 </Screen>;
}
const styles = StyleSheet.create({
 card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 18, borderWidth: 1 },
 compact: { flexDirection: 'column', alignItems: 'flex-start' },
 photoFrame: { width: 112, height: 112, borderRadius: 56, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
 initials: { fontSize: 24, lineHeight: 30, fontWeight: '500' },
 photo: { position: 'absolute' },
 copy: { flex: 1, minWidth: 0, gap: 4 },
 name: { fontSize: 16, lineHeight: 22 },
 linkedinLogo: { width: 18, height: 18 },
 link: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start', paddingRight: 16 },
});
