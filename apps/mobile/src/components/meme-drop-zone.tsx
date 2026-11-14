import type { ImagePickerAsset } from 'expo-image-picker';

export type MemeDropZoneProps = {
 disabled?: boolean;
 onImage: (asset: ImagePickerAsset) => void;
 onError: (message: string) => void;
};

// Phones retain the native photo picker; drag and drop is a web enhancement.
export function MemeDropZone(_props: MemeDropZoneProps) { return null; }
