import { Session } from './sessionRules.ts';

export const PIN_STORAGE_KEY = 'nextgenn_catpins_v1';
export const SESSIONS_STORAGE_KEY = 'nextgenn_sessions_v1';

export function getInitialSessions(): Session[] {
  const now = Date.now();
  return [
    {
      id: 'session-campus-corp',
      title: 'Campus to Corporate — Hiring Readiness',
      type: 'webinar',
      category: 'Institutes',
      host: 'Ava Moreau',
      start: now - 12 * 60000, // started 12 mins ago (Live now!)
      durationMin: 60,
    },
    {
      id: 'session-skills-first',
      title: 'Skills-First Hiring Funnel',
      type: 'webinar',
      category: 'Companies',
      host: 'Jonas Keller',
      start: now + 2 * 86400000 + 3 * 3600000,
      durationMin: 45,
    },
    {
      id: 'session-interview-clinic',
      title: 'Interview Mastery Clinic',
      type: 'clinic',
      category: 'Candidates',
      host: 'Sana Rahman',
      start: now + 5 * 86400000 + 5 * 3600000,
      durationMin: 60,
    },
    {
      id: 'session-quarterly-review',
      title: 'Quarterly Talent Review',
      type: 'webinar',
      category: 'All partners',
      host: 'Ava Moreau',
      start: now + 9 * 86400000 + 2 * 3600000,
      durationMin: 30,
    },
    {
      id: 'session-branding-masterclass',
      title: 'Employer Branding Masterclass',
      type: 'webinar',
      category: 'Companies',
      host: 'Jonas Keller',
      start: now + 12 * 86400000 + 4 * 3600000,
      durationMin: 50,
    },
    {
      id: 'session-instant-sample',
      title: 'Instant Interview — Product Analyst',
      type: 'interview',
      instant: true,
      category: 'Interviews',
      host: 'Ava Moreau',
      candidate: 'Riya Sharma',
      role: 'Product Analyst',
      start: now - 5 * 60000,
      durationMin: 30,
      pin: '918273',
    },
  ];
}
