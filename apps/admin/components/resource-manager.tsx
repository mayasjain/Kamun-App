"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { FileText, Upload, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Conference = { id: string; name: string };
type Committee = { id: string; name: string; conference_id: string };
type Resource = { id: string; title: string; conference_id: string; committee_id: string | null; url: string; published: boolean; kind: string };
const bucket = "conference-resources";
const selectClass = "w-full rounded-md border bg-background px-3 py-2 text-sm";

export function ResourceManager({ conferences, committees, initialResources }: { conferences: Conference[]; committees: Committee[]; initialResources: Resource[] }) {
  const [resources, setResources] = useState(initialResources);
  const [conferenceId, setConferenceId] = useState(conferences[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const lock = useRef(false);
  const visible = resources.filter((item) => item.conference_id === conferenceId);

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const title = String(values.get("title") ?? "").trim();
    const file = values.get("pdf");
    setError(""); setMessage("");
    if (!title || title.length > 160 || !conferenceId) { setError("Choose a conference and enter a title up to 160 characters."); return; }
    if (!(file instanceof File) || !file.size || file.size > 15 * 1024 * 1024 || !file.name.toLowerCase().endsWith(".pdf")) { setError("Choose a PDF no larger than 15 MB."); return; }
    lock.current = true; setBusy(true);
    const client = createClient();
    let uploadedPath: string | null = null;
    try {
      const signature = new TextDecoder().decode(await file.slice(0, 5).arrayBuffer());
      if (signature !== "%PDF-") throw new Error("This file does not appear to be a PDF.");
      const path = `${conferenceId}/${crypto.randomUUID()}.pdf`;
      const result = await client.storage.from(bucket).upload(path, file, { contentType: "application/pdf", upsert: false });
      if (result.error) throw new Error("Upload failed. Check your organiser access and that storage migration 007 has been applied.");
      uploadedPath = path;
      const { data: urlData } = client.storage.from(bucket).getPublicUrl(path);
      const { data, error: saveError } = await client.from("resources").insert({
        conference_id: conferenceId, title, committee_id: values.get("committee") || null,
        kind: "pdf", url: urlData.publicUrl, published: values.get("published") === "on",
      }).select("id,title,conference_id,committee_id,url,published,kind").single();
      if (saveError || !data) throw new Error("The resource could not be saved. Please try again.");
      uploadedPath = null;
      setResources((items) => [data, ...items]);
      form.reset();
      setMessage(data.published ? "PDF published. Attendees will see it after refreshing the app." : "PDF uploaded. Its app listing is hidden until you publish it.");
    } catch (cause) {
      let cleanupNote = "";
      if (uploadedPath) {
        const cleanup = await client.storage.from(bucket).remove([uploadedPath]);
        if (cleanup.error) cleanupNote = " The uploaded file remains in Storage; remove it there before retrying.";
      }
      setError((cause instanceof Error ? cause.message : "Upload failed. Please try again.") + cleanupNote);
    } finally { lock.current = false; setBusy(false); }
  }

  async function toggle(resource: Resource) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setMessage(""); setError("");
    try {
      const { data, error: updateError } = await createClient().from("resources").update({ published: !resource.published }).eq("id", resource.id).select("id").single();
      if (updateError || !data) throw new Error("Could not change visibility. Check your connection and organiser access.");
      setResources((items) => items.map((item) => item.id === resource.id ? { ...item, published: !item.published } : item));
      setMessage(resource.published ? "Resource hidden from the app. Its file link remains public." : "Resource published to the app.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Update failed. Please try again."); }
    finally { lock.current = false; setBusy(false); }
  }

  return <div className="space-y-8">
    <header className="space-y-3">
      <Link href="/protected" className="text-sm underline underline-offset-4">← Dashboard</Link>
      <p className="text-xs font-semibold tracking-[0.2em] text-emerald-700 dark:text-emerald-300">CONFERENCE LIBRARY</p>
      <h1 className="text-4xl font-semibold tracking-tight">Resources</h1>
      <p className="max-w-2xl text-muted-foreground">Give attendees the guides and policies they need, in one place.</p>
    </header>
    <div className="max-w-md space-y-2"><Label htmlFor="conference">Conference</Label><select id="conference" className={selectClass} value={conferenceId} disabled={busy} onChange={(event) => setConferenceId(event.target.value)}>{conferences.map((conference) => <option key={conference.id} value={conference.id}>{conference.name}</option>)}</select></div>
    {error && <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900">{error}</p>}
    {message && <p role="status" className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-950">{message}</p>}
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <form onSubmit={upload} className="space-y-5 rounded-2xl border bg-card p-6">
        <div><Upload className="mb-3 text-emerald-700" size={24} /><h2 className="text-xl font-semibold">Add a document</h2><p className="mt-1 text-sm text-muted-foreground">PDF files · up to 15 MB</p></div>
        <fieldset disabled={busy || !conferenceId} className="space-y-5">
          <div className="space-y-2"><Label htmlFor="title">Document title</Label><Input id="title" name="title" required maxLength={160} placeholder="Code of Conduct" /></div>
          <div className="space-y-2"><Label htmlFor="committee">Document section</Label><select key={conferenceId} id="committee" name="committee" className={selectClass}><option value="">General documents</option>{committees.filter((item) => item.conference_id === conferenceId).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><p className="text-xs text-muted-foreground">Committee selection organises the app listing; it does not make the document private.</p></div>
          <div className="space-y-2"><Label htmlFor="pdf">PDF file</Label><Input id="pdf" name="pdf" type="file" accept="application/pdf,.pdf" required className="h-auto py-2" /></div>
          <p className="rounded-lg bg-muted p-3 text-sm">Upload only documents approved for public sharing. Files are accessible by link immediately, even when their app listing is hidden.</p>
          <label className="flex items-start gap-3 text-sm"><input type="checkbox" name="published" className="mt-1" />Publish in the attendee app immediately</label>
          <Button type="submit" className="w-full" disabled={busy || !conferenceId}>{busy ? "Saving…" : "Upload PDF"}</Button>
        </fieldset>
      </form>
      <section className="space-y-4" aria-label="Uploaded resources">
        <div className="flex items-center justify-between"><h2 className="text-xl font-semibold">Conference documents</h2><span className="text-sm text-muted-foreground">{visible.length} total</span></div>
        {!visible.length && <div className="rounded-2xl border border-dashed p-8 text-center"><FileText className="mx-auto mb-3 text-muted-foreground" /><h3 className="font-semibold">Your library starts here</h3><p className="mt-2 text-sm text-muted-foreground">Upload an approved Code of Conduct or a committee guide to get started.</p></div>}
        {visible.map((resource) => <article key={resource.id} className="space-y-4 rounded-2xl border bg-card p-5">
          <div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="break-words font-semibold">{resource.title}</p><p className="mt-1 text-sm text-muted-foreground">{committees.find((item) => item.id === resource.committee_id)?.name ?? "General documents"}</p></div><span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-medium">{resource.published ? "Published" : "Hidden"}</span></div>
          <div className="flex flex-wrap items-center gap-3">{resource.url.startsWith("https://") && <Button asChild variant="outline"><a href={resource.url} target="_blank" rel="noopener noreferrer">Open document <ExternalLink size={14} /></a></Button>}<Button variant="secondary" disabled={busy} onClick={() => void toggle(resource)}>{resource.published ? "Hide from app" : "Publish to app"}</Button></div>
        </article>)}
      </section>
    </div>
  </div>;
}
