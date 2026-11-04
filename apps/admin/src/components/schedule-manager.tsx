"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { localTime, toInstant } from "@/lib/berlin-time";
import { Label } from "@/components/ui/label";

type Conference = { id: string; name: string };
type Committee = { id: string; name: string; conference_id: string };
type ScheduleEvent = { id: string; conference_id: string; committee_id: string | null; title: string; description: string | null; event_type: string; room_name: string | null; starts_at: string; ends_at: string; published: boolean };
const fields = "id,conference_id,committee_id,title,description,event_type,room_name,starts_at,ends_at,published";
const controlClass = "w-full rounded-md border bg-background px-3 py-2 text-sm";

export function ScheduleManager({ conferences, committees, initialEvents }: { conferences: Conference[]; committees: Committee[]; initialEvents: ScheduleEvent[] }) {
  const [events, setEvents] = useState(initialEvents);
  const [conferenceId, setConferenceId] = useState(conferences[0]?.id ?? "");
  const [editing, setEditing] = useState<ScheduleEvent | null>(null);
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const lock = useRef(false);
  const visible = events.filter((item) => item.conference_id === conferenceId).sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at));
  function reset() { setEditing(null); setRevision((value) => value + 1); }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    const values = new FormData(event.currentTarget);
    setError(""); setMessage("");
    lock.current = true; setBusy(true);
    try {
      const title = String(values.get("title") ?? "").trim();
      const committeeId = String(values.get("committee") ?? "");
      if (!conferences.some((item) => item.id === conferenceId)) throw new Error("Choose a valid conference.");
      if (!title || title.length > 160) throw new Error("Enter a title up to 160 characters.");
      if (committeeId && !committees.some((item) => item.id === committeeId && item.conference_id === conferenceId)) throw new Error("Choose a committee belonging to this conference.");
      const startsAt = toInstant(String(values.get("start")));
      const endsAt = toInstant(String(values.get("end")));
      if (Date.parse(endsAt) <= Date.parse(startsAt)) throw new Error("The end must be after the start.");
      const payload = { conference_id: conferenceId, committee_id: committeeId || null, title, description: String(values.get("description") ?? "").trim() || null, room_name: String(values.get("room") ?? "").trim() || null, event_type: String(values.get("type") ?? "session").trim() || "session", starts_at: startsAt, ends_at: endsAt, published: values.get("published") === "on" };
      const table = createClient().from("schedule_events");
      const query = editing ? table.update(payload).eq("id", editing.id).eq("conference_id", conferenceId) : table.insert(payload);
      const { data, error: saveError } = await query.select(fields).single();
      if (saveError || !data) throw new Error("Could not save the event. Check your connection and organiser access, then try again.");
      setEvents((items) => [...items.filter((item) => item.id !== data.id), data]);
      reset(); setMessage(data.published ? "Event saved and published. Attendees can refresh their schedule." : "Draft saved. Publish it when the programme is approved.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save the event."); }
    finally { lock.current = false; setBusy(false); }
  }

  async function toggle(item: ScheduleEvent) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(""); setMessage("");
    try {
      const { data, error: saveError } = await createClient().from("schedule_events").update({ published: !item.published }).eq("id", item.id).eq("conference_id", conferenceId).select(fields).single();
      if (saveError || !data) throw new Error("Could not change visibility. Check your connection and organiser access.");
      setEvents((items) => items.map((existing) => existing.id === item.id ? data : existing));
      setMessage(data.published ? "Event published to the app." : "Event hidden from the app.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Update failed."); }
    finally { lock.current = false; setBusy(false); }
  }

  return <div className="space-y-8">
    <header className="space-y-3"><Link href="/protected" className="text-sm underline underline-offset-4">← Dashboard</Link><p className="text-xs font-semibold tracking-[0.2em] text-emerald-700 dark:text-emerald-300">CONFERENCE PROGRAMME</p><h1 className="text-4xl font-semibold tracking-tight">Schedule</h1><p className="text-muted-foreground">Prepare sessions as drafts, then publish the approved programme.</p></header>
    <div className="max-w-md space-y-2"><Label htmlFor="schedule-conference">Conference</Label><select id="schedule-conference" className={controlClass} value={conferenceId} disabled={busy || !!editing} onChange={(event) => { setConferenceId(event.target.value); reset(); setMessage(""); setError(""); }}>{conferences.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
    {!conferences.length && <p role="status">No conferences are available yet.</p>}
    {error && <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900">{error}</p>}
    {message && <p role="status" className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-950">{message}</p>}
    <div className="grid items-start gap-8 lg:grid-cols-2">
      <form key={`${conferenceId}-${editing?.id ?? "new"}-${revision}`} onSubmit={save} className="space-y-5 rounded-2xl border bg-card p-6">
        <h2 className="text-xl font-semibold">{editing ? "Edit event" : "New event"}</h2>
        <fieldset disabled={busy || !conferenceId} className="space-y-5">
          <div className="space-y-2"><Label htmlFor="event-title">Title</Label><Input id="event-title" name="title" required maxLength={160} defaultValue={editing?.title} /></div>
          <div className="space-y-2"><Label htmlFor="event-committee">Audience</Label><select id="event-committee" name="committee" className={controlClass} defaultValue={editing?.committee_id ?? ""}><option value="">All committees</option>{committees.filter((item) => item.conference_id === conferenceId).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
          <p className="rounded-lg bg-muted p-3 text-sm">All times are Karlsruhe local time (Europe/Berlin), regardless of your device timezone.</p>
          <div className="space-y-2"><Label htmlFor="event-start">Starts (Berlin time)</Label><Input id="event-start" name="start" type="datetime-local" required defaultValue={editing ? localTime(editing.starts_at) : ""} /></div>
          <div className="space-y-2"><Label htmlFor="event-end">Ends (Berlin time)</Label><Input id="event-end" name="end" type="datetime-local" required defaultValue={editing ? localTime(editing.ends_at) : ""} /></div>
          <div className="space-y-2"><Label htmlFor="event-room">Room (optional)</Label><Input id="event-room" name="room" maxLength={160} defaultValue={editing?.room_name ?? ""} /></div>
          <div className="space-y-2"><Label htmlFor="event-type">Event type</Label><Input id="event-type" name="type" required maxLength={60} defaultValue={editing?.event_type ?? "session"} placeholder="session, ceremony, break, social" /></div>
          <div className="space-y-2"><Label htmlFor="event-description">Description (optional)</Label><textarea id="event-description" name="description" className={controlClass} rows={4} maxLength={5000} defaultValue={editing?.description ?? ""} /></div>
          <label className="flex items-center gap-3 text-sm"><input type="checkbox" name="published" defaultChecked={editing?.published ?? false} />Published in the attendee app</label>
          <div className="flex flex-wrap gap-3"><Button type="submit">{busy ? "Saving…" : editing ? "Save changes" : "Save event"}</Button>{editing && <Button type="button" variant="outline" onClick={reset}>Cancel editing</Button>}</div>
        </fieldset>
      </form>
      <section className="space-y-4" aria-label="Schedule events"><h2 className="text-xl font-semibold">Programme · {visible.length} events</h2>{!visible.length && <p className="rounded-2xl border border-dashed p-8 text-muted-foreground">No events yet. Create your first draft.</p>}{visible.map((item) => <article key={item.id} className="space-y-3 rounded-2xl border bg-card p-5"><div className="flex items-start justify-between gap-3"><h3 className="break-words font-semibold">{item.title}</h3><span className="rounded-full bg-muted px-3 py-1 text-xs">{item.published ? "Published" : "Draft"}</span></div><p className="text-sm">{localTime(item.starts_at).replace("T", " · ")} – {localTime(item.ends_at).replace("T", " · ")} (Berlin)</p><p className="text-sm text-muted-foreground">{committees.find((committee) => committee.id === item.committee_id)?.name ?? "All committees"} · {item.room_name || "Room to be confirmed"}</p>{item.description && <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{item.description}</p>}<div className="flex flex-wrap gap-3"><Button variant="outline" disabled={busy || !!editing} onClick={() => { setEditing(item); setMessage(""); setError(""); }}>Edit</Button><Button variant="secondary" disabled={busy || !!editing} onClick={() => void toggle(item)}>{item.published ? "Hide from app" : "Publish to app"}</Button></div></article>)}</section>
    </div>
  </div>;
}
