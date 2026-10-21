import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const instant = false;

export default async function ProtectedPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims || typeof data.claims.sub !== 'string') redirect('/auth/login');

  const { data: adminProfile } = await supabase
    .from('admin_profiles')
    .select('role')
    .eq('user_id', data.claims.sub)
    .maybeSingle();

  if (!adminProfile) redirect('/auth/error?error=Organiser access required');

  return (
    <div className="w-full space-y-8">
      <header>
        <p className="text-sm font-semibold tracking-[0.16em] text-teal-700">KAMUN 2026</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Conference dashboard</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Manage the programme and documents. Send announcements from organiser mode in the attendee app.
        </p>
      </header>

      <nav className="flex flex-wrap gap-3" aria-label="Dashboard sections">
        <Link href="/protected/schedule" className="inline-flex rounded-xl bg-emerald-900 px-5 py-3 font-semibold text-white hover:bg-emerald-800">
          Manage schedule →
        </Link>
        <Link href="/protected/resources" className="inline-flex rounded-xl bg-emerald-900 px-5 py-3 font-semibold text-white hover:bg-emerald-800">
          Manage resources →
        </Link>
      </nav>
    </div>
  );
}
