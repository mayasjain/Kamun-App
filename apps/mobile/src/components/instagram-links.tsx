import { Link } from 'expo-router';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { MoreIcon } from '@/components/more-icon';
import { HomeIcon } from '@/components/home-icon';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

const accounts = {
  main: { label: 'KAMUN', handle: 'kamun_org' },
  memes: { label: 'Memes', handle: 'welovemunikueh' },
  ipc: { label: 'IPC', handle: 'ipc_kamun' },
} as const;

export function InstagramLinks({ only, tiles = false }: { only?: keyof typeof accounts; tiles?: boolean }) {
  const theme = useTheme();
  const selected = only ? [accounts[only]] : Object.values(accounts);

  return (
    <View style={[styles.section, tiles && styles.tileSection, !only && !tiles && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border, paddingTop: 20 }]}>
      {!only && !tiles ? <ThemedText themeColor="textSecondary">Follow us on</ThemedText> : null}
      <View style={[styles.links, tiles && styles.tileLinks]}>
        {selected.map((account) => (
          <Link key={account.handle} href={`https://www.instagram.com/${account.handle}/`} target="_blank" rel="noopener noreferrer" asChild>
            <Pressable accessibilityRole="link"
              accessibilityLabel={`${account.label} on Instagram, @${account.handle}, opens in a new tab`}
              style={({ pressed }) => [styles.link, !only && styles.accountLink, tiles && [styles.tile, { backgroundColor: theme.background }], pressed && styles.pressed]}>
              {tiles ? (account.handle === 'welovemunikueh' ? <HomeIcon name="memes" size={23} color={theme.primary} /> : <MoreIcon name={account.handle === 'ipc_kamun' ? 'press' : 'official'} color={theme.primary} size={23} />) : <Image source={require('../../assets/branding/instagram.png')} style={styles.instagramLogo} resizeMode="contain" accessible={false} />}
              <ThemedText type="small" themeColor="primary" style={{ fontWeight: '400', textAlign: 'center' }}>{only ? 'Follow on Instagram' : account.label}</ThemedText>
            </Pressable>
          </Link>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { justifyContent: 'flex-start', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 24, rowGap: 4 },
  links: { justifyContent: 'flex-start', flexDirection: 'row', flexWrap: 'wrap', columnGap: 24, rowGap: 4 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48 },
  accountLink: { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 64, gap: 4 },
  tileSection: { width: '100%' },
  tileLinks: { width: '100%', flexWrap: 'nowrap', gap: 8 },
  tile: { flex: 1, flexBasis: 0, minWidth: 64, minHeight: 76, borderRadius: 14, gap: 8, padding: 10 },
  tileButton: { width: '100%', minHeight: 76, padding: 10, gap: 8, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.65 },
  instagramLogo: { width: 24, height: 24 },
});
