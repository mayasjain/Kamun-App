import type { ImageSourcePropType } from 'react-native';

// Map both readable filenames and retained original PDF URLs to their covers.
const covers: Record<string, ImageSourcePropType> = {
  'Code-of-Conduct.pdf': require('../../assets/documents/code-of-conduct.jpg'),
  'Delegate-Handbook.pdf': require('../../assets/documents/delegate-handbook-78eb8a7429d2.jpg'),
  'Rules-of-Procedure.pdf': require('../../assets/documents/rules-of-procedure.jpg'),
  'IPC-Study-Guide.pdf': require('../../assets/documents/ipc-study-guide-8624ff112b89.jpg'),
  'COPUOS-Study-Guide.pdf': require('../../assets/documents/copuos-study-guide-6e4432c63aa3.jpg'),
  'EP-Study-Guide.pdf': require('../../assets/documents/ep-study-guide-3dda49aec756.jpg'),
  'IAEA-Study-Guide.pdf': require('../../assets/documents/iaea-study-guide-093e0873ca69.jpg'),
  'ILO-Study-Guide.pdf': require('../../assets/documents/ilo-study-guide-737b9dc276ad.jpg'),
  'PIF-Study-Guide.pdf': require('../../assets/documents/pif-study-guide-ead996f43ba4.jpg'),
  'UNSC-Study-Guide.pdf': require('../../assets/documents/unsc-study-guide-b90ee7f96ed4.jpg'),
  'USCC-Study-Guide.pdf': require('../../assets/documents/uscc-study-guide-fa4c6d0c049f.jpg'),
  'WHO-Study-Guide.pdf': require('../../assets/documents/who-study-guide-d4f7cc07f042.jpg'),
  'DISEC-Study-Guide.pdf': require('../../assets/documents/disec-study-guide-8825934f6f5e.jpg'),
  'disec-study-guide-8825934f6f5e.pdf': require('../../assets/documents/disec-study-guide-8825934f6f5e.jpg'),
  'code-of-conduct-5d75a2395d75.pdf': require('../../assets/documents/code-of-conduct.jpg'),
  'delegate-handbook-ee04582c2ba8.pdf': require('../../assets/documents/delegate-handbook.jpg'),
  'rules-of-procedure-d702b816cfff.pdf': require('../../assets/documents/rules-of-procedure.jpg'),
  'ipc-study-guide-316b6f5bde2f.pdf': require('../../assets/documents/ipc-study-guide.jpg'),
  'delegate-handbook-78eb8a7429d2.pdf': require('../../assets/documents/delegate-handbook-78eb8a7429d2.jpg'),
  'copuos-study-guide-6e4432c63aa3.pdf': require('../../assets/documents/copuos-study-guide-6e4432c63aa3.jpg'),
  'ep-study-guide-3dda49aec756.pdf': require('../../assets/documents/ep-study-guide-3dda49aec756.jpg'),
  'iaea-study-guide-093e0873ca69.pdf': require('../../assets/documents/iaea-study-guide-093e0873ca69.jpg'),
  'ilo-study-guide-737b9dc276ad.pdf': require('../../assets/documents/ilo-study-guide-737b9dc276ad.jpg'),
  'ipc-study-guide-8624ff112b89.pdf': require('../../assets/documents/ipc-study-guide-8624ff112b89.jpg'),
  'pif-study-guide-ead996f43ba4.pdf': require('../../assets/documents/pif-study-guide-ead996f43ba4.jpg'),
  'unsc-study-guide-b90ee7f96ed4.pdf': require('../../assets/documents/unsc-study-guide-b90ee7f96ed4.jpg'),
  'uscc-study-guide-fa4c6d0c049f.pdf': require('../../assets/documents/uscc-study-guide-fa4c6d0c049f.jpg'),
  'who-study-guide-d4f7cc07f042.pdf': require('../../assets/documents/who-study-guide-d4f7cc07f042.jpg'),
};

export function documentCover(url: string): ImageSourcePropType | undefined {
  try {
    return covers[new URL(url).pathname.split('/').pop() ?? ''];
  } catch {
    return undefined;
  }
}
