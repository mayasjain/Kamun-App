import assert from 'node:assert/strict';
import { test } from 'node:test';
import { droppedMemeType } from '../src/lib/meme-drop.ts';
const image = { name: 'meme.png', type: 'image/png', size: 100 };
test('accepts supported image files, including the exact upload size limit', () => {
 for (const type of ['image/jpeg','image/png','image/webp']) assert.equal(droppedMemeType([{ ...image,type,size:8*1024*1024 }]),type);
 assert.equal(droppedMemeType([{ ...image,name:'MEME.JPG',type:'' }]),'image/jpeg');
});
test('rejects multiple files, browser URL drops, unsupported formats, empty and oversized files', () => {
 for (const files of [[],[image,image],[{...image,type:'image/gif'}],[{...image,type:'text/html',name:'meme.png'}],[{...image,size:0}],[{...image,size:8*1024*1024+1}]]) assert.throws(()=>droppedMemeType(files));
});
