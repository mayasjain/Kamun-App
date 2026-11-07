import { HomeIcon } from '@/components/home-icon';
import { MoreIcon } from '@/components/more-icon';
import { useTheme } from '@/hooks/use-theme';

const accounts = {
 main: { label: 'KAMUN', handle: 'kamun_org' },
 memes: { label: 'Memes', handle: 'welovemunikueh' },
 ipc: { label: 'IPC', handle: 'ipc_kamun' },
} as const;

export function InstagramLinks({ only, tiles = false }: { only?: keyof typeof accounts; tiles?: boolean }) {
 const theme = useTheme();
 const selected = only ? [accounts[only]] : Object.values(accounts);
 return <div style={{ width: '100%', boxSizing: 'border-box' }}>
  {!only && !tiles && <p style={{ color: theme.textSecondary, margin: '0 0 12px' }}>Follow us on Instagram</p>}
  <div style={tiles ? { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, width: '100%' } : { display: 'flex', gap: 24, flexWrap: 'wrap' }}>
   {selected.map(account => <a key={account.handle} href={`https://www.instagram.com/${account.handle}/`} target="_blank" rel="noopener noreferrer"
    aria-label={`${account.label} on Instagram, opens in a new tab`}
    style={{ display: 'flex', flexDirection: tiles ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: tiles ? 10 : 8, minWidth: 0, minHeight: tiles ? 76 : 48, padding: tiles ? '12px 6px' : '0', borderRadius: 14, background: tiles ? theme.background : 'transparent', color: theme.primary, textDecoration: 'none', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', fontSize: 14, fontWeight: 400, textAlign: 'center', boxSizing: 'border-box' }}>
    {account.handle === 'welovemunikueh' ? <HomeIcon name="memes" size={23} color={theme.primary} /> : <MoreIcon name={account.handle === 'ipc_kamun' ? 'press' : 'official'} color={theme.primary} size={23} />}
    <span>{only ? 'Follow on Instagram' : account.label}</span>
   </a>)}
  </div>
 </div>;
}
