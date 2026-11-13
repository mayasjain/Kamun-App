import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import type { ClaimedAttendeeAccess } from '@/lib/attendee-access';
import { loadMemePostingCommittees } from '@/lib/committee-memes';

type PostingResult = { profile: ClaimedAttendeeAccess; ids: string[]; failed: boolean };

// A focus/account change cancels publication, even when the network request finishes later.
export function requestMemePostingCommittees(
 profile: ClaimedAttendeeAccess,
 load: (conferenceId: string) => Promise<string[]>,
 publish: (result: PostingResult) => void,
) {
 let active = true;
 void load(profile.conferenceId).then(ids => {
  if (active) publish({ profile, ids, failed: false });
 }, () => {
  if (active) publish({ profile, ids: [], failed: true });
 });
 return () => { active = false; };
}

export function useMemePostingCommittees(profile: ClaimedAttendeeAccess | null) {
 const [attempt, setAttempt] = useState(0);
 const [result, setResult] = useState<PostingResult | null>(null);
 useFocusEffect(useCallback(() => {
  // Retrying invalidates the previous focused request, even for the same profile.
  void attempt;
  if (!profile) return;
  return requestMemePostingCommittees(profile, loadMemePostingCommittees, setResult);
 }, [profile, attempt]));
 // A previous account's grants must never be used while the next account loads.
 return {
  ids: result?.profile === profile ? result?.ids ?? [] : [],
  failed: result?.profile === profile && result?.failed === true,
  retry: () => setAttempt(value => value + 1),
 };
}
