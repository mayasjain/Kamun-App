import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, Platform } from 'react-native';

type IconName = 'arrow-up' | 'arrow-up-outline' | 'arrow-down' | 'arrow-down-outline' | 'chatbubble-outline';

/** Web uses vector images so these controls never depend on an icon font loading. */
export function MemeActionIcon({ name, color }: { name: IconName; color: string }) {
 if (Platform.OS !== 'web') return <Ionicons name={name} size={19} color={color} accessible={false} />;
 const comment = name === 'chatbubble-outline';
 const selected = !name.endsWith('-outline');
 const path = comment
  ? '<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z"/>'
  : `<g${name.startsWith('arrow-down') ? ' transform="rotate(180 12 12)"' : ''}><path d="M12 3 3 12h5v9h8v-9h5L12 3Z"/></g>`;
 const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${selected ? color : 'none'}" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
 return <Image accessible={false} source={{ uri: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}` }} style={{ width: 19, height: 19 }} />;
}
