import React from 'react';

interface FooterProps {
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin }) => {
  return (
    <footer className="border-t border-white/10 py-10 mt-12 bg-black/30">
      <div className="max-w-[1140px] mx-auto px-5 flex flex-col md:flex-row items-center justify-between gap-6">
        <a href="#top" className="flex items-center gap-2.5 font-bold text-base text-white">
          <span className="w-8 h-8 rounded-lg grid place-items-center font-extrabold text-xs bg-gradient-to-br from-indigo-500 to-cyan-400 text-slate-950">
            NH
          </span>
          <span>Nextgenn HR</span>
        </a>

        <ul className="flex flex-wrap items-center justify-center gap-6 text-sm text-[#9aa5bb]">
          <li>
            <a href="#audiences" className="hover:text-white transition-colors">
              Who we serve
            </a>
          </li>
          <li>
            <a href="#services" className="hover:text-white transition-colors">
              Services
            </a>
          </li>
          <li>
            <a href="#webinars" className="hover:text-white transition-colors">
              Webinars
            </a>
          </li>
          <li>
            <a href="#how" className="hover:text-white transition-colors">
              How it works
            </a>
          </li>
          <li>
            <button
              type="button"
              onClick={onOpenAdmin}
              className="text-[#9aa5bb] hover:text-white transition-colors cursor-pointer"
            >
              Admin panel
            </button>
          </li>
        </ul>

        <p className="text-xs text-[#9aa5bb]">
          © {new Date().getFullYear()} Nextgenn HR Consulting. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
