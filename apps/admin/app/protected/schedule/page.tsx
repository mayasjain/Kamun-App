import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ScheduleManager } from "@/components/schedule-manager";

export const instant = false;

export default async function SchedulePage() {
  const client = await createClient();
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) redirect("/auth/login");
  const { data: admin } = await client.from("admin_profiles").select("role").eq("user_id", auth.user.id).maybeSingle();
  if (!admin) redirect("/auth/error?error=Organiser access required");
  const [conferences, committees, events] = await Promise.all([
    client.from("conferences").select("id,name").order("starts_at"),
    client.from("committees").select("id,name,conference_id").order("name"),
    client.from("schedule_events").select("id,conference_id,committee_id,title,description,event_type,room_name,starts_at,ends_at,published").order("starts_at"),
  ]);
  if (conferences.error || committees.error || events.error) return <p role="alert" className="rounded-xl border p-6">Schedule could not be loaded. Refresh to try again.</p>;
  return <ScheduleManager conferences={conferences.data ?? []} committees={committees.data ?? []} initialEvents={events.data ?? []} />;
}
