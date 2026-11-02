import { AccessExpiredError, accessHasExpired, functionErrorReason } from '@/lib/function-errors';
import { supabase } from '@/lib/supabase';

import { KAMUN_CONFERENCE_ID } from '@/lib/conference-id';
import { resumePendingSignOut } from '@/lib/ecg-handoff';
export { KAMUN_CONFERENCE_ID } from '@/lib/conference-id';

export type ClaimedAttendeeAccess = {
  conferenceId: string;
  conferenceSlug: string;
  accessType: 'chair' | 'member';
  accessLabel: string;
  committeeId: string | null;
  committeeName: string | null;
  committeeAbbreviation: string | null;
  seatLabel: string | null;
  identitySource: 'ecg' | 'legacy_code';
};

type ClaimRow = {
  conference_id: string;
  conference_slug: string;
  access_type: 'chair' | 'member';
  access_label: string;
  committee_id: string | null;
  committee_name: string | null;
  committee_abbreviation: string | null;
  seat_label?: string | null;
  identity_source?: 'ecg' | 'legacy_code';
};

function mapRow(row: ClaimRow, source: 'ecg' | 'legacy_code'): ClaimedAttendeeAccess {
  return {
    conferenceId: row.conference_id,
    conferenceSlug: row.conference_slug,
    accessType: row.access_type,
    accessLabel: row.access_label,
    committeeId: row.committee_id,
    committeeName: row.committee_name,
    committeeAbbreviation: row.committee_abbreviation,
    seatLabel: row.seat_label ?? null,
    identitySource: row.identity_source ?? source,
  };
}

async function ensureSession() {
  await resumePendingSignOut();
  if (!supabase) throw new Error('The KAMUN backend is not configured.');
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!data.session) {
    const { error: signInError } = await supabase.auth.signInAnonymously();
    if (signInError) throw signInError;
  }
  return supabase;
}

export async function claimAttendeeAccess(code: string): Promise<ClaimedAttendeeAccess> {
  const client = await ensureSession();
  const { data, error } = await client.functions.invoke('ecg-claim', {
    body: { code: code.trim(), conferenceId: KAMUN_CONFERENCE_ID },
  });
  if (error || !data?.membership) {
    const reason = await functionErrorReason(data, error);
    throw new Error(typeof reason === 'string' ? reason : 'unavailable');
  }
  return mapRow(data.membership as ClaimRow, 'ecg');
}

// Existing KAMUN codes remain available until the production personal-code migration.
async function claimLegacyAccess(code: string, expectedType: 'chair' | 'member'): Promise<ClaimedAttendeeAccess> {
  const client = await ensureSession();
  const { data, error } = await client.rpc('claim_attendee_access_code', { p_code: code.trim() });
  if (error) throw error;
  const row = (data as ClaimRow[] | null)?.[0];
  if (!row || row.access_type !== expectedType) throw new Error('Invalid KAMUN code.');
  return mapRow(row, 'legacy_code');
}

export const claimLegacyChairAccess = (code: string) => claimLegacyAccess(code, 'chair');
export const claimLegacyMemberAccess = (code: string) => claimLegacyAccess(code, 'member');

async function restorePreMigrationMembership(): Promise<ClaimedAttendeeAccess | null> {
  if (!supabase) return null;
  const { data: membership, error } = await supabase.from('attendee_memberships')
    .select('access_type,committee_id').eq('conference_id', KAMUN_CONFERENCE_ID).maybeSingle();
  if (error) throw error;
  if (!membership) return null;
  const { data: committee, error: committeeError } = membership.committee_id
    ? await supabase.from('committees').select('name,abbreviation')
      .eq('id', membership.committee_id).maybeSingle()
    : { data: null, error: null };
  if (committeeError) throw committeeError;
  return {
    conferenceId: KAMUN_CONFERENCE_ID,
    conferenceSlug: 'kamun-2026',
    accessType: membership.access_type,
    accessLabel: membership.access_type === 'chair' ? 'Chair' : 'Delegate',
    committeeId: membership.committee_id,
    committeeName: committee?.name ?? null,
    committeeAbbreviation: committee?.abbreviation ?? null,
    seatLabel: null,
    identitySource: 'legacy_code',
  };
}

export async function restoreAttendeeAccess(): Promise<ClaimedAttendeeAccess | null> {
  if (!supabase) return null;
  if (await resumePendingSignOut()) return null;
  const { data: session, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    if ([400, 401, 403].includes(sessionError.status ?? 0)) throw new AccessExpiredError('unauthorized');
    throw sessionError;
  }
  if (!session.session) return null;
  const { data: membership, error: membershipError } = await supabase.from('attendee_memberships')
    .select('identity_source').eq('conference_id', KAMUN_CONFERENCE_ID).maybeSingle();
  if (membershipError?.code === '42703') return restorePreMigrationMembership();
  if (membershipError) throw membershipError;
  if (!membership) return null;
  if (membership.identity_source === 'ecg') {
    const { data, error } = await supabase.functions.invoke('ecg-refresh', {
      body: { conferenceId: KAMUN_CONFERENCE_ID },
    });
    if (error || data?.error) {
      const reason = await functionErrorReason(data, error);
      if (accessHasExpired(reason)) throw new AccessExpiredError(reason!);
      throw new Error('ECE identity could not be refreshed.');
    }
  }
  const { data, error } = await supabase.rpc('my_current_attendee_profile', {
    p_conference_id: KAMUN_CONFERENCE_ID,
  });
  if (error) throw error;
  const row = (data as ClaimRow[] | null)?.[0];
  return row ? mapRow(row, membership.identity_source === 'ecg' ? 'ecg' : 'legacy_code') : null;
}
