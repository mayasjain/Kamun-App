import type { HomeIconProps } from './home-icon';

// Inline SVG stays visible on the published web app without loading an icon font.
export function HomeIcon({ name, size, color }: HomeIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"
      style={{ display: 'block', flexShrink: 0 }}>
      {name === 'arrow' && <path d="M7 17 17 7M7 7h10v10" />}
      {name === 'chevron' && <path d="m9 5 7 7-7 7" />}
      {name === 'memes' && <><circle cx="12" cy="12" r="9" /><path d="M8 14s1.5 3 4 3 4-3 4-3" /><circle cx="9" cy="9" r=".7" fill={color} /><circle cx="15" cy="9" r=".7" fill={color} /></>}
      {name === 'coffee' && <>
        <path d="M18 8h1a3 3 0 0 1 0 6h-1M3 8h15v9a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V8ZM2 23h18M6 1v3M10 1v3M14 1v3" />
      </>}
      {name === 'emergency' && <>
        <path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 3.1 5.2 2 2 0 0 1 5.1 3h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L9 10.9a16 16 0 0 0 4.1 4.1l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
        <path d="M15 3a7 7 0 0 1 6 6M15 7a3 3 0 0 1 2 2" />
      </>}
      {name === 'gossip' && <>
        <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" />
        <circle cx="8.5" cy="11.5" r=".6" fill={color} /><circle cx="12.5" cy="11.5" r=".6" fill={color} /><circle cx="16.5" cy="11.5" r=".6" fill={color} />
      </>}
      {name === 'partners' && <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
        <circle cx="9" cy="7" r="4" />
      </>}
    </svg>
  );
}
