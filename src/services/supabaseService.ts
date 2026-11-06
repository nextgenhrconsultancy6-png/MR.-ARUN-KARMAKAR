import { supabase } from '../lib/supabase.ts';
import { Session, CategoryPins, PartnerCategory, DEFAULT_CAT_PINS } from '../utils/sessionRules.ts';

export interface ParticipantRecord {
  id: string;
  sessionId: string;
  sessionTitle: string;
  name: string;
  email?: string;
  role: 'Host' | 'Attendee' | 'Candidate' | 'Interviewer';
  category?: string;
  status: 'lobby' | 'in_call' | 'sharing' | 'hand_raised';
  joinedAt: number;
  lastSeen: number;
}

const LOCAL_PARTICIPANTS_KEY = 'nextgenn_live_participants_v1';

export interface SupabaseHealth {
  connected: boolean;
  sessionsTableReady: boolean;
  participantsTableReady: boolean;
  pinsTableReady: boolean;
  error?: string;
}

/**
 * Check if the Supabase project is reachable and which tables are ready.
 */
export async function checkSupabaseHealth(): Promise<SupabaseHealth> {
  const result: SupabaseHealth = {
    connected: false,
    sessionsTableReady: false,
    participantsTableReady: false,
    pinsTableReady: false,
  };

  try {
    const [sessRes, partRes, pinRes] = await Promise.all([
      supabase.from('sessions').select('id').limit(1),
      supabase.from('participants').select('id').limit(1),
      supabase.from('category_pins').select('category').limit(1),
    ]);

    result.connected = true;
    result.sessionsTableReady = !sessRes.error || sessRes.error.code !== 'PGRST205';
    result.participantsTableReady = !partRes.error || partRes.error.code !== 'PGRST205';
    result.pinsTableReady = !pinRes.error || pinRes.error.code !== 'PGRST205';
  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err);
  }

  return result;
}

/* =========================================================
   SESSIONS (Webinars, Clinics, Instant Interview Rooms)
   ========================================================= */

interface DbSessionRow {
  id: string;
  title: string;
  type: string;
  category: string;
  host: string;
  start: number;
  duration_min: number;
  instant: boolean;
  pin: string | null;
  candidate: string | null;
  role: string | null;
}

function mapRowToSession(row: DbSessionRow): Session {
  return {
    id: row.id,
    title: row.title,
    type: row.type as 'webinar' | 'clinic' | 'interview',
    category: row.category as PartnerCategory | 'Interviews',
    host: row.host,
    start: Number(row.start),
    durationMin: Number(row.duration_min),
    instant: !!row.instant,
    pin: row.pin || undefined,
    candidate: row.candidate || undefined,
    role: row.role || undefined,
  };
}

function mapSessionToRow(s: Session): DbSessionRow {
  return {
    id: s.id,
    title: s.title,
    type: s.type,
    category: s.category,
    host: s.host,
    start: s.start,
    duration_min: s.durationMin,
    instant: !!s.instant,
    pin: s.pin || null,
    candidate: s.candidate || null,
    role: s.role || null,
  };
}

export async function fetchSessions(): Promise<Session[] | null> {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('start', { ascending: true });

    if (error) {
      return null;
    }

    if (data && Array.isArray(data)) {
      return data.map((r) => mapRowToSession(r as DbSessionRow));
    }
  } catch {
    // fallback
  }
  return null;
}

export async function saveSessionToDb(session: Session): Promise<boolean> {
  try {
    const row = mapSessionToRow(session);
    const { error } = await supabase.from('sessions').upsert(row);
    if (!error) return true;
  } catch {
    // ignore
  }
  return false;
}

export async function deleteSessionFromDb(sessionId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('sessions').delete().eq('id', sessionId);
    if (!error) return true;
  } catch {
    // ignore
  }
  return false;
}

/* =========================================================
   CATEGORY PINS
   ========================================================= */

export async function fetchCategoryPins(): Promise<CategoryPins | null> {
  try {
    const { data, error } = await supabase.from('category_pins').select('*');
    if (error || !data || !Array.isArray(data)) return null;

    const pins: Partial<CategoryPins> = {};
    for (const item of data) {
      if (item.category && item.pin) {
        pins[item.category as PartnerCategory] = item.pin;
      }
    }

    if (Object.keys(pins).length > 0) {
      return {
        Institutes: pins.Institutes || DEFAULT_CAT_PINS.Institutes,
        Companies: pins.Companies || DEFAULT_CAT_PINS.Companies,
        Candidates: pins.Candidates || DEFAULT_CAT_PINS.Candidates,
        'All partners': pins['All partners'] || DEFAULT_CAT_PINS['All partners'],
      };
    }
  } catch {
    // fallback
  }
  return null;
}

export async function updateCategoryPinInDb(category: PartnerCategory, pin: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('category_pins').upsert({
      category,
      pin,
      updated_at: new Date().toISOString(),
    });
    return !error;
  } catch {
    return false;
  }
}

/* =========================================================
   LIVE PARTICIPANTS
   ========================================================= */

interface DbParticipantRow {
  id: string;
  session_id: string;
  session_title: string;
  name: string;
  email: string | null;
  role: string;
  category: string | null;
  status: string;
  joined_at: number;
  last_seen: number;
}

function mapRowToParticipant(row: DbParticipantRow): ParticipantRecord {
  return {
    id: row.id,
    sessionId: row.session_id,
    sessionTitle: row.session_title,
    name: row.name,
    email: row.email || undefined,
    role: row.role as ParticipantRecord['role'],
    category: row.category || undefined,
    status: row.status as ParticipantRecord['status'],
    joinedAt: Number(row.joined_at),
    lastSeen: Number(row.last_seen),
  };
}

function mapParticipantToRow(p: ParticipantRecord): DbParticipantRow {
  return {
    id: p.id,
    session_id: p.sessionId,
    session_title: p.sessionTitle,
    name: p.name,
    email: p.email || null,
    role: p.role,
    category: p.category || null,
    status: p.status,
    joined_at: p.joinedAt,
    last_seen: p.lastSeen,
  };
}

// Local storage fallback for participants
function getLocalParticipants(): ParticipantRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_PARTICIPANTS_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        // Filter out stale participants older than 30 mins
        const cutoff = Date.now() - 30 * 60 * 1000;
        return list.filter((p: ParticipantRecord) => p.lastSeen > cutoff);
      }
    }
  } catch {
    // ignore
  }
  return [];
}

function saveLocalParticipants(list: ParticipantRecord[]) {
  try {
    localStorage.setItem(LOCAL_PARTICIPANTS_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export async function registerLiveParticipant(p: ParticipantRecord): Promise<void> {
  // 1. Update local storage immediately for responsive zero-latency UI
  const current = getLocalParticipants().filter((x) => x.id !== p.id);
  current.push(p);
  saveLocalParticipants(current);

  // 2. Sync to Supabase
  try {
    const row = mapParticipantToRow(p);
    await supabase.from('participants').upsert(row);
  } catch {
    // ignore if table not created yet
  }
}

export async function updateParticipantStatus(
  participantId: string,
  status: ParticipantRecord['status']
): Promise<void> {
  const current = getLocalParticipants();
  const target = current.find((x) => x.id === participantId);
  if (target) {
    target.status = status;
    target.lastSeen = Date.now();
    saveLocalParticipants(current);
  }

  try {
    await supabase
      .from('participants')
      .update({ status, last_seen: Date.now() })
      .eq('id', participantId);
  } catch {
    // ignore
  }
}

export async function removeLiveParticipant(participantId: string): Promise<void> {
  const current = getLocalParticipants().filter((x) => x.id !== participantId);
  saveLocalParticipants(current);

  try {
    await supabase.from('participants').delete().eq('id', participantId);
  } catch {
    // ignore
  }
}

export async function fetchAllLiveParticipants(): Promise<ParticipantRecord[]> {
  try {
    const cutoff = Date.now() - 30 * 60 * 1000;
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .gt('last_seen', cutoff)
      .order('joined_at', { ascending: false });

    if (!error && data && Array.isArray(data)) {
      const dbList = data.map((r) => mapRowToParticipant(r as DbParticipantRow));
      saveLocalParticipants(dbList);
      return dbList;
    }
  } catch {
    // ignore
  }

  return getLocalParticipants();
}

/**
 * Subscribe to realtime participant changes in Supabase
 */
export function subscribeToLiveParticipants(
  onUpdate: (participants: ParticipantRecord[]) => void
) {
  // Call initial fetch
  fetchAllLiveParticipants().then(onUpdate);

  // Set up Supabase Realtime channel
  const channel = supabase
    .channel('participants_realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'participants' },
      () => {
        fetchAllLiveParticipants().then(onUpdate);
      }
    )
    .subscribe();

  // Polling fallback every 4 seconds to guarantee admin always sees active heartbeat
  const interval = setInterval(() => {
    fetchAllLiveParticipants().then(onUpdate);
  }, 4000);

  return () => {
    supabase.removeChannel(channel);
    clearInterval(interval);
  };
}
