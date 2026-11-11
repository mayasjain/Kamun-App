// Key Round: Lucide Icons, ISC license, https://lucide.dev/icons/key-round
import type { MoreIconProps } from './more-icon';
export function MoreIcon({ name, color, size = 22 }: MoreIconProps) {
 if (name === 'linkedin') return <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true" style={{ flexShrink: 0 }}><path d="M20.45 2H3.55C2.69 2 2 2.68 2 3.52v16.96c0 .84.69 1.52 1.55 1.52h16.9c.86 0 1.55-.68 1.55-1.52V3.52c0-.84-.69-1.52-1.55-1.52ZM7.93 18.75H4.98V9.2h2.95v9.55ZM6.45 7.9a1.71 1.71 0 1 1 0-3.42 1.71 1.71 0 0 1 0 3.42Zm12.3 10.85H15.8V14.1c0-1.11-.02-2.54-1.55-2.54-1.55 0-1.79 1.21-1.79 2.46v4.73H9.51V9.2h2.83v1.3h.04c.39-.74 1.35-1.53 2.78-1.53 2.98 0 3.59 1.96 3.59 4.51v5.27Z" /></svg>;
 const paths = {
  feedback: 'M21 15a2 2 0 0 1-2 2H7l-5 4V5a2 2 0 0 1 2-2h15a2 2 0 0 1 2 2v10ZM7 8h10M7 12h7',
  github: 'M9 19c-4.3 1.3-4.3-2.5-6-3m12 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 19 4.77 5.07 5.07 0 0 0 18.91 1S17.73.65 15 2.48a13.38 13.38 0 0 0-7 0C5.27.65 4.09 1 4.09 1A5.07 5.07 0 0 0 4 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 8 18.13V22',
  linkedin: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4V9h4v2M2 9h4v12H2V9ZM4 3h.01',
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
