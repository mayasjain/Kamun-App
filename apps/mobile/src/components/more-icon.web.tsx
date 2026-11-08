// Key Round: Lucide Icons, ISC license, https://lucide.dev/icons/key-round
import type { MoreIconProps } from './more-icon';
export function MoreIcon({ name, color, size = 22 }: MoreIconProps) {
 const paths = {
  feedback: 'M21 15a2 2 0 0 1-2 2H7l-5 4V5a2 2 0 0 1 2-2h15a2 2 0 0 1 2 2v10ZM7 8h10M7 12h7',
  instagram: 'M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Z',
  install: 'M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2ZM12 18h.01',
  identity: 'M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2ZM9 6h6M9 18a3 3 0 0 1 6 0',
  key: 'M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z',
  logout: 'M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4M10 12h12m-5-5 5 5-5 5',
  official: 'm2 7 10-5 10 5H2Zm2 0v13h16V7M9 8v11M15 8v11M2 22h20',
  press: 'M6 3h16v18H6V3ZM6 7H2v14h4M10 7h8v4h-8V7ZM10 15h8M10 18h8',
  chevron: 'm9 5 7 7-7 7',
  chevronDown: 'm5 9 7 7 7-7',
 };
 return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={name === 'key' ? 2 : 1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}><path d={paths[name]} />{name === 'instagram' && <><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".7" fill={color} /></>} {name === 'key' && <circle cx="16.5" cy="7.5" r=".5" fill={color} />} {name === 'identity' && <circle cx="12" cy="12" r="2" />}</svg>;
}
