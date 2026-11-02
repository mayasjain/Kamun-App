import type { ImageSourcePropType } from 'react-native';

// Match immutable PDF filenames so a replacement document never gets an old cover.
const covers: Record<string, ImageSourcePropType> = {
  'code-of-conduct-5d75a2395d75.pdf': require('../../assets/documents/code-of-conduct.jpg'),
  'delegate-handbook-ee04582c2ba8.pdf': require('../../assets/documents/delegate-handbook.jpg'),
  'rules-of-procedure-d702b816cfff.pdf': require('../../assets/documents/rules-of-procedure.jpg'),
  'ipc-study-guide-316b6f5bde2f.pdf': require('../../assets/documents/ipc-study-guide.jpg'),
};

export function documentCover(url: string): ImageSourcePropType | undefined {
  try {
    return covers[new URL(url).pathname.split('/').pop() ?? ''];
  } catch {
    return undefined;
  }
}
