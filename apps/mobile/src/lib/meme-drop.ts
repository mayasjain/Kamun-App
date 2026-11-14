export type DroppedMemeFile = { name: string; type: string; size: number };

export function droppedMemeType(files: readonly DroppedMemeFile[]): string {
 if (files.length !== 1) throw new Error('Drop one image at a time.');
 const file = files[0];
 const type = file.type || ({ jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' } as Record<string, string>)[file.name.split('.').at(-1)?.toLowerCase() ?? ''];
 if (!['image/jpeg', 'image/png', 'image/webp'].includes(type)) throw new Error('Choose a JPG, PNG or WebP photo.');
 if (file.size === 0) throw new Error('This image is empty. Choose another photo.');
 if (file.size > 8 * 1024 * 1024) throw new Error('Choose a photo smaller than 8 MB.');
 return type;
}
