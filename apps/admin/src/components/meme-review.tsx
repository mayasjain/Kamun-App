'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { MemeCommentReview } from '@/components/meme-comment-review';
type Row = { id: string; caption: string; image_path: string; created_at: string; removed_at: string | null; committee_id: string | null; chairs_only: boolean; committee_meme_reports: { reason: string; created_at: string }[]; imageUrl: string };
export function MemeReview() {
 const [rows, setRows] = useState<Row[]>([]);
 const [names, setNames] = useState<Record<string,string>>({});
 const [error, setError] = useState('');
 const [loading, setLoading] = useState(true);
 const [busy, setBusy] = useState(false);
 const [chairsOnly, setChairsOnly] = useState(false);
 const [reportedOnly, setReportedOnly] = useState(false);
 const [page, setPage] = useState(0);
 const [hasMore, setHasMore] = useState(false);
 const lock = useRef(false);
 const load = useCallback(async () => {
  setLoading(true); setError('');
  try {
   const client = createClient();
   const relation = reportedOnly ? 'committee_meme_reports!inner(reason,created_at)' : 'committee_meme_reports(reason,created_at)';
   const [{ data, error: queryError }, committees] = await Promise.all([
    client.from('committee_memes').select(`id,caption,image_path,created_at,removed_at,committee_id,chairs_only,${relation}`).in('chairs_only', chairsOnly ? [true] : [false, true]).order('created_at', { ascending: false }).range(page * 24, page * 24 + 23),
    client.from('committees').select('id,abbreviation'),
   ]);
   if (queryError || committees.error) throw new Error('Could not load memes.');
   const items = (data ?? []) as unknown as Row[];
   const { data: urls, error: imageError } = await client.storage.from('committee-memes').createSignedUrls(items.map(m => m.image_path), 300);
   if (imageError) throw imageError;
   setRows(items.map(m => ({ ...m, imageUrl: urls?.find(u => u.path === m.image_path)?.signedUrl ?? '' })));
   setNames(Object.fromEntries((committees.data ?? []).map(c => [c.id,c.abbreviation])));
   setHasMore(items.length === 24);
  } catch { setError('Could not load the review queue. Refresh to try again.'); }
  finally { setLoading(false); }
 }, [page, reportedOnly, chairsOnly]);
 useEffect(() => { void load(); }, [load]);
 async function hide(row: Row) {
  if (lock.current || !window.confirm('Remove this meme from the participant gallery?')) return;
  lock.current = true; setBusy(true); setError('');
  try {
   const removed_at = new Date().toISOString();
   const { error: updateError } = await createClient().from('committee_memes').update({ removed_at }).eq('id', row.id).select('id').single();
   if (updateError) throw updateError;
   setRows(old => old.map(m => m.id === row.id ? { ...m, removed_at } : m));
  } catch { setError('Could not remove this meme. Try again.'); }
  finally { lock.current = false; setBusy(false); }
 }
 return <section className="w-full space-y-6">
  <Link href="/protected" className="underline">← Dashboard</Link>
  <h1 className="text-3xl font-semibold">Committee meme review</h1>
  <p className="text-muted-foreground">Review participant reports and remove inappropriate posts. Previously opened photos may remain accessible for up to five minutes.</p>
  <div className="flex flex-wrap gap-4"><Button variant={chairsOnly ? "outline" : "default"} onClick={() => { setChairsOnly(false); setPage(0); }}>All memes</Button><Button variant={chairsOnly ? "default" : "outline"} onClick={() => { setChairsOnly(true); setPage(0); }}>Chairs</Button><label className="flex items-center gap-2"><input type="checkbox" checked={reportedOnly} onChange={e => { setReportedOnly(e.target.checked); setPage(0); }} />Reported memes only</label><Button variant="outline" onClick={() => void load()} disabled={loading}>Refresh</Button></div>
  {error && <p role="alert">{error}</p>}
  {loading ? <p role="status">Loading memes…</p> : !rows.length ? <p>No memes to review.</p> : <div className="grid gap-6 sm:grid-cols-2">{rows.map(row => <article key={row.id} className="overflow-hidden rounded-2xl border p-5 space-y-4">
   <p className="font-semibold">{row.chairs_only ? 'Chairs' : row.committee_id ? names[row.committee_id] ?? 'Committee' : 'General'} · {new Date(row.created_at).toLocaleDateString()}</p>
   {row.imageUrl ? <a href={row.imageUrl} target="_blank" rel="noreferrer"><Image unoptimized width={800} height={800} src={row.imageUrl} alt={row.caption || 'Committee meme for review'} className="max-h-96 w-full rounded-xl object-contain" /></a> : <p>Photo no longer available.</p>}
   <p>{row.caption}</p>
   <div className="space-y-2"><h2 className="font-semibold">Reports ({row.committee_meme_reports.length})</h2>{row.committee_meme_reports.map((report, i) => <p key={i} className="rounded-lg bg-muted p-3 whitespace-pre-wrap break-words">{report.reason}</p>)}</div>
   {row.removed_at ? <p className="font-semibold">Removed from gallery</p> : <Button variant="destructive" disabled={busy} onClick={() => void hide(row)}>Remove from gallery</Button>}
   {!row.removed_at && <MemeCommentReview memeId={row.id} />}
  </article>)}</div>}
  <div className="flex gap-4"><Button variant="outline" disabled={loading || page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button><Button variant="outline" disabled={loading || !hasMore} onClick={() => setPage(p => p + 1)}>Next</Button></div>
 </section>;
}
