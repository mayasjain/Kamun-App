import { supabase } from '@/lib/supabase';

export type ClaimedAttendeeAccess = {
  conferenceId: string;
  conferenceSlug: string;
  accessType: 'chair' | 'member';
  accessLabel: string;
  committeeId: string | null;
  committeeName: string | null;
  committeeAbbreviation: string | null;
};

type ClaimRow = {
  conference_id: string;
  conference_slug: string;
  access_type: 'chair' | 'member';
  access_label: string;
  committee_id: string | null;
  committee_name: string | null;
  committee_abbreviation: string | null;
};

export async function claimAttendeeAccess(code: string): Promise<ClaimedAttendeeAccess> {
  if (!supabase) {
    throw new Error('The KAMUN backend is not configured.');
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;

  if (!sessionData.session) {
    const { error: signInError } = await supabase.auth.signInAnonymously();
    if (signInError) throw signInError;
  }

  const { data, error } = await supabase.rpc('claim_attendee_access_code', {
    p_code: code.trim(),
  });
  if (error) throw error;

  const row = (data as ClaimRow[] | null)?.[0];
  if (!row) throw new Error('The access code could not be claimed.');

  return {
    conferenceId: row.conference_id,
    conferenceSlug: row.conference_slug,
    accessType: row.access_type,
    accessLabel: row.access_label,
    committeeId: row.committee_id,
    committeeName: row.committee_name,
    committeeAbbreviation: row.committee_abbreviation,
  };
}
