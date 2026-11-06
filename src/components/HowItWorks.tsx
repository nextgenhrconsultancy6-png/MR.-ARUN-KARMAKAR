import React from 'react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      num: 1,
      title: 'Admin prepares the room',
      description: 'Admins schedule webinars by category, or open an instant interview room on the spot.',
    },
    {
      num: 2,
      title: 'You receive a PIN',
      description: 'Category PINs arrive from your account manager. Room PINs are shared directly by the interviewer.',
    },
    {
      num: 3,
      title: 'Enter the room',
      description: 'Test your camera and microphone in the lobby, then join. Webinars start muted; interviews are fully interactive.',
    },
  ];

  return (
    <section className="py-14 sm:py-20 scroll-mt-24" id="how">
      <div className="max-w-[1140px] mx-auto px-5">
        <div className="max-w-2xl mb-12">
          <p className="text-xs font-bold tracking-widest uppercase text-cyan-400 mb-2.5">
            Access
          </p>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
            How joining works
          </h2>
          <p className="text-[#9aa5bb] text-base leading-relaxed">
            Scheduled webinars use one PIN per category. Sudden interviews get a one-time room PIN created by an admin.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {steps.map((step) => (
            <div
              key={step.num}
              className="bg-white/[0.045] border border-white/10 rounded-2xl p-6 relative overflow-hidden"
            >
              <div className="w-8 h-8 rounded-lg grid place-items-center font-extrabold text-xs mb-4 bg-gradient-to-br from-indigo-500 to-cyan-400 text-slate-950 shadow-md">
                {step.num}
              </div>
              <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
              <p className="text-sm text-[#9aa5bb] leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
