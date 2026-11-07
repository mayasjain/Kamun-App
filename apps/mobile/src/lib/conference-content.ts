import { supabase } from '@/lib/supabase';

export type Conference = {
  id: string;
  name: string;
  theme: string | null;
  startsAt: string;
  endsAt: string;
  timezone: string;
  venueName: string | null;
};

export type Committee = {
  id: string;
  name: string;
  abbreviation: string;
  topic: string | null;
  colour: string | null;
  roomName: string | null;
  experienceLevel: string | null;
  participantGroup: string | null;
  chairs: string[];
};

export type ScheduleEvent = {
  id: string;
  committeeId: string | null;
  title: string;
  description: string | null;
  eventType: string;
  roomName: string | null;
  startsAt: string;
  endsAt: string;
};

export type Announcement = {
  id: string;
  committeeId: string | null;
  audience: 'all' | 'chair' | 'member';
  title: string;
  body: string;
  priority: 'normal' | 'important' | 'urgent';
  publishedAt: string;
};

export type Resource = {
  id: string;
  committeeId: string | null;
  title: string;
  kind: string;
  url: string;
  sortOrder: number;
};

export type ConferenceLocation = {
  id: string;
  name: string;
  category: string;
  address: string | null;
  description: string | null;
  externalMapsUrl: string | null;
};

export type EmergencyContact = {
  id: string;
  label: string;
  personName: string | null;
  role: string | null;
  phone: string | null;
  email: string | null;
  isEmergency: boolean;
};

export type ConferenceContent = {
  conference: Conference;
  committees: Committee[];
  scheduleEvents: ScheduleEvent[];
  announcements: Announcement[];
  resources: Resource[];
  locations: ConferenceLocation[];
  emergencyContacts: EmergencyContact[];
};

export async function fetchConferenceContent(
  conferenceId: string,
  committeeId: string | null,
  accessType: 'chair' | 'member',
): Promise<ConferenceContent> {
  if (!supabase) throw new Error('The KAMUN backend is not configured.');

  const detailedCommitteesResult = await supabase
    .from('committees')
    .select('id,name,abbreviation,topic,colour,room_name,experience_level,participant_group,display_order,committee_chairs(name,sort_order)')
    .eq('conference_id', conferenceId)
    .eq('published', true)
    .order('display_order');

  const committeesResult = detailedCommitteesResult.error
    ? await supabase.from('committees').select('id,name,abbreviation,topic,colour,room_name').eq('conference_id', conferenceId).eq('published', true).order('name')
    : detailedCommitteesResult;

  const [conferenceResult, scheduleResult, currentAnnouncementsResult, resourcesResult, locationsResult, contactsResult] = await Promise.all([
    supabase.from('conferences').select('id,name,theme,starts_at,ends_at,timezone,venue_name').eq('id', conferenceId).single(),
    supabase.from('schedule_events').select('id,committee_id,title,description,event_type,room_name,starts_at,ends_at').eq('conference_id', conferenceId).eq('published', true).order('starts_at'),
    supabase.from('announcements').select('id,committee_id,audience,title,body,priority,published_at').eq('conference_id', conferenceId).eq('published', true).order('published_at', { ascending: false }),
    supabase.from('resources').select('id,committee_id,title,kind,url,sort_order').eq('conference_id', conferenceId).eq('published', true).order('sort_order'),
    supabase.from('locations').select('id,name,category,address,description,external_maps_url').eq('conference_id', conferenceId).eq('published', true).order('sort_order'),
    supabase.from('emergency_contacts').select('id,label,person_name,role,phone,email,is_emergency').eq('conference_id', conferenceId).eq('published', true).order('sort_order'),
  ]);

  // Keep the existing app usable until the audience migration reaches Supabase.
  const announcementsResult = currentAnnouncementsResult.error?.code === '42703'
    ? await supabase.from('announcements').select('id,committee_id,title,body,priority,published_at').eq('conference_id', conferenceId).eq('published', true).order('published_at', { ascending: false })
    : currentAnnouncementsResult;

  const error = [conferenceResult, committeesResult, scheduleResult, announcementsResult, resourcesResult, locationsResult, contactsResult]
    .find((result) => result.error)?.error;
  if (error) throw error;

  const conference = conferenceResult.data;
  if (!conference) throw new Error('Conference content was not found.');

  const isIpc = committeesResult.data?.some(c => c.id === committeeId && c.abbreviation?.toUpperCase() === 'IPC') ?? false;

  const matchesAudience = <T extends { committee_id: string | null }>(item: T) =>
    item.committee_id === null || committeeId === null || item.committee_id === committeeId;

  return {
    conference: {
      id: conference.id,
      name: conference.name,
      theme: conference.theme,
      startsAt: conference.starts_at,
      endsAt: conference.ends_at,
      timezone: conference.timezone,
      venueName: conference.venue_name,
    },
    committees: (committeesResult.data ?? []).map((item) => ({
      id: item.id, name: item.name, abbreviation: item.abbreviation, topic: item.topic,
      colour: item.colour, roomName: item.room_name,
      experienceLevel: 'experience_level' in item ? item.experience_level as string | null : null,
      participantGroup: 'participant_group' in item ? item.participant_group as string | null : null,
      chairs: 'committee_chairs' in item && Array.isArray(item.committee_chairs)
        ? [...item.committee_chairs]
            .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
            .map((chair) => String(chair.name))
        : [],
    })),
    scheduleEvents: (scheduleResult.data ?? []).filter(matchesAudience).map((item) => ({
      id: item.id, committeeId: item.committee_id, title: item.title, description: item.description,
      eventType: item.event_type, roomName: item.room_name, startsAt: item.starts_at, endsAt: item.ends_at,
    })),
    announcements: (announcementsResult.data ?? []).filter((item) =>
      matchesAudience(item) && (!('audience' in item) || item.audience === 'all' || item.audience === accessType)
    ).map((item) => ({
      id: item.id, committeeId: item.committee_id, audience: 'audience' in item ? item.audience as Announcement['audience'] : 'all', title: item.title, body: item.body,
      priority: item.priority as Announcement['priority'], publishedAt: item.published_at,
    })),
    resources: (resourcesResult.data ?? []).filter(item => isIpc || matchesAudience(item)).map((item) => ({
      id: item.id, committeeId: item.committee_id, title: item.title, kind: item.kind,
      url: item.url, sortOrder: item.sort_order,
    })),
    locations: (locationsResult.data ?? []).map((item) => ({
      id: item.id, name: item.name, category: item.category, address: item.address,
      description: item.description, externalMapsUrl: item.external_maps_url,
    })),
    emergencyContacts: (contactsResult.data ?? []).map((item) => ({
      id: item.id, label: item.label, personName: item.person_name, role: item.role,
      phone: item.phone, email: item.email, isEmergency: item.is_emergency,
    })),
  };
}
