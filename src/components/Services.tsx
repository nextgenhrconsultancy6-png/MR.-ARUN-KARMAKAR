import React from 'react';

export const Services: React.FC = () => {
  const services = [
    {
      icon: '🚀',
      title: 'Campus readiness',
      description: 'Six-week programme that moves final-year students from syllabus to shortlist.',
    },
    {
      icon: '🎯',
      title: 'Employer briefings',
      description: 'Private webinars where hiring teams present roles, culture and assessment criteria.',
    },
    {
      icon: '⚡',
      title: 'Instant interviews',
      description: 'Admins open a live room in seconds and share a one-time room PIN with the candidate.',
    },
    {
      icon: '📊',
      title: 'Talent reviews',
      description: 'Quarterly calibration webinars with partner institutes to review placement outcomes.',
    },
  ];

  return (
    <section className="py-14 sm:py-20 scroll-mt-24" id="services">
      <div className="max-w-[1140px] mx-auto px-5">
        <div className="max-w-2xl mb-12">
          <p className="text-xs font-bold tracking-widest uppercase text-cyan-400 mb-2.5">
            Services
          </p>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
            Programmes delivered as webinars, clinics and instant rooms
          </h2>
          <p className="text-[#9aa5bb] text-base leading-relaxed">
            Webinars are one-to-many broadcasts with moderated Q&amp;A. Clinics are small interactive rooms. Sudden interviews are handled by admins in an instant room.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {services.map((service) => (
            <article
              key={service.title}
              className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/50 hover:bg-indigo-500/[0.07]"
            >
              <div className="w-11 h-11 rounded-xl grid place-items-center text-xl mb-4 bg-gradient-to-br from-indigo-500/25 to-cyan-400/20 border border-white/10">
                {service.icon}
              </div>
              <h3 className="text-base font-bold text-white mb-2">{service.title}</h3>
              <p className="text-sm text-[#9aa5bb] leading-relaxed">{service.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
