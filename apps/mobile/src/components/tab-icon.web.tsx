export function TabIcon({ name, color, selected }: { name: string; color: string; selected: boolean }) {
  return <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={selected ? 1.6 : 1.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" style={{ display: 'block' }}>
    {name === 'index' && <path d="M10.4 3.1a2.3 2.3 0 0 1 3.2 0l7 6.7a3 3 0 0 1 .9 2.2v7.7a1.8 1.8 0 0 1-1.8 1.8h-3.9a.8.8 0 0 1-.8-.8V15a3 3 0 0 0-6 0v5.7a.8.8 0 0 1-.8.8H4.3a1.8 1.8 0 0 1-1.8-1.8V12a3 3 0 0 1 .9-2.2Z" fill={color} stroke="none" />}
    {name === 'schedule' && <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18M8 15h2M14 15h2M8 18h2" /></>}
    {name === 'updates' && <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>}
    {name === 'resources' && <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8ZM14 2v6h6M8 13h8M8 17h6" /></>}
    {name === 'more' && <>{[5,12,19].map(cx => <circle key={cx} cx={cx} cy="12" r="1.2" fill={color} stroke="none" />)}</>}
  </svg>;
}
