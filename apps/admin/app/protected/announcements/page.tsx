import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AnnouncementManager } from "@/components/announcement-manager";

export const instant = false;

export default async function AnnouncementsPage() {
  const client = await createClient();
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) redirect("/auth/login");
  const { data: admin } = await client.from("admin_profiles").select("role").eq("user_id", auth.user.id).maybeSingle();
  if (!admin) redirect("/auth/error?error=Organiser access required");
  const [conferences, committees, announcements] = await Promise.all([
    client.from("conferences").select("id,name").order("starts_at"),
    client.from("committees").select("id,name,conference_id").order("name"),
    client.from("announcements").select("id,title,body,priority,audience,conference_id,committee_id,published,published_at,expires_at").order("created_at", { ascending: false }),
  ]);
  if (announcements.error?.code === "42703") {
    return <div role="alert" className="rounded-xl border p-6">The audience migration has not been applied in Supabase yet. Run <code>202610210003_announcement_audiences.sql</code>, then reload this page.</div>;
  }
  if (conferences.error || committees.error || announcements.error) {
    return <div role="alert" className="rounded-xl border p-6">Announcements could not be loaded. Refresh this page to try again.</div>;
  }
  return <AnnouncementManager conferences={conferences.data ?? []} committees={committees.data ?? []} initialAnnouncements={announcements.data ?? []} />;
}
