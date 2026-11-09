/** ECE imports use five characters; existing eight-character ECE codes remain valid. */
export function codeKind(value: string): 'ecg' | 'chair' | 'legacy_member' | 'organizer' {
  const code = value.trim().toUpperCase();
  if (/^(?:[A-Z0-9]{5}|[A-Z0-9]{8})$/.test(code.replace(/[\s\p{Pd}]+/gu, '')))
    return 'ecg';
  if (code.startsWith('ORGA-')) return 'organizer';
  if (/^KAMUN-[A-Z]{4,16}$/.test(code)) return 'legacy_member';
  if (/^[A-Z]{2,8}-[A-Z0-9]{8}$/.test(code)) return 'chair';
  return 'organizer';
}
