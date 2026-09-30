export const demoConference = {
  name: 'KAMUN 2026',
  dates: '13–15 November 2026',
  venue: 'Karlsruhe Institute of Technology',
};

export const demoCommittees = [
  { id: 'sc', name: 'Security Council', abbreviation: 'SC', room: 'Room 101' },
  { id: 'ga1', name: 'General Assembly First Committee', abbreviation: 'GA1', room: 'Room 102' },
  { id: 'hrc', name: 'Human Rights Council', abbreviation: 'HRC', room: 'Room 103' },
] as const;

// Local preview codes only. Production codes will be validated by Supabase.
export const demoAccessCodes = {
  'KAMUN-CHAIR': { position: 'chair', label: 'Chair' },
  'KAMUN-MEMBER': { position: 'delegate', label: 'Committee member' },
} as const;

export const demoSchedule = [
  { time: '09:00–10:00', title: 'Opening ceremony', room: 'KIT · Main hall' },
  { time: '10:15–12:30', title: 'Committee session I', room: 'Committee room' },
  { time: '12:30–13:30', title: 'Lunch break', room: 'Conference area' },
  { time: '13:30–16:00', title: 'Committee session II', room: 'Committee room' },
];

export const demoAnnouncements = [
  {
    time: 'SAMPLE ANNOUNCEMENT',
    title: 'Welcome to the foundation build',
    body: 'This sample will be replaced by published Secretariat updates from Supabase.',
  },
];

export const demoResources = [
  { kind: 'GENERAL', title: 'Rules of Procedure', audience: 'All participants' },
  { kind: 'GENERAL', title: 'Code of Conduct', audience: 'All participants' },
  { kind: 'COMMITTEE', title: 'Background Guide', audience: 'Selected committee' },
];
