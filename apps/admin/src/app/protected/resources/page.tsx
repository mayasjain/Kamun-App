import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ResourceManager } from "@/components/resource-manager";

export const instant = false;

export default async function ResourcesPage() {
  const client = await createClient();
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) redirect("/auth/login");
  const { data: admin } = await client.from("admin_profiles").select("role").eq("user_id", auth.user.id).maybeSingle();
  if (!admin) redirect("/auth/error?error=Organiser access required");
  const [conferences, committees, resources] = await Promise.all([
    client.from("conferences").select("id,name").order("starts_at"),
    client.from("committees").select("id,name,conference_id").order("name"),
    client.from("resources").select("id,title,conference_id,committee_id,url,published,kind").order("created_at", { ascending: false }),
  ]);
  if (conferences.error || committees.error || resources.error) {
    return <div role="alert" className="rounded-xl border p-6">Resources could not be loaded. Refresh this page to try again.</div>;
  }
  return <ResourceManager conferences={conferences.data ?? []} committees={committees.data ?? []} initialResources={resources.data ?? []} />;
}
