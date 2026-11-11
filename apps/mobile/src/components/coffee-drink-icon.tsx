import { StyleSheet, View } from 'react-native';
import { ThemedText } from './themed-text';

/** Small cup illustrations distinguish the drinks without implying a serving photo. */
export function CoffeeDrinkIcon({ name, emoji }: { name: string; emoji?: string | null }) {
  const drink = name.trim().toLowerCase();
  if (!['flat white', 'black coffee'].includes(drink)) {
    return <ThemedText style={styles.emoji}>{emoji || '☕'}</ThemedText>;
  }
  const black = drink === 'black coffee';
  return <View style={styles.scene} accessible={false}>
    <View style={styles.saucer} />
    <View style={styles.handle} />
    <View style={styles.cup}>
      <View style={[styles.surface, { backgroundColor: black ? '#392419' : '#B77C46' }]}>
        {!black ? <View style={styles.latteArt}>
          <View style={[styles.leaf, { width: 12 }]} />
          <View style={[styles.leaf, { width: 9 }]} />
          <View style={[styles.leaf, { width: 5 }]} />
        </View> : <View style={styles.reflection} />}
      </View>
    </View>
  </View>;
}
const styles = StyleSheet.create({
  emoji: { fontSize: 30, lineHeight: 38 },
  scene: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  saucer: { position: 'absolute', width: 39, height: 39, borderRadius: 20, backgroundColor: '#E6E1D5', borderWidth: 1, borderColor: '#D5CDBD' },
  handle: { position: 'absolute', right: 0, top: 15, width: 12, height: 13, borderRadius: 6, borderWidth: 3, borderColor: '#FFFCF6', backgroundColor: '#D5CDBD' },
  cup: { width: 32, height: 32, borderRadius: 16, padding: 3, backgroundColor: '#FFFCF6', borderWidth: 1, borderColor: '#D5CDBD' },
  surface: { flex: 1, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  latteArt: { alignItems: 'center', gap: 1, transform: [{ rotate: '-25deg' }] },
  leaf: { height: 3, borderRadius: 3, backgroundColor: '#FFF7E8' },
  reflection: { position: 'absolute', top: 4, left: 4, width: 13, height: 9, borderRadius: 7, borderTopWidth: 1, borderLeftWidth: 1, borderColor: '#9B7652', transform: [{ rotate: '-20deg' }] },
});
