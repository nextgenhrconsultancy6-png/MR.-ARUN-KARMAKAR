import React from 'react';

export const Logos: React.FC = () => {
  const partners = ['Northwind', 'Lumen', 'Vertex', 'Cobalt', 'Orbital', 'Pinecrest'];

  return (
    <div className="py-7 border-t border-white/10">
      <div className="max-w-[1140px] mx-auto px-5">
        <p className="text-center text-xs tracking-widest uppercase text-[#9aa5bb]/80 font-semibold mb-4">
          Trusted by teams at
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-14">
          {partners.map((partner) => (
            <span
              key={partner}
              className="font-extrabold text-base sm:text-lg tracking-tight text-white/40 hover:text-white/80 transition-colors select-none"
            >
              {partner}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
