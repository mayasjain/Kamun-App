import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';

export type HomeIconProps = {
  name: 'memes' | 'coffee' | 'emergency' | 'gossip' | 'partners' | 'arrow' | 'chevron';
  size: number;
  color: string;
};

export function HomeIcon({ name, size, color }: HomeIconProps) {
  if (name === 'memes') return <Feather name="smile" size={size} color={color} accessible={false} />;
  if (name === 'arrow' || name === 'chevron') return <Feather name={name === 'arrow' ? 'arrow-up-right' : 'chevron-right'} size={size} color={color} accessible={false} />;
  return name === 'coffee' || name === 'emergency'
    ? <Feather name={name === 'coffee' ? 'coffee' : 'phone-call'} size={size} color={color} accessible={false} />
    : <Ionicons name={name === 'partners' ? 'people-outline' : 'chatbubble-ellipses-outline'} size={size} color={color} accessible={false} />;
}
