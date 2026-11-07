import Feather from '@expo/vector-icons/Feather';
export type MoreIconProps = { name: 'instagram' | 'install' | 'identity' | 'key' | 'logout' | 'official' | 'press' | 'chevron' | 'chevronDown'; color: string; size?: number };
export function MoreIcon({ name, color, size = 22 }: MoreIconProps) {
 const glyph = { instagram: 'instagram', install: 'smartphone', identity: 'user', key: 'key', logout: 'log-out', official: 'home', press: 'file-text', chevron: 'chevron-right', chevronDown: 'chevron-down' } as const;
 return <Feather name={glyph[name]} color={color} size={size} accessible={false} />;
}
