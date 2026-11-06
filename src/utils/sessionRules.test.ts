import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getSessionState,
  verifyJoinPin,
  generateUniquePin,
  DEFAULT_CAT_PINS,
  JOIN_WINDOW_MS,
  Session,
} from './sessionRules.ts';

test('getSessionState correctly identifies live, upcoming, and ended sessions', () => {
  const now = 1700000000000;
  
  // 1. Live session
  const liveSession: Session = {
    id: 's-live',
    title: 'Live Workshop',
    type: 'webinar',
    category: 'Institutes',
    host: 'Dr. Smith',
    start: now - 10 * 60000,
    durationMin: 60,
  };
  const liveState = getSessionState(liveSession, now);
  assert.equal(liveState.key, 'live');
  assert.equal(liveState.joinable, true);

  // 2. Upcoming session beyond 15-min open window
  const upcomingSession: Session = {
    id: 's-upcoming',
    title: 'Future Workshop',
    type: 'clinic',
    category: 'Companies',
    host: 'Jane Doe',
    start: now + 60 * 60000, // 1 hour away
    durationMin: 45,
  };
  const upState = getSessionState(upcomingSession, now);
  assert.equal(upState.key, 'upcoming');
  assert.equal(upState.joinable, false);

  // 3. Upcoming session within 15-min open window (should be joinable / live)
  const openingSoonSession: Session = {
    id: 's-soon',
    title: 'Opening Soon',
    type: 'webinar',
    category: 'Candidates',
    host: 'Alice',
    start: now + 5 * 60000, // 5 min away
    durationMin: 60,
  };
  const soonState = getSessionState(openingSoonSession, now);
  assert.equal(soonState.key, 'live');
  assert.equal(soonState.joinable, true);

  // 4. Ended session
  const endedSession: Session = {
    id: 's-ended',
    title: 'Past Workshop',
    type: 'webinar',
    category: 'All partners',
    host: 'Bob',
    start: now - 120 * 60000,
    durationMin: 60,
  };
  const endedState = getSessionState(endedSession, now);
  assert.equal(endedState.key, 'ended');
  assert.equal(endedState.joinable, false);
});

test('verifyJoinPin validates category PIN against active session', () => {
  const now = 1700000000000;
  const sessions: Session[] = [
    {
      id: 'inst-1',
      title: 'Institute Prep',
      type: 'webinar',
      category: 'Institutes',
      host: 'Ava',
      start: now - 5 * 60000,
      durationMin: 60,
    },
  ];

  // Correct PIN
  const valid = verifyJoinPin({
    pin: '482913',
    category: 'Institutes',
    pendingSessionId: 'inst-1',
    sessions,
    categoryPins: DEFAULT_CAT_PINS,
    now,
  });
  assert.equal(valid.ok, true);
  assert.equal(valid.session?.id, 'inst-1');

  // Wrong PIN (using Companies PIN for Institutes)
  const wrong = verifyJoinPin({
    pin: '715204',
    category: 'Institutes',
    pendingSessionId: 'inst-1',
    sessions,
    categoryPins: DEFAULT_CAT_PINS,
    now,
  });
  assert.equal(wrong.ok, false);
  assert.match(wrong.msg || '', /That is the Companies PIN/);
});

test('verifyJoinPin works with instant interview room pins', () => {
  const now = 1700000000000;
  const instantRoom: Session = {
    id: 'instant-1',
    title: 'Instant Interview — Product Analyst',
    type: 'interview',
    instant: true,
    category: 'Interviews',
    host: 'Interviewer',
    candidate: 'Riya',
    start: now - 2 * 60000,
    durationMin: 30,
    pin: '998877',
  };

  const res = verifyJoinPin({
    pin: '998877',
    category: 'Instant interview',
    sessions: [instantRoom],
    categoryPins: DEFAULT_CAT_PINS,
    now,
  });
  assert.equal(res.ok, true);
  assert.equal(res.session?.id, 'instant-1');
});

test('generateUniquePin produces valid 6-digit pin not in existing set', () => {
  const existing = ['111111', '222222', '333333'];
  const newPin = generateUniquePin(existing);
  assert.equal(newPin.length, 6);
  assert.equal(/^\d{6}$/.test(newPin), true);
  assert.equal(existing.includes(newPin), false);
});
