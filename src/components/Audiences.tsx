import React from 'react';
import { CategoryPins } from '../utils/sessionRules.ts';
import { Copy, Check } from 'lucide-react';

interface AudiencesProps {
  categoryPins: CategoryPins;
  onCopyPin: (pin: string, category: string) => void;
  copiedCategory?: string | null;
}

export const Audiences: React.FC<AudiencesProps> = ({ categoryPins, onCopyPin, copiedCategory }) => {
  return (
    <section className="py-14 sm:py-20 scroll-mt-24" id="audiences">
      <div className="max-w-[1140px] mx-auto px-5">
        <div className="max-w-2xl mb-12">
          <p className="text-xs font-bold tracking-widest uppercase text-cyan-400 mb-2.5">
            Who we serve
          </p>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
            One consultancy, three sides of the hiring equation
          </h2>
          <p className="text-[#9aa5bb] text-base leading-relaxed">
            We sit between education and employment — translating what institutes teach, what companies need, and what candidates can prove. Each side gets its own private PIN for live webinars.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Institutes Card */}
          <article className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/50 hover:bg-indigo-500/[0.07] flex flex-col justify-between">
            <div>
              <span className="inline-block text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border border-indigo-500/40 bg-indigo-500/15 text-indigo-300 mb-3.5">
                Institutes
              </span>
              <div className="w-11 h-11 rounded-xl grid place-items-center text-xl mb-4 bg-gradient-to-br from-indigo-500/25 to-cyan-400/20 border border-white/10">
                🎓
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Campus &amp; placement teams</h3>
              <p className="text-sm text-[#9aa5bb] leading-relaxed mb-4">
                Make your graduates hire-ready with structured programmes and live employer briefings.
              </p>
              <ul className="space-y-1.5 text-sm text-[#9aa5bb] mb-6 list-disc list-inside">
                <li>Campus-to-corporate readiness clinics</li>
                <li>Placement cell dashboards</li>
                <li>Employer connect webinars</li>
              </ul>
            </div>

            <div className="pt-4 border-t border-dashed border-white/10 flex items-center justify-between">
              <span className="text-xs text-[#9aa5bb]">
                Institute webinar PIN: <b className="text-amber-400 font-mono tracking-wider ml-1">{categoryPins['Institutes']}</b>
              </span>
              <button
                onClick={() => onCopyPin(categoryPins['Institutes'], 'Institutes')}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                title="Copy Institute PIN"
                aria-label="Copy Institute PIN"
              >
                {copiedCategory === 'Institutes' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </article>

          {/* Companies Card */}
          <article className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/50 hover:bg-cyan-500/[0.07] flex flex-col justify-between">
            <div>
              <span className="inline-block text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border border-cyan-400/40 bg-cyan-400/15 text-cyan-300 mb-3.5">
                Companies
              </span>
              <div className="w-11 h-11 rounded-xl grid place-items-center text-xl mb-4 bg-gradient-to-br from-indigo-500/25 to-cyan-400/20 border border-white/10">
                🏢
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Talent acquisition leaders</h3>
              <p className="text-sm text-[#9aa5bb] leading-relaxed mb-4">
                Build a skills-first funnel with vetted campus pipelines and structured interview panels.
              </p>
              <ul className="space-y-1.5 text-sm text-[#9aa5bb] mb-6 list-disc list-inside">
                <li>Employer branding briefings</li>
                <li>Campus hiring drives</li>
                <li>Interview panel calibration</li>
              </ul>
            </div>

            <div className="pt-4 border-t border-dashed border-white/10 flex items-center justify-between">
              <span className="text-xs text-[#9aa5bb]">
                Company webinar PIN: <b className="text-amber-400 font-mono tracking-wider ml-1">{categoryPins['Companies']}</b>
              </span>
              <button
                onClick={() => onCopyPin(categoryPins['Companies'], 'Companies')}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                title="Copy Company PIN"
                aria-label="Copy Company PIN"
              >
                {copiedCategory === 'Companies' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </article>

          {/* Candidates Card */}
          <article className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/50 hover:bg-amber-400/[0.07] flex flex-col justify-between">
            <div>
              <span className="inline-block text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border border-amber-400/40 bg-amber-400/15 text-amber-300 mb-3.5">
                Candidates
              </span>
              <div className="w-11 h-11 rounded-xl grid place-items-center text-xl mb-4 bg-gradient-to-br from-indigo-500/25 to-cyan-400/20 border border-white/10">
                🧑‍💼
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Students &amp; job seekers</h3>
              <p className="text-sm text-[#9aa5bb] leading-relaxed mb-4">
                Get interview-ready with live clinics, mock rounds and direct access to hiring managers.
              </p>
              <ul className="space-y-1.5 text-sm text-[#9aa5bb] mb-6 list-disc list-inside">
                <li>Interview mastery clinics</li>
                <li>Resume &amp; profile reviews</li>
                <li>Live Q&amp;A with recruiters</li>
              </ul>
            </div>

            <div className="pt-4 border-t border-dashed border-white/10 flex items-center justify-between">
              <span className="text-xs text-[#9aa5bb]">
                Candidate webinar PIN: <b className="text-amber-400 font-mono tracking-wider ml-1">{categoryPins['Candidates']}</b>
              </span>
              <button
                onClick={() => onCopyPin(categoryPins['Candidates'], 'Candidates')}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                title="Copy Candidate PIN"
                aria-label="Copy Candidate PIN"
              >
                {copiedCategory === 'Candidates' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
};
