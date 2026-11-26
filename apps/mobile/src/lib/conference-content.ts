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

export type ConferenceContent = {
  conference: Conference;
  committees: Committee[];
  scheduleEvents: ScheduleEvent[];
  announcements: Announcement[];
  resources: Resource[];
  locations: ConferenceLocation[];
};

export async function fetchConferenceContent(conferenceId: string): Promise<ConferenceContent> {
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

  const [conferenceResult, scheduleResult, announcementsResult, resourcesResult, locationsResult] = await Promise.all([
    supabase.from('conferences').select('id,name,theme,starts_at,ends_at,timezone,venue_name').eq('id', conferenceId).single(),
    supabase.from('schedule_events').select('id,committee_id,title,description,event_type,room_name,starts_at,ends_at').eq('conference_id', conferenceId).eq('published', true).order('starts_at'),
    supabase.from('announcements').select('id,title,body,priority,published_at').eq('conference_id', conferenceId).eq('published', true).eq('audience', 'all').is('committee_id', null).order('published_at', { ascending: false }),
    supabase.from('resources').select('id,committee_id,title,kind,url,sort_order').eq('conference_id', conferenceId).eq('published', true).order('sort_order'),
    supabase.from('locations').select('id,name,category,address,description,external_maps_url').eq('conference_id', conferenceId).eq('published', true).order('sort_order'),
  ]);

  const error = [conferenceResult, committeesResult, scheduleResult, announcementsResult, resourcesResult, locationsResult]
    .find((result) => result.error)?.error;
  if (error) throw error;

  const conference = conferenceResult.data;
  if (!conference) throw new Error('Conference content was not found.');

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
    scheduleEvents: (scheduleResult.data ?? []).map((item) => ({
      id: item.id, committeeId: item.committee_id, title: item.title, description: item.description,
      eventType: item.event_type, roomName: item.room_name, startsAt: item.starts_at, endsAt: item.ends_at,
    })),
    announcements: (announcementsResult.data ?? []).map((item) => ({
      id: item.id, title: item.title, body: item.body,
      priority: item.priority as Announcement['priority'], publishedAt: item.published_at,
    })),
    resources: (resourcesResult.data ?? []).map((item) => ({
      id: item.id, committeeId: item.committee_id, title: item.title, kind: item.kind,
      url: item.url, sortOrder: item.sort_order,
    })),
    locations: (locationsResult.data ?? []).map((item) => ({
      id: item.id, name: item.name, category: item.category, address: item.address,
      description: item.description, externalMapsUrl: item.external_maps_url,
    })),
  };
}
