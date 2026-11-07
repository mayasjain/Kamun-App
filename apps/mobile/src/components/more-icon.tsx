import Feather from '@expo/vector-icons/Feather';
export type MoreIconProps = { name: 'install' | 'identity' | 'key' | 'logout' | 'official' | 'press' | 'chevron'; color: string; size?: number };
export function MoreIcon({ name, color, size = 22 }: MoreIconProps) {
 const glyph = { install: 'smartphone', identity: 'user', key: 'key', logout: 'log-out', official: 'home', press: 'file-text', chevron: 'chevron-right' } as const;
 return <Feather name={glyph[name]} color={color} size={size} accessible={false} />;
}
