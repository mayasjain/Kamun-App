import { Link } from 'expo-router';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

const accounts = {
  main: { label: 'Kamun', handle: 'kamun_org' },
  memes: { label: 'Memes', handle: 'welovemunikueh' },
  ipc: { label: 'IPC', handle: 'ipc_kamun' },
} as const;

export function InstagramLinks({ only }: { only?: keyof typeof accounts }) {
  const theme = useTheme();
  const selected = only ? [accounts[only]] : Object.values(accounts);

  return (
    <View style={[styles.section, !only && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border, paddingTop: 20 }]}>
      {!only ? <ThemedText themeColor="textSecondary">Follow us on</ThemedText> : null}
      <View style={styles.links}>
        {selected.map((account) => (
          <Link key={account.handle} href={`https://www.instagram.com/${account.handle}/`} target="_blank" rel="noopener noreferrer" asChild>
            <Pressable accessibilityRole="link"
              accessibilityLabel={`${account.label} on Instagram, @${account.handle}, opens in a new tab`}
              style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
              <Image source={require('../../assets/branding/instagram.png')} style={styles.instagramLogo} resizeMode="contain" accessible={false} />
              <ThemedText type="small" themeColor="primary" style={{ fontWeight: '400' }}>{only ? 'Follow on Instagram' : account.label}</ThemedText>
            </Pressable>
          </Link>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { justifyContent: 'center', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 24, rowGap: 4 },
  links: { justifyContent: 'center', flexDirection: 'row', flexWrap: 'wrap', columnGap: 24, rowGap: 4 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48 },
  pressed: { opacity: 0.65 },
  instagramLogo: { width: 24, height: 24 },
});
