import type { HomeIconProps } from './home-icon';

// Inline SVG stays visible on the published web app without loading an icon font.
export function HomeIcon({ name, size, color }: HomeIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"
      style={{ display: 'block', flexShrink: 0 }}>
      {name === 'arrow' && <path d="M7 17 17 7M7 7h10v10" />}
      {name === 'chevron' && <path d="m9 5 7 7-7 7" />}
      {name === 'music' && <><path d="M9 18V5l12-2v13M9 9l12-2" /><ellipse cx="6" cy="18" rx="3" ry="3" /><ellipse cx="18" cy="16" rx="3" ry="3" /></>}
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
      {name === 'secretariat' && <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
        <circle cx="9" cy="7" r="4" />
      </>}
      {name === 'partners' && <>
        <path d="m11 17 2 2a1 1 0 1 0 3-3M14 14l2.5 2.5a1 1 0 1 0 3-3L15 9" />
        <path d="m7 13 5.5 5.5a1 1 0 1 1-3 3L3 16l-2-2 2-11 4 2 4-1" />
        <path d="m22 3 1 11-3 2M22 5l-5-2h-3a2 2 0 0 0-1.4.6L8 8a1.5 1.5 0 0 0 3 3l2-2h2M3 5l4 1" />
      </>}
    </svg>
  );
}
