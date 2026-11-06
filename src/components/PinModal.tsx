import React, { useState, useEffect } from 'react';
import { Session, CategoryPins, verifyJoinPin, formatDateTime } from '../utils/sessionRules.ts';
import { X, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: Session[];
  categoryPins: CategoryPins;
  pendingSessionId?: string | null;
  onSuccessJoin: (session: Session, userName: string, viewerCategory: string) => void;
  initialPin?: string;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  onClose,
  sessions,
  categoryPins,
  pendingSessionId,
  onSuccessJoin,
  initialPin = '',
}) => {
  const [category, setCategory] = useState<string>('Instant interview');
  const [pin, setPin] = useState<string>(initialPin);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const targetSession = pendingSessionId
    ? sessions.find((s) => s.id === pendingSessionId)
    : null;

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setSuccessMsg('');
      if (initialPin) {
        setPin(initialPin);
      }
      if (targetSession) {
        setCategory(targetSession.instant ? 'Instant interview' : targetSession.category);
      } else if (!initialPin) {
        setCategory('Instant interview');
        setPin('');
      }
    }
  }, [isOpen, pendingSessionId, initialPin, targetSession]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanPin = pin.trim();
    if (cleanPin.length !== 6) {
      setErrorMsg('Enter the 6-digit PIN.');
      return;
    }
    if (name.trim().length < 2) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setErrorMsg('Please enter a valid work email address.');
      return;
    }

    const verification = verifyJoinPin({
      pin: cleanPin,
      category,
      pendingSessionId,
      sessions,
      categoryPins,
    });

    if (!verification.ok) {
      setErrorMsg(verification.msg || 'Invalid PIN or session inaccessible.');
      return;
    }

    setSuccessMsg('Verified — opening the room…');
    const matchedSession = verification.session!;
    const assignedCategory = matchedSession.instant ? 'Interviews' : category;

    setTimeout(() => {
      onSuccessJoin(matchedSession, name.trim(), assignedCategory);
      onClose();
    }, 450);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pinModalTitle"
    >
      <div className="bg-[#0c1220] border border-white/10 rounded-3xl w-full max-w-[500px] max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl shadow-black relative">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h3 id="pinModalTitle" className="text-xl font-bold text-white tracking-tight mb-1">
              {targetSession ? targetSession.title : 'Join a webinar or interview'}
            </h3>
            <p className="text-xs text-[#9aa5bb]">
              {targetSession
                ? targetSession.instant
                  ? `Instant interview · Host: ${targetSession.host}`
                  : `${targetSession.category} · ${formatDateTime(targetSession.start)} · Host: ${targetSession.host}`
                : 'Enter your category PIN, or the one-time room PIN for an instant interview.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white grid place-items-center transition-colors cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Helpful info badge */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl border border-amber-400/25 bg-amber-400/10 text-amber-300 text-xs mb-5">
          <Lock className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
          <p className="leading-relaxed">
            Each category has its own PIN. Room PINs for instant interviews are one-time and work only for that room.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#9aa5bb] tracking-wide mb-1.5" htmlFor="pinCat">
              Category
            </label>
            <select
              id="pinCat"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="Instant interview" className="bg-[#0c1220]">Instant interview (room PIN)</option>
              <option value="Institutes" className="bg-[#0c1220]">Institutes</option>
              <option value="Companies" className="bg-[#0c1220]">Companies</option>
              <option value="Candidates" className="bg-[#0c1220]">Candidates</option>
              <option value="All partners" className="bg-[#0c1220]">All partners</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#9aa5bb] tracking-wide mb-1.5" htmlFor="pinInput">
              6-Digit PIN
            </label>
            <input
              id="pinInput"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="••••••"
              className="w-full bg-black/45 border border-white/10 rounded-xl px-4 py-3 text-2xl font-bold font-mono tracking-[0.4em] text-center text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#9aa5bb] tracking-wide mb-1.5" htmlFor="nameInput">
              Full name
            </label>
            <input
              id="nameInput"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ada Lovelace"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#9aa5bb] tracking-wide mb-1.5" htmlFor="emailInput">
              Work email
            </label>
            <input
              id="emailInput"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ada@company.com"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-slate-950 bg-gradient-to-r from-indigo-500 to-cyan-400 hover:brightness-110 active:scale-[0.99] shadow-lg shadow-indigo-500/25 transition cursor-pointer"
          >
            Verify &amp; join
          </button>
        </form>

        <p className="mt-5 text-[11px] text-[#9aa5bb] bg-white/[0.03] border border-white/5 rounded-xl p-3 leading-relaxed">
          <strong className="text-white">Prototype note:</strong> PINs are checked in this browser against the values set in the Admin panel. In production, verification happens server-side.
        </p>
      </div>
    </div>
  );
};
