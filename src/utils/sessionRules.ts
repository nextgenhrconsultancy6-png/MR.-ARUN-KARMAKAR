export type PartnerCategory = 'Institutes' | 'Companies' | 'Candidates' | 'All partners';

export interface Session {
  id: string;
  title: string;
  type: 'webinar' | 'clinic' | 'interview';
  category: PartnerCategory | 'Interviews';
  host: string;
  start: number; // timestamp in ms
  durationMin: number;
  instant?: boolean;
  pin?: string; // used for instant interview rooms
  candidate?: string;
  role?: string;
}

export type CategoryPins = Record<PartnerCategory, string>;

export const DEFAULT_CAT_PINS: CategoryPins = {
  'Institutes': '482913',
  'Companies': '715204',
  'Candidates': '390817',
  'All partners': '204815',
};

export const ADMIN_PASS = 'admin1234';
export const JOIN_WINDOW_MS = 15 * 60 * 1000; // 15 mins

export interface SessionStatusResult {
  key: 'upcoming' | 'live' | 'ended';
  label: string;
  joinable: boolean;
  opens?: number;
}

export function getSessionState(session: Session, now: number = Date.now()): SessionStatusResult {
  const start = session.start;
  const end = start + session.durationMin * 60000;
  const opens = start - JOIN_WINDOW_MS;

  if (now < opens) {
    return { key: 'upcoming', label: 'Upcoming', joinable: false, opens };
  }
  if (now <= end) {
    return { key: 'live', label: 'Live now', joinable: true };
  }
  return { key: 'ended', label: 'Ended', joinable: false };
}

export function generatePin(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function generateUniquePin(existingPins: string[]): string {
  let pin = generatePin();
  let tries = 0;
  while (existingPins.includes(pin) && tries < 100) {
    pin = generatePin();
    tries++;
  }
  return pin;
}

export interface VerifyJoinResult {
  ok: boolean;
  msg?: string;
  session?: Session;
}

export function verifyJoinPin({
  pin,
  category,
  pendingSessionId,
  sessions,
  categoryPins,
  now = Date.now(),
}: {
  pin: string;
  category: string;
  pendingSessionId?: string | null;
  sessions: Session[];
  categoryPins: CategoryPins;
  now?: number;
}): VerifyJoinResult {
  const cleanPin = pin.trim();

  // 1. If a specific session was clicked
  if (pendingSessionId) {
    const s = sessions.find((x) => x.id === pendingSessionId);
    if (!s) {
      return { ok: false, msg: 'That session is no longer available.' };
    }

    if (s.instant) {
      if (s.pin !== cleanPin) {
        return { ok: false, msg: 'That PIN does not match this interview room.' };
      }
      const st = getSessionState(s, now);
      if (st.key === 'ended') {
        return { ok: false, msg: 'This interview room has already ended.' };
      }
      return { ok: true, session: s };
    }

    // Scheduled session: check category PIN
    const cat = s.category as PartnerCategory;
    if (categoryPins[cat] !== cleanPin) {
      const matchOwner = (Object.keys(categoryPins) as PartnerCategory[]).find(
        (c) => categoryPins[c] === cleanPin
      );
      if (matchOwner) {
        return {
          ok: false,
          msg: `That is the ${matchOwner} PIN. This session is for ${s.category} only.`,
        };
      }
      return { ok: false, msg: 'That PIN does not unlock this session.' };
    }

    const st = getSessionState(s, now);
    if (st.key === 'upcoming') {
      const openTime = new Date(st.opens || s.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      return {
        ok: false,
        msg: `This session opens 15 minutes before start at ${openTime}.`,
      };
    }
    if (st.key === 'ended') {
      return { ok: false, msg: 'This session has already ended. Ask your account manager for the replay.' };
    }
    return { ok: true, session: s };
  }

  // 2. Generic join by PIN or Instant Interview Room PIN
  const instantRoom = sessions.find(
    (s) => s.type === 'interview' && s.instant && s.pin === cleanPin
  );
  if (instantRoom) {
    const st = getSessionState(instantRoom, now);
    if (st.key === 'ended') {
      return { ok: false, msg: 'That instant room has ended. Ask the interviewer to open a new one.' };
    }
    return { ok: true, session: instantRoom };
  }

  if (category === 'Instant interview') {
    return {
      ok: false,
      msg: 'No live instant interview room uses that PIN. Ask the interviewer to share it again.',
    };
  }

  const selectedCategory = category as PartnerCategory;
  if (categoryPins[selectedCategory] !== cleanPin) {
    const owner = (Object.keys(categoryPins) as PartnerCategory[]).find(
      (c) => categoryPins[c] === cleanPin
    );
    if (owner) {
      return {
        ok: false,
        msg: `That is the ${owner} PIN. Switch your category to ${owner} and try again.`,
      };
    }
    return { ok: false, msg: 'That PIN is not recognised. Check with your account manager.' };
  }

  // Find live session for that category
  const pool = sessions
    .filter(
      (s) => !s.instant && (s.category === selectedCategory || s.category === 'All partners')
    )
    .sort((a, b) => a.start - b.start);

  const live = pool.find((s) => getSessionState(s, now).key === 'live');
  if (live) {
    return { ok: true, session: live };
  }

  const upcoming = pool.find((s) => s.start > now);
  if (upcoming) {
    const startStr = new Date(upcoming.start).toLocaleString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
    return {
      ok: false,
      msg: `PIN verified, but no ${category} session is live right now. Next one opens on ${startStr}.`,
    };
  }

  return {
    ok: false,
    msg: `PIN verified, but there are no ${category} sessions scheduled yet.`,
  };
}

export function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function getInitials(name: string): string {
  return (name || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}
