import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';

export type HomeIconProps = {
  name: 'coffee' | 'emergency' | 'gossip' | 'partners';
  size: number;
  color: string;
};

export function HomeIcon({ name, size, color }: HomeIconProps) {
  return name === 'coffee' || name === 'emergency'
    ? <Feather name={name === 'coffee' ? 'coffee' : 'phone-call'} size={size} color={color} accessible={false} />
    : <Ionicons name={name === 'partners' ? 'people-outline' : 'chatbubble-ellipses-outline'} size={size} color={color} accessible={false} />;
}
