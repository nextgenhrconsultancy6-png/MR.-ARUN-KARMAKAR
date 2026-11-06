import React, { useState } from 'react';
import { Session, getSessionState, formatDateTime, PartnerCategory } from '../utils/sessionRules.ts';
import { Zap } from 'lucide-react';

interface WebinarScheduleProps {
  sessions: Session[];
  onOpenJoin: (sessionId?: string) => void;
  onOpenAdmin: () => void;
}

export const WebinarSchedule: React.FC<WebinarScheduleProps> = ({
  sessions,
  onOpenJoin,
  onOpenAdmin,
}) => {
  const [filter, setFilter] = useState<'all' | PartnerCategory>('all');

  const filterOptions: { label: string; value: 'all' | PartnerCategory }[] = [
    { label: 'All', value: 'all' },
    { label: 'Institutes', value: 'Institutes' },
    { label: 'Companies', value: 'Companies' },
    { label: 'Candidates', value: 'Candidates' },
    { label: 'All partners', value: 'All partners' },
  ];

  // Exclude instant rooms from public listing (they are private admin-created instant rooms)
  const publicSessions = sessions
    .filter((s) => !s.instant)
    .sort((a, b) => a.start - b.start);

  const filtered =
    filter === 'all'
      ? publicSessions
      : publicSessions.filter((s) => s.category === filter);

  return (
    <section className="py-14 sm:py-20 scroll-mt-24" id="webinars">
      <div className="max-w-[1140px] mx-auto px-5">
        <div className="max-w-2xl mb-8">
          <p className="text-xs font-bold tracking-widest uppercase text-cyan-400 mb-2.5">
            Webinars &amp; live sessions
          </p>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
            Scheduled this quarter
          </h2>
          <p className="text-[#9aa5bb] text-base leading-relaxed">
            Filter by category. Scheduled sessions use your category PIN. Instant interview rooms are created by admins and joined with a one-time room PIN — they are not listed publicly.
          </p>
        </div>

        {/* Quick callout for sudden interviews */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-amber-400/30 bg-gradient-to-r from-amber-400/10 to-indigo-500/10 mb-8">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
              Sudden interview? Admins can open a live room in seconds.
            </h3>
            <p className="text-sm text-[#9aa5bb]">
              Instant rooms are created from the Admin panel. The interviewer shares the one-time room PIN directly with the candidate.
            </p>
          </div>
          <button
            onClick={onOpenAdmin}
            className="self-start sm:self-center shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-amber-300 bg-amber-400/15 border border-amber-400/35 hover:bg-amber-400/25 transition cursor-pointer"
          >
            Admin only
          </button>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap items-center gap-2 mb-6" role="group" aria-label="Filter sessions by category">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition cursor-pointer ${
                filter === opt.value
                  ? 'bg-gradient-to-r from-indigo-500 to-cyan-400 text-slate-950 font-bold shadow-md shadow-indigo-500/20'
                  : 'bg-white/5 border border-white/10 text-[#9aa5bb] hover:text-white hover:bg-white/10'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Session cards list */}
        <div className="space-y-3" aria-live="polite">
          {filtered.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-white/10 text-[#9aa5bb] text-sm">
              No scheduled sessions for this category yet. Your account manager will publish them here.
            </div>
          ) : (
            filtered.map((session) => {
              const state = getSessionState(session);
              const isWebinar = session.type === 'webinar';

              return (
                <article
                  key={session.id}
                  className="bg-white/[0.045] border border-white/10 rounded-2xl p-5 sm:p-6 transition-all duration-200 hover:border-indigo-500/40 hover:bg-indigo-500/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* State badge */}
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                          state.key === 'live'
                            ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/15'
                            : state.key === 'upcoming'
                            ? 'text-indigo-300 border-indigo-500/40 bg-indigo-500/15'
                            : 'text-[#9aa5bb] border-white/10 bg-white/5'
                        }`}
                      >
                        {state.label}
                      </span>

                      {/* Format badge */}
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                          isWebinar
                            ? 'text-indigo-300 border-indigo-500/40 bg-indigo-500/15'
                            : 'text-cyan-300 border-cyan-400/40 bg-cyan-400/15'
                        }`}
                      >
                        {isWebinar ? 'Webinar' : 'Clinic'}
                      </span>

                      {/* Category pill */}
                      <span className="text-[11px] text-[#9aa5bb] border border-white/10 px-2.5 py-0.5 rounded-full">
                        {session.category}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      {session.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-[#9aa5bb]">
                      {formatDateTime(session.start)} · {session.durationMin} min · Host: {session.host}
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2.5 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/10">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-amber-300 border border-amber-400/35 bg-amber-400/10 px-2.5 py-0.5 rounded-full">
                      {session.category} PIN
                    </span>

                    {state.key === 'live' ? (
                      <button
                        onClick={() => onOpenJoin(session.id)}
                        className="px-4 py-1.5 rounded-full text-xs font-semibold text-slate-950 bg-gradient-to-r from-indigo-500 to-cyan-400 hover:brightness-110 active:scale-95 shadow-md shadow-indigo-500/25 transition cursor-pointer"
                      >
                        Join now
                      </button>
                    ) : state.key === 'upcoming' ? (
                      <button
                        onClick={() => onOpenJoin(session.id)}
                        className="px-4 py-1.5 rounded-full text-xs font-semibold text-white bg-white/5 border border-white/10 hover:bg-white/10 transition cursor-pointer"
                      >
                        Enter PIN
                      </button>
                    ) : (
                      <button
                        disabled
                        className="px-4 py-1.5 rounded-full text-xs font-semibold text-white/40 bg-white/5 border border-white/5 cursor-not-allowed"
                      >
                        Ended
                      </button>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};
