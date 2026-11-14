import { useState } from 'react';
import { useTheme } from '@/hooks/use-theme';
import { droppedMemeType } from '@/lib/meme-drop';
import type { MemeDropZoneProps } from './meme-drop-zone';

export function MemeDropZone({ disabled = false, onImage, onError }: MemeDropZoneProps) {
 const theme = useTheme();
 const [dragging, setDragging] = useState(false);
 return <div role="region" aria-label="Drop a meme image" aria-disabled={disabled}
  onDragEnter={event => { event.preventDefault(); if (!disabled) setDragging(true); }}
  onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = disabled ? 'none' : 'copy'; }}
  onDragLeave={event => {
   if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) setDragging(false);
  }}
  onDrop={event => {
   event.preventDefault(); event.stopPropagation(); setDragging(false);
   if (disabled) return;
   try {
    const files = Array.from(event.dataTransfer.files);
    const mimeType = droppedMemeType(files);
    const file = files[0];
    const uri = URL.createObjectURL(file);
    onImage({ uri, fileName: file.name, fileSize: file.size, mimeType, width: 0, height: 0, type: 'image' });
   } catch (error) { onError(error instanceof Error ? error.message : 'Could not open this image. Try choosing a photo instead.'); }
  }}
  style={{ border: `2px dashed ${dragging && !disabled ? theme.primary : theme.border}`, borderRadius: 16, padding: '24px 16px', textAlign: 'center', backgroundColor: dragging && !disabled ? theme.primarySoft : theme.backgroundElement, color: theme.textSecondary, opacity: disabled ? 0.5 : 1 }}>
  <span style={{ display: 'block', fontSize: 15, lineHeight: '22px', fontWeight: 600, color: theme.primary }}>{dragging && !disabled ? 'Drop to preview your meme' : 'Drag image here'}</span>
  <span style={{ display: 'block', marginTop: 4, fontSize: 12, lineHeight: '18px' }}>JPG, PNG or WebP · up to 8 MB · one image</span>
 </div>;
}
