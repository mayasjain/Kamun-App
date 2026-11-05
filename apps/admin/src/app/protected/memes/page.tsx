import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { MemeReview } from '@/components/meme-review';
export const instant = false;
export default async function MemesPage() {
 const client = await createClient();
 const { data: auth } = await client.auth.getUser();
 if (!auth.user) redirect('/auth/login');
 const { data: admin } = await client.from('admin_profiles').select('role').eq('user_id', auth.user.id).maybeSingle();
 if (!admin) redirect('/auth/error?error=Organiser access required');
 return <MemeReview />;
}
