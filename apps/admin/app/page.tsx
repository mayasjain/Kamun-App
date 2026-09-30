import { AuthButton } from "@/components/auth-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasEnvVars } from "@/lib/utils";
import { CalendarDays, Megaphone, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

const capabilities = [
  {
    icon: CalendarDays,
    title: "Keep the programme accurate",
    body: "Manage committees, rooms and the three-day schedule from one place.",
  },
  {
    icon: Megaphone,
    title: "Publish clear updates",
    body: "Create announcements and control when attendee content becomes visible.",
  },
  {
    icon: ShieldCheck,
    title: "Protect organiser access",
    body: "Only authenticated KAMUN organisers can change conference information.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="font-semibold tracking-wide">KAMUN ORGANISER</Link>
        {!hasEnvVars ? <EnvVarWarning /> : <Suspense><AuthButton /></Suspense>}
      </nav>

      <section className="mx-auto grid min-h-[72vh] max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="mb-5 text-sm font-semibold tracking-[0.2em] text-teal-300">THE BLACK FOREST SUMMIT</p>
          <h1 className="max-w-3xl text-5xl font-semibold leading-tight sm:text-7xl">
            Run the conference from one calm dashboard.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">
            Prepare the KAMUN schedule, publish updates and keep essential attendee information current across iPhone and Android.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button asChild size="lg"><Link href="/protected">Open dashboard</Link></Button>
            <Button asChild size="lg" variant="outline" className="border-slate-600 bg-transparent text-white hover:bg-slate-900 hover:text-white">
              <Link href="/auth/login">Organiser sign in</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {capabilities.map(({ icon: Icon, title, body }) => (
            <Card key={title} className="border-slate-700 bg-slate-900 text-white">
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <Icon className="text-teal-300" size={20} />
                <CardTitle className="text-base">{title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-slate-400">{body}</CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
