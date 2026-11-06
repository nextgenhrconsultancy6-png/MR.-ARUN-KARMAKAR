import React, { useState } from 'react';
import { Menu, X, Shield, KeyRound } from 'lucide-react';

interface NavbarProps {
  onOpenAdmin: () => void;
  onOpenJoin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAdmin, onOpenJoin }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Who we serve', href: '#audiences' },
    { label: 'Services', href: '#services' },
    { label: 'Webinars', href: '#webinars' },
    { label: 'How it works', href: '#how' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#080b12]/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-[1140px] mx-auto px-5 py-3.5 flex items-center justify-between gap-4">
        {/* Brand */}
        <a href="#top" className="flex items-center gap-2.5 font-bold text-base tracking-tight text-white group">
          <span className="w-8 h-8 rounded-lg grid place-items-center font-extrabold text-xs bg-gradient-to-br from-indigo-500 to-cyan-400 text-slate-950 shadow-md group-hover:scale-105 transition-transform">
            NH
          </span>
          <span className="text-lg">Nextgenn HR</span>
        </a>

        {/* Desktop Links */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[#9aa5bb] hover:text-white transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenAdmin}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#e8ecf5] bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Open Admin Panel"
          >
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            Admin
          </button>
          
          <button
            onClick={onOpenJoin}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold text-slate-950 bg-gradient-to-r from-indigo-500 to-cyan-400 hover:brightness-110 shadow-lg shadow-indigo-500/20 active:scale-95 transition cursor-pointer"
            aria-label="Join with PIN"
          >
            <KeyRound className="w-3.5 h-3.5 text-slate-950" />
            Join with PIN
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-9 h-9 rounded-lg border border-white/10 grid place-items-center text-white/80 hover:text-white hover:bg-white/5 cursor-pointer"
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/10 bg-[#080b12]/95 px-5 py-4 space-y-3">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-sm font-medium text-[#9aa5bb] hover:text-white"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAdmin();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-white/5 border border-white/10 w-full justify-center"
            >
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              Open Admin Panel
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
