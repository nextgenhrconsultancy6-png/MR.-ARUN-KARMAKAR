import React, { useState } from 'react';
import { Plus } from 'lucide-react';

export const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: 'Are the PINs different for each category?',
      a: 'Yes. Institutes, companies and candidates each have a separate 6-digit PIN. A PIN only unlocks webinars scheduled for that category, plus any webinar marked "All partners".',
    },
    {
      q: 'How do sudden interviews work?',
      a: 'A Nextgenn HR administrator opens the Admin panel, fills in the interviewer, candidate and role, and the room goes live immediately with a one-time room PIN. The interviewer shares that PIN with the candidate, who joins via "Join with PIN".',
    },
    {
      q: 'Can I create an instant interview room myself?',
      a: 'No. Instant room creation is restricted to Nextgenn HR administrators. Candidates and companies join instant rooms only with the room PIN shared by the interviewer.',
    },
    {
      q: 'Do instant interview rooms appear in the public schedule?',
      a: 'No. Instant rooms are private and listed only in the Admin panel. Scheduled webinars and clinics appear in the public schedule for the relevant category.',
    },
    {
      q: 'Who can join a webinar?',
      a: 'Only invited members who hold the PIN for their category. We never publish PINs on the website — they are sent by your Nextgenn HR account manager or placement cell.',
    },
    {
      q: 'When does a webinar room open?',
      a: 'Scheduled webinar rooms unlock 15 minutes before the start time. Instant interview rooms are live the moment an admin creates them.',
    },
    {
      q: 'Can I speak during a webinar?',
      a: 'Webinar attendees join muted by default. Use the "Raise hand" button to request the mic, and use the Q&A panel to submit questions. Interviews and clinics are fully interactive.',
    },
    {
      q: 'Can I join from a phone?',
      a: 'Yes. All rooms work in any modern mobile or desktop browser. Camera and microphone are optional — you can watch and ask questions in chat.',
    },
    {
      q: "I'm an admin — what can I manage?",
      a: 'From the Admin panel you can regenerate category PINs, schedule webinars and clinics, open instant interview rooms, and review or delete every session with its PIN.',
    },
  ];

  return (
    <section className="py-14 sm:py-20 scroll-mt-24" id="faq">
      <div className="max-w-[760px] mx-auto px-5">
        <div className="text-center mb-10">
          <p className="text-xs font-bold tracking-widest uppercase text-cyan-400 mb-2.5">
            FAQ
          </p>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Questions, answered
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`bg-white/[0.045] border rounded-2xl transition-all duration-200 overflow-hidden ${
                  isOpen ? 'border-indigo-500/50 bg-indigo-500/[0.06]' : 'border-white/10 hover:border-white/20'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full py-4 px-5 text-left font-semibold text-sm sm:text-base text-white flex items-center justify-between gap-4 cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <Plus
                    className={`w-4 h-4 text-cyan-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-45' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4.5 text-sm text-[#9aa5bb] leading-relaxed border-t border-white/5 pt-2">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
