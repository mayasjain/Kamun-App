import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { CalendarDays, FileText, MapPin, Megaphone, PhoneCall, Users } from "lucide-react";
import { redirect } from "next/navigation";

export const instant = false;

const modules = [
  { icon: Users, title: "Committees", value: "Seed data ready", body: "Names, abbreviations, topics and rooms" },
  { icon: CalendarDays, title: "Schedule", value: "4 sample events", body: "Conference-wide and committee sessions" },
  { icon: Megaphone, title: "Announcements", value: "Draft workflow", body: "Publish and expire attendee updates" },
  { icon: FileText, title: "Resources", value: "3 sample records", body: "General and committee documents" },
  { icon: MapPin, title: "Locations", value: "KIT venue", body: "Rooms, directions and external maps" },
  { icon: PhoneCall, title: "Safety contacts", value: "Needs approval", body: "Emergency and welfare information" },
];

export default async function ProtectedPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) redirect("/auth/login");

  const userId = data.claims.sub;
  if (typeof userId !== "string") redirect("/auth/login");

  const { data: adminProfile } = await supabase
    .from("admin_profiles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (!adminProfile) redirect("/auth/error?error=Organiser access required");

  return (
    <div className="w-full space-y-8">
      <header>
        <p className="text-sm font-semibold tracking-[0.16em] text-teal-700">KAMUN 2026</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Conference dashboard</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          The foundation is connected to organiser authentication. CRUD forms will be added against the initial Supabase schema next.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map(({ icon: Icon, title, value, body }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-lg">{title}</CardTitle>
                <p className="mt-1 text-sm font-medium text-teal-700">{value}</p>
              </div>
              <Icon className="text-muted-foreground" size={20} />
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{body}</CardContent>
          </Card>
        ))}
      </section>

      <section className="rounded-2xl border bg-teal-50 p-6 text-teal-950">
        <h2 className="text-lg font-semibold">Next implementation slice</h2>
        <p className="mt-2 text-sm leading-6">
          Connect the schedule cards to Supabase, then add create/edit/publish forms with organiser-role checks.
        </p>
      </section>
    </div>
  );
}
