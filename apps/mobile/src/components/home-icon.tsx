import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';

export type HomeIconProps = {
  name: 'memes' | 'coffee' | 'emergency' | 'gossip' | 'partners' | 'secretariat' | 'arrow' | 'chevron';
  size: number;
  color: string;
};

export function HomeIcon({ name, size, color }: HomeIconProps) {
  if (name === 'partners') return <MaterialCommunityIcons name="handshake-outline" size={size} color={color} accessible={false} />;
  if (name === 'secretariat') return <Feather name="users" size={size} color={color} accessible={false} />;
  if (name === 'memes') return <Feather name="smile" size={size} color={color} accessible={false} />;
  if (name === 'arrow' || name === 'chevron') return <Feather name={name === 'arrow' ? 'arrow-up-right' : 'chevron-right'} size={size} color={color} accessible={false} />;
  return name === 'coffee' || name === 'emergency'
    ? <Feather name={name === 'coffee' ? 'coffee' : 'phone-call'} size={size} color={color} accessible={false} />
    : <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} accessible={false} />;
}
