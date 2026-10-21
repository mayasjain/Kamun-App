"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Megaphone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Conference = { id: string; name: string };
type Committee = { id: string; name: string; conference_id: string };
type Audience = "all" | "chair" | "member";
type Announcement = { id: string; title: string; body: string; priority: string; audience: Audience; conference_id: string; committee_id: string | null; published: boolean; published_at: string | null; expires_at: string | null };
const fields = "id,title,body,priority,audience,conference_id,committee_id,published,published_at,expires_at";
const audienceLabel: Record<Audience, string> = { all: "Chairs and delegates", chair: "Chairs only", member: "Delegates only" };
const selectClass = "w-full rounded-md border bg-background px-3 py-2 text-sm";

export function AnnouncementManager({ conferences, committees, initialAnnouncements }: { conferences: Conference[]; committees: Committee[]; initialAnnouncements: Announcement[] }) {
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [conferenceId, setConferenceId] = useState(conferences[0]?.id ?? "");
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [formVersion, setFormVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const lock = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const visible = announcements.filter((item) => item.conference_id === conferenceId);

  function resetEditor() { setEditing(null); setFormVersion((value) => value + 1); }
  function replaceItem(item: Announcement) { setAnnouncements((items) => items.some((existing) => existing.id === item.id) ? items.map((existing) => existing.id === item.id ? item : existing) : [item, ...items]); }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    setError(""); setMessage("");
    const values = new FormData(event.currentTarget);
    const title = String(values.get("title") ?? "").trim();
    const body = String(values.get("body") ?? "").trim();
    const priority = String(values.get("priority") ?? "normal");
    const audience = String(values.get("audience") ?? "all") as Audience;
    const committeeId = String(values.get("committee") ?? "") || null;
    if (!conferences.some((item) => item.id === conferenceId) || !title || title.length > 160 || !body || body.length > 10000 || !["normal", "important", "urgent"].includes(priority)) { setError("Choose a conference, enter a title up to 160 characters and a message up to 10,000 characters."); return; }
    if (!Object.hasOwn(audienceLabel, audience)) { setError("Choose who should receive this update."); return; }
    if (committeeId && !committees.some((item) => item.id === committeeId && item.conference_id === conferenceId)) { setError("Choose a committee in this conference."); return; }
    lock.current = true; setBusy(true);
    try {
      const client = createClient();
      const payload = { conference_id: conferenceId, committee_id: committeeId, title, body, priority, audience };
      const query = editing ? client.from("announcements").update(payload).eq("id", editing.id).eq("conference_id", conferenceId) : client.from("announcements").insert({ ...payload, published: false });
      const { data, error: saveError } = await query.select(fields).single();
      if (saveError || !data) throw new Error("Could not save the announcement. Check your connection and organiser access, then try again.");
      replaceItem(data); resetEditor();
      setMessage(data.published ? "Changes saved to the published announcement." : "Draft saved. Publish it when it is ready for attendees.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Saving failed. Please try again."); }
    finally { lock.current = false; setBusy(false); }
  }

  async function toggle(item: Announcement) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(""); setMessage("");
    try {
      const changes = item.published ? { published: false } : { published: true, published_at: new Date().toISOString(), expires_at: null };
      const client = createClient();
      const { data, error: updateError } = await client.from("announcements").update(changes).eq("id", item.id).eq("conference_id", conferenceId).select(fields).single();
      if (updateError || !data) throw new Error("Could not change visibility. Check your connection and organiser access, then try again.");
      replaceItem(data);
      setMessage(data.published ? "Announcement published in Updates." : "Announcement hidden from attendees.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Update failed. Please try again."); }
    finally { lock.current = false; setBusy(false); }
  }

  return <div className="space-y-8">
    <header className="space-y-3"><Link href="/protected" className="text-sm underline underline-offset-4">← Dashboard</Link><p className="text-xs font-semibold tracking-[0.2em] text-emerald-700 dark:text-emerald-300">CONFERENCE UPDATES</p><h1 className="text-4xl font-semibold tracking-tight">Announcements</h1><p className="max-w-2xl text-muted-foreground">Keep attendees informed about changes, reminders and essential conference news. Phone alerts require a separate web push setup and are not active yet.</p></header>
    <div className="max-w-md space-y-2"><Label htmlFor="announcement-conference">Conference</Label><select id="announcement-conference" className={selectClass} value={conferenceId} disabled={busy || !!editing} onChange={(event) => { setConferenceId(event.target.value); resetEditor(); setError(""); setMessage(""); }}>{conferences.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>{!conferences.length && <p className="text-sm text-muted-foreground">Create a conference before adding announcements.</p>}</div>
    {error && <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900">{error}</p>}
    {message && <p role="status" className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-950">{message}</p>}
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <form ref={formRef} key={`${conferenceId}-${editing?.id ?? "new"}-${formVersion}`} onSubmit={save} className="space-y-5 rounded-2xl border bg-card p-6">
        <div><Megaphone className="mb-3 text-emerald-700" size={24} /><h2 className="text-xl font-semibold">{editing ? "Edit announcement" : "Write an announcement"}</h2><p className="mt-1 text-sm text-muted-foreground">{editing?.published ? "Saving updates this published announcement immediately." : "Save a draft, then publish when ready."}</p></div>
        <fieldset disabled={busy || !conferenceId} className="space-y-5">
          <div className="space-y-2"><Label htmlFor="announcement-title">Title</Label><Input id="announcement-title" name="title" required maxLength={160} defaultValue={editing?.title ?? ""} placeholder="A short, clear headline" /></div>
          <div className="space-y-2"><Label htmlFor="announcement-body">Message</Label><textarea id="announcement-body" name="body" required maxLength={10000} rows={7} defaultValue={editing?.body ?? ""} className={`${selectClass} resize-y`} /></div>
          <div className="space-y-2"><Label htmlFor="announcement-priority">Priority</Label><select id="announcement-priority" name="priority" className={selectClass} defaultValue={editing?.priority ?? "normal"}><option value="normal">Normal</option><option value="important">Important</option><option value="urgent">Urgent</option></select></div>
          <div className="space-y-2"><Label htmlFor="announcement-audience">Send to</Label><select id="announcement-audience" name="audience" className={selectClass} defaultValue={editing?.audience ?? "all"}><option value="all">Chairs and delegates</option><option value="chair">Chairs only</option><option value="member">Delegates only</option></select><p className="text-xs text-muted-foreground">Only the selected group will see this update in the app.</p></div>
          <div className="space-y-2"><Label htmlFor="announcement-committee">Committee category</Label><select id="announcement-committee" name="committee" className={selectClass} defaultValue={editing?.committee_id ?? ""}><option value="">General announcement</option>{committees.filter((item) => item.conference_id === conferenceId).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><p className="text-xs text-muted-foreground">Published announcements are public. Choosing a committee categorises the update; it does not restrict access.</p></div>
          <div className="flex flex-wrap gap-3"><Button type="submit" disabled={busy || !conferenceId}>{busy ? "Saving…" : editing ? "Save changes" : "Save draft"}</Button>{editing && <Button type="button" variant="outline" disabled={busy} onClick={resetEditor}>Cancel editing</Button>}</div>
        </fieldset>
      </form>
      <section className="space-y-4" aria-label="Conference announcements"><div className="flex items-center justify-between"><h2 className="text-xl font-semibold">Conference updates</h2><span className="text-sm text-muted-foreground">{visible.length} total</span></div>
        {!visible.length && <div className="rounded-2xl border border-dashed p-8 text-center"><Megaphone className="mx-auto mb-3 text-muted-foreground" /><h3 className="font-semibold">No announcements yet</h3><p className="mt-2 text-sm text-muted-foreground">Start with a welcome message or an arrival reminder.</p></div>}
        {visible.map((item) => <article key={item.id} className="space-y-4 rounded-2xl border bg-card p-5"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{item.published ? item.expires_at && new Date(item.expires_at) <= new Date() ? "Expired" : "Published" : "Draft / hidden"}</span><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-950">{audienceLabel[item.audience]}</span><span className="text-xs font-semibold capitalize">{item.priority}</span></div><div><h3 className="break-words font-semibold">{item.title}</h3><p className="mt-1 text-sm text-muted-foreground">{committees.find((committee) => committee.id === item.committee_id)?.name ?? "General announcement"}</p></div><p className="whitespace-pre-wrap break-words text-sm">{item.body}</p><div className="flex flex-wrap gap-3"><Button variant="outline" disabled={busy || !!editing} onClick={() => { setEditing(item); setError(""); setMessage(""); requestAnimationFrame(() => { formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); formRef.current?.querySelector<HTMLInputElement>("input")?.focus({ preventScroll: true }); }); }}>Edit</Button><Button variant="secondary" disabled={busy || !!editing} onClick={() => void toggle(item)}>{item.published ? "Hide from app" : "Publish to app"}</Button></div></article>)}
      </section>
    </div>
  </div>;
}
