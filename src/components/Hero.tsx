import React, { useState, useEffect } from 'react';
import { Session, getSessionState, formatDateTime } from '../utils/sessionRules.ts';
import { ArrowRight, Calendar, Sparkles } from 'lucide-react';

interface HeroProps {
  sessions: Session[];
  onOpenJoin: (sessionId?: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ sessions, onOpenJoin }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [featured, setFeatured] = useState<{ session: Session; isLive: boolean } | null>(null);

  // Recalculate featured session and countdown every second
  useEffect(() => {
    const updateCountdown = () => {
      const scheduled = sessions.filter((s) => !s.instant);
      const now = Date.now();

      // Find live session first
      const live = scheduled
        .filter((s) => getSessionState(s, now).key === 'live')
        .sort((a, b) => a.start - b.start)[0];

      let activeFeatured: { session: Session; isLive: boolean } | null = null;
      if (live) {
        activeFeatured = { session: live, isLive: true };
      } else {
        const upcoming = scheduled
          .filter((s) => s.start > now)
          .sort((a, b) => a.start - b.start)[0];
        if (upcoming) {
          activeFeatured = { session: upcoming, isLive: false };
        }
      }

      setFeatured(activeFeatured);

      if (activeFeatured) {
        const target = activeFeatured.isLive
          ? activeFeatured.session.start + activeFeatured.session.durationMin * 60000
          : activeFeatured.session.start;
        const diff = Math.max(0, target - now);

        setTimeLeft({
          days: Math.floor(diff / 86400000),
          hours: Math.floor((diff % 86400000) / 3600000),
          minutes: Math.floor((diff % 3600000) / 60000),
          seconds: Math.floor((diff % 60000) / 1000),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [sessions]);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <section className="pt-10 sm:pt-16 pb-12 sm:pb-20">
      <div className="max-w-[1140px] mx-auto px-5 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
        {/* Left column */}
        <div>
          <div className="inline-flex items-center gap-2 border border-white/10 bg-white/5 rounded-full px-3.5 py-1 text-xs font-semibold text-[#9aa5bb] mb-5">
            <span className="w-2 h-2 rounded-full bg-[#34d399] pulse-dot"></span>
            <span>Invite-only webinars · Admin-created interview rooms</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.15] mb-4">
            Connecting <span className="bg-gradient-to-r from-indigo-300 via-cyan-300 to-indigo-200 bg-clip-text text-transparent">institutes, companies</span> and candidates
          </h1>

          <p className="text-[#9aa5bb] text-base sm:text-lg max-w-[48ch] leading-relaxed mb-7">
            Nextgenn HR runs campus-readiness programmes, employer briefings and interview clinics. Each partner category gets its own private PIN, and administrators can open an instant interview room in seconds.
          </p>

          <div className="flex flex-wrap items-center gap-3.5 mb-8">
            <button
              onClick={() => onOpenJoin(featured?.session.id)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-slate-950 bg-gradient-to-r from-indigo-500 to-cyan-400 hover:brightness-110 shadow-lg shadow-indigo-500/25 active:scale-95 transition cursor-pointer"
            >
              <span>Join a webinar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#webinars"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-[#e8ecf5] bg-white/5 border border-white/10 hover:bg-white/10 transition cursor-pointer"
            >
              See the schedule
            </a>
          </div>

          <div className="flex items-center gap-6 sm:gap-10 border-t border-white/10 pt-6">
            <div>
              <b className="block text-2xl sm:text-3xl font-extrabold tracking-tight text-white">140+</b>
              <span className="text-xs text-[#9aa5bb]">Partner institutes</span>
            </div>
            <div>
              <b className="block text-2xl sm:text-3xl font-extrabold tracking-tight text-white">320+</b>
              <span className="text-xs text-[#9aa5bb]">Hiring companies</span>
            </div>
            <div>
              <b className="block text-2xl sm:text-3xl font-extrabold tracking-tight text-white">12k</b>
              <span className="text-xs text-[#9aa5bb]">Candidates placed</span>
            </div>
          </div>
        </div>

        {/* Right column: Next Session Card */}
        <aside
          className="relative bg-gradient-to-b from-white/[0.08] to-white/[0.03] border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl shadow-black/80 overflow-hidden"
          aria-label="Next scheduled webinar"
        >
          {/* Subtle gradient corner sheen */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs tracking-widest uppercase font-bold text-cyan-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {featured?.isLive
                ? 'Happening now'
                : featured?.session.type === 'webinar'
                ? 'Next scheduled webinar'
                : 'Next scheduled clinic'}
            </span>
            {featured?.isLive && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot"></span>
                Live
              </span>
            )}
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-white mb-1 tracking-tight">
            {featured ? featured.session.title : 'Schedule updating soon'}
          </h3>

          <p className="text-sm text-[#9aa5bb] mb-5 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400/70" />
            {featured
              ? `${formatDateTime(featured.session.start)} · ${featured.session.durationMin} min`
              : 'Check back shortly for new batches'}
          </p>

          {/* Countdown timer */}
          <div className="grid grid-cols-4 gap-2 mb-5 text-center">
            <div className="bg-black/40 border border-white/10 rounded-xl py-3 px-1">
              <b className="block text-xl sm:text-2xl font-bold font-mono tracking-tight text-white">
                {pad(timeLeft.days)}
              </b>
              <small className="text-[10px] tracking-wider uppercase text-[#9aa5bb] font-semibold">Days</small>
            </div>
            <div className="bg-black/40 border border-white/10 rounded-xl py-3 px-1">
              <b className="block text-xl sm:text-2xl font-bold font-mono tracking-tight text-white">
                {pad(timeLeft.hours)}
              </b>
              <small className="text-[10px] tracking-wider uppercase text-[#9aa5bb] font-semibold">Hours</small>
            </div>
            <div className="bg-black/40 border border-white/10 rounded-xl py-3 px-1">
              <b className="block text-xl sm:text-2xl font-bold font-mono tracking-tight text-white">
                {pad(timeLeft.minutes)}
              </b>
              <small className="text-[10px] tracking-wider uppercase text-[#9aa5bb] font-semibold">Min</small>
            </div>
            <div className="bg-black/40 border border-white/10 rounded-xl py-3 px-1">
              <b className="block text-xl sm:text-2xl font-bold font-mono tracking-tight text-white">
                {pad(timeLeft.seconds)}
              </b>
              <small className="text-[10px] tracking-wider uppercase text-[#9aa5bb] font-semibold">Sec</small>
            </div>
          </div>

          {featured && (
            <div className="mb-5">
              <span className="inline-block text-xs text-[#9aa5bb] border border-white/10 bg-white/5 px-3 py-1 rounded-full">
                {featured.session.category} · {featured.session.category} PIN required
              </span>
            </div>
          )}

          <button
            onClick={() => onOpenJoin(featured?.session.id)}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-slate-950 bg-gradient-to-r from-indigo-500 to-cyan-400 hover:brightness-110 shadow-lg shadow-indigo-500/25 active:scale-[0.99] transition cursor-pointer"
          >
            Enter PIN to join
          </button>

          <p className="text-xs text-[#9aa5bb] text-center mt-3 leading-relaxed">
            Each category has a separate PIN. The room opens 15 minutes before start.
          </p>
        </aside>
      </div>
    </section>
  );
};
