'use client';
import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
type Comment = { id: string; body: string; author_label: string; created_at: string; can_remove: boolean };
export function MemeCommentReview({ memeId }: { memeId: string }) {
 const [open, setOpen] = useState(false);
 const [rows, setRows] = useState<Comment[]>([]);
 const [more, setMore] = useState(false);
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState('');
 const lock = useRef(false);
 async function load(append = false) {
  if (lock.current) return;
  lock.current = true; setBusy(true); setError('');
  try {
   const cursor = append ? rows.at(-1) : null;
   const { data, error: queryError } = await createClient().rpc('list_meme_comments', { p_meme_id: memeId, p_before: cursor?.created_at ?? null, p_before_id: cursor?.id ?? null });
   if (queryError) throw queryError;
   const items = (data ?? []) as Comment[];
   setRows(old => append ? [...old, ...items.filter(c => !old.some(r => r.id === c.id))] : items); setMore(items.length === 20);
  } catch { setError('Could not load comments. Refresh to try again.'); }
  finally { lock.current = false; setBusy(false); }
 }
 async function remove(id: string) {
  if (lock.current || !window.confirm('Remove this comment from the discussion?')) return;
  lock.current = true; setBusy(true); setError('');
  try {
   const { data, error: removeError } = await createClient().rpc('remove_meme_comment', { p_comment_id: id });
   if (removeError || !data) throw new Error('Could not remove comment');
   setRows(old => old.filter(c => c.id !== id));
  } catch { setError('Could not remove the comment. Refresh to try again.'); }
  finally { lock.current = false; setBusy(false); }
 }
 return <div className="space-y-3 border-t pt-4">
  <Button variant="outline" aria-expanded={open} disabled={busy} onClick={() => { setOpen(!open); if (!open) void load(); }}>{open ? 'Hide comments' : 'Review comments'}</Button>
  {open && <>
   <Button variant="ghost" disabled={busy} onClick={() => void load()}>Refresh comments</Button>
   {busy && <p role="status">Loading…</p>}
   {error && <p role="alert">{error}</p>}
   {!busy && !error && !rows.length && <p>No comments yet.</p>}
   {rows.map(c => <div key={c.id} className="space-y-2 rounded-lg bg-muted p-3">
    <p className="text-sm font-semibold">{c.author_label}</p><p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()}</p>
    <p className="whitespace-pre-wrap break-words">{c.body}</p>
    {c.can_remove && <Button variant="destructive" size="sm" disabled={busy} onClick={() => void remove(c.id)}>Remove comment</Button>}
   </div>)}
   {more && <Button variant="outline" disabled={busy} onClick={() => void load(true)}>Older comments</Button>}
  </>}
 </div>;
}
