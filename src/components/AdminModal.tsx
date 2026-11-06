import React, { useState, useEffect } from 'react';
import {
  Session,
  CategoryPins,
  PartnerCategory,
  ADMIN_PASS,
  generateUniquePin,
  formatDateTime,
  getSessionState,
} from '../utils/sessionRules.ts';
import {
  ParticipantRecord,
  checkSupabaseHealth,
  SupabaseHealth,
  subscribeToLiveParticipants,
  removeLiveParticipant,
} from '../services/supabaseService.ts';
import {
  SUPABASE_PROJECT_ID,
  SUPABASE_SQL_SCHEMA,
} from '../lib/supabase.ts';
import {
  X,
  Lock,
  Copy,
  RefreshCw,
  Trash2,
  ExternalLink,
  RotateCcw,
  Users,
  Database,
  Calendar,
  Key,
  ShieldCheck,
  AlertTriangle,
  MonitorUp,
  Hand,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: Session[];
  categoryPins: CategoryPins;
  onUpdateCategoryPins: (pins: CategoryPins) => void;
  onAddSession: (session: Session) => void;
  onDeleteSession: (sessionId: string) => void;
  onResetDemoData: () => void;
  onLaunchLiveRoomAsHost: (session: Session, interviewerName: string) => void;
  onShowToast: (msg: string) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  sessions,
  categoryPins,
  onUpdateCategoryPins,
  onAddSession,
  onDeleteSession,
  onResetDemoData,
  onLaunchLiveRoomAsHost,
  onShowToast,
}) => {
  const [unlocked, setUnlocked] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');

  // Active admin tab
  const [activeTab, setActiveTab] = useState<'participants' | 'sessions' | 'pins' | 'database'>('participants');

  // Live participants
  const [liveParticipants, setLiveParticipants] = useState<ParticipantRecord[]>([]);

  // Supabase health
  const [dbHealth, setDbHealth] = useState<SupabaseHealth | null>(null);
  const [checkingDb, setCheckingDb] = useState(false);

  // Instant room form
  const [iInterviewer, setIInterviewer] = useState('Ava Moreau');
  const [iCandidate, setICandidate] = useState('');
  const [iRole, setIRole] = useState('');
  const [iDuration, setIDuration] = useState('30');
  const [iError, setIError] = useState('');

  // Schedule session form
  const [cTitle, setCTitle] = useState('');
  const [cType, setCType] = useState<'webinar' | 'clinic'>('webinar');
  const [cCategory, setCCategory] = useState<PartnerCategory>('Institutes');
  const [cHost, setCHost] = useState('Ava Moreau');
  const [cStart, setCStart] = useState(() => {
    const d = new Date(Date.now() + 86400000);
    d.setMinutes(0, 0, 0);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });
  const [cDuration, setCDuration] = useState(60);
  const [cError, setCError] = useState('');
  const [cSuccess, setCSuccess] = useState('');

  // Check Supabase health on open
  const runHealthCheck = async () => {
    setCheckingDb(true);
    const health = await checkSupabaseHealth();
    setDbHealth(health);
    setCheckingDb(false);
  };

  useEffect(() => {
    if (isOpen && unlocked) {
      runHealthCheck();
      const unsubscribe = subscribeToLiveParticipants((list) => {
        setLiveParticipants(list);
      });
      return () => unsubscribe();
    }
  }, [isOpen, unlocked]);

  if (!isOpen) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === ADMIN_PASS) {
      setUnlocked(true);
      setPasscodeError('');
    } else {
      setPasscodeError('Incorrect passcode. Try admin1234 for the demo.');
    }
  };

  const handleCopy = (text: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    onShowToast(`${label} copied: ${text}`);
  };

  const handleCopySchema = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    }
    onShowToast('Supabase SQL Schema copied! Paste it in the Supabase SQL Editor.');
  };

  const handleRegenPin = (cat: PartnerCategory) => {
    const allPins = [
      ...Object.values(categoryPins),
      ...sessions.map((s) => s.pin).filter(Boolean),
    ] as string[];
    const newPin = generateUniquePin(allPins);
    const updated = { ...categoryPins, [cat]: newPin };
    onUpdateCategoryPins(updated);
    onShowToast(`${cat} PIN regenerated: ${newPin}`);
  };

  const handleCreateInstant = (e: React.FormEvent) => {
    e.preventDefault();
    setIError('');

    if (!iInterviewer.trim()) {
      setIError('Please enter the interviewer name.');
      return;
    }

    const allPins = [
      ...Object.values(categoryPins),
      ...sessions.map((s) => s.pin).filter(Boolean),
    ] as string[];
    const roomPin = generateUniquePin(allPins);

    let title = 'Instant Interview';
    if (iRole.trim()) title += ` — ${iRole.trim()}`;
    else if (iCandidate.trim()) title += ` — ${iCandidate.trim()}`;

    const newRoom: Session = {
      id: `instant-${Date.now()}`,
      title,
      type: 'interview',
      instant: true,
      category: 'Interviews',
      host: iInterviewer.trim(),
      candidate: iCandidate.trim() || undefined,
      role: iRole.trim() || undefined,
      start: Date.now(),
      durationMin: parseInt(iDuration, 10) || 30,
      pin: roomPin,
    };

    onAddSession(newRoom);
    onShowToast(`Instant room opened! Room PIN: ${roomPin}`);
    onClose();
    onLaunchLiveRoomAsHost(newRoom, iInterviewer.trim());
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCError('');
    setCSuccess('');

    if (cTitle.trim().length < 3) {
      setCError('Give the session a clear title.');
      return;
    }

    const startMs = new Date(cStart).getTime();
    if (isNaN(startMs)) {
      setCError('Please choose a valid start date and time.');
      return;
    }

    const newSession: Session = {
      id: `session-${Date.now()}`,
      title: cTitle.trim(),
      type: cType,
      category: cCategory,
      host: cHost.trim() || 'Ava Moreau',
      start: startMs,
      durationMin: cDuration,
    };

    onAddSession(newSession);
    setCSuccess(`Published to schedule! Attendees join with the ${cCategory} PIN (${categoryPins[cCategory]}).`);
    setCTitle('');
    onShowToast(`Session scheduled for ${cCategory}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="adminModalTitle"
    >
      <div className="bg-[#0c1220] border border-white/10 rounded-3xl w-full max-w-[880px] max-h-[92vh] overflow-y-auto p-5 sm:p-7 shadow-2xl shadow-black relative flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-white/10 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 id="adminModalTitle" className="text-xl font-bold text-white tracking-tight">
                Nextgenn HR Admin
              </h3>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold text-cyan-300 bg-cyan-400/10 border border-cyan-400/25">
                <Database className="w-3 h-3 text-cyan-400" />
                Supabase: {SUPABASE_PROJECT_ID}
              </span>
            </div>
            <p className="text-xs text-[#9aa5bb]">
              Live participant monitoring, category PINs, scheduled webinars, and instant interview rooms.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white grid place-items-center transition-colors cursor-pointer shrink-0"
            aria-label="Close admin modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Passcode Gate */}
        {!unlocked ? (
          <div className="max-w-md mx-auto py-8">
            <div className="flex items-start gap-3 p-3.5 rounded-xl border border-amber-400/25 bg-amber-400/10 text-amber-300 text-xs mb-6">
              <Lock className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <p className="leading-relaxed">
                Admin area. Enter your passcode to manage PINs, sessions and view live participants. Demo passcode:{' '}
                <strong className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">admin1234</strong>
              </p>
            </div>

            <form onSubmit={handleUnlock} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#9aa5bb] mb-1.5" htmlFor="adminPass">
                  Admin Passcode
                </label>
                <input
                  id="adminPass"
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="••••••••"
                  autoFocus
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {passcodeError && (
                <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">
                  {passcodeError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-slate-950 bg-gradient-to-r from-indigo-500 to-cyan-400 hover:brightness-110 active:scale-[0.99] shadow-lg shadow-indigo-500/25 transition cursor-pointer"
              >
                Unlock admin panel
              </button>
            </form>
          </div>
        ) : (
          /* Unlocked Admin Content with Navigation Tabs */
          <div className="space-y-6 flex-1">
            {/* Tab Navigation */}
            <div className="flex items-center gap-1.5 border-b border-white/10 pb-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('participants')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'participants'
                    ? 'bg-gradient-to-r from-indigo-500 to-cyan-400 text-slate-950 font-bold shadow-md shadow-indigo-500/20'
                    : 'text-[#9aa5bb] hover:text-white hover:bg-white/5'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Live Participants</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    activeTab === 'participants'
                      ? 'bg-black/30 text-slate-950'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {liveParticipants.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('sessions')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'sessions'
                    ? 'bg-gradient-to-r from-indigo-500 to-cyan-400 text-slate-950 font-bold shadow-md shadow-indigo-500/20'
                    : 'text-[#9aa5bb] hover:text-white hover:bg-white/5'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Sessions &amp; Instant Rooms</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('pins')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'pins'
                    ? 'bg-gradient-to-r from-indigo-500 to-cyan-400 text-slate-950 font-bold shadow-md shadow-indigo-500/20'
                    : 'text-[#9aa5bb] hover:text-white hover:bg-white/5'
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                <span>Category PINs</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('database')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'database'
                    ? 'bg-gradient-to-r from-indigo-500 to-cyan-400 text-slate-950 font-bold shadow-md shadow-indigo-500/20'
                    : 'text-[#9aa5bb] hover:text-white hover:bg-white/5'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>Supabase Setup</span>
                {dbHealth && !dbHealth.sessionsTableReady && (
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                )}
              </button>
            </div>

            {/* TAB 1: LIVE PARTICIPANTS */}
            {activeTab === 'participants' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 pulse-dot"></span>
                    <h4 className="text-sm font-bold text-white">
                      Active Live Room Participants ({liveParticipants.length})
                    </h4>
                  </div>
                  <span className="text-xs text-[#9aa5bb]">
                    Live real-time participant monitor across all webinars and instant rooms
                  </span>
                </div>

                {liveParticipants.length === 0 ? (
                  <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
                    <Users className="w-8 h-8 text-[#9aa5bb]/40 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-white">No active participants in live rooms right now</p>
                    <p className="text-xs text-[#9aa5bb] mt-1 max-w-md mx-auto">
                      When candidates, institutes or companies verify their PIN and enter a live room, they will appear here in real time with their room and status.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {liveParticipants.map((p) => {
                      const minsInCall = Math.max(1, Math.round((Date.now() - p.joinedAt) / 60000));
                      return (
                        <div
                          key={p.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white/[0.035] border border-white/10 transition hover:border-indigo-500/30"
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <strong className="text-sm font-bold text-white">{p.name}</strong>
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                  p.role === 'Host'
                                    ? 'text-indigo-300 border-indigo-500/40 bg-indigo-500/20'
                                    : p.role === 'Candidate'
                                    ? 'text-amber-300 border-amber-400/40 bg-amber-400/15'
                                    : 'text-cyan-300 border-cyan-400/40 bg-cyan-400/15'
                                }`}
                              >
                                {p.role}
                              </span>

                              {/* Status badge */}
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full border ${
                                  p.status === 'in_call'
                                    ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/15'
                                    : p.status === 'lobby'
                                    ? 'text-indigo-300 border-indigo-500/40 bg-indigo-500/15'
                                    : p.status === 'sharing'
                                    ? 'text-cyan-300 border-cyan-400/40 bg-cyan-400/15'
                                    : 'text-amber-300 border-amber-400/40 bg-amber-400/15'
                                }`}
                              >
                                {p.status === 'sharing' && <MonitorUp className="w-3 h-3" />}
                                {p.status === 'hand_raised' && <Hand className="w-3 h-3 text-amber-400" />}
                                {p.status === 'in_call' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
                                {p.status === 'in_call'
                                  ? 'In Call'
                                  : p.status === 'lobby'
                                  ? 'In Lobby'
                                  : p.status === 'sharing'
                                  ? 'Sharing Screen'
                                  : 'Hand Raised'}
                              </span>

                              {p.category && (
                                <span className="text-[10px] text-[#9aa5bb] border border-white/10 px-2 py-0.5 rounded-full">
                                  {p.category}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-[#9aa5bb]">
                              Room: <strong className="text-white/80">{p.sessionTitle}</strong>
                              {p.email && <span> · Email: {p.email}</span>}
                              <span> · Active for {minsInCall} min</span>
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={async () => {
                              await removeLiveParticipant(p.id);
                              setLiveParticipants((prev) => prev.filter((x) => x.id !== p.id));
                              onShowToast(`Removed ${p.name} from room participant list`);
                            }}
                            className="self-end sm:self-center px-2.5 py-1 text-[11px] font-medium text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 rounded-lg transition cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: SESSIONS & INSTANT ROOMS */}
            {activeTab === 'sessions' && (
              <div className="space-y-6">
                {/* Instant room generator */}
                <div className="p-5 rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-400/[0.08] to-indigo-500/[0.05]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold tracking-widest uppercase text-amber-400">
                      Start an Instant Interview Room
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/35">
                      Admin Only
                    </span>
                  </div>
                  <p className="text-xs text-[#9aa5bb] mb-4">
                    Sudden interview — open a live room now and store it in Supabase. The candidate joins using the one-time room PIN.
                  </p>

                  <form onSubmit={handleCreateInstant} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-medium text-[#9aa5bb] mb-1">
                        Interviewer name <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={iInterviewer}
                        onChange={(e) => setIInterviewer(e.target.value)}
                        placeholder="Ava Moreau"
                        required
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#9aa5bb] mb-1">
                        Candidate name <span className="text-white/40">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={iCandidate}
                        onChange={(e) => setICandidate(e.target.value)}
                        placeholder="Riya Sharma"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#9aa5bb] mb-1">
                        Role / position <span className="text-white/40">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={iRole}
                        onChange={(e) => setIRole(e.target.value)}
                        placeholder="Product Analyst"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#9aa5bb] mb-1">Room duration</label>
                      <select
                        value={iDuration}
                        onChange={(e) => setIDuration(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                      >
                        <option value="15" className="bg-[#0c1220]">15 minutes</option>
                        <option value="30" className="bg-[#0c1220]">30 minutes</option>
                        <option value="45" className="bg-[#0c1220]">45 minutes</option>
                        <option value="60" className="bg-[#0c1220]">60 minutes</option>
                      </select>
                    </div>

                    {iError && (
                      <div className="sm:col-span-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2 rounded-lg">
                        {iError}
                      </div>
                    )}

                    <div className="sm:col-span-2 pt-1">
                      <button
                        type="submit"
                        className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:brightness-110 active:scale-[0.99] transition cursor-pointer"
                      >
                        Create room &amp; open live room now
                      </button>
                    </div>
                  </form>
                </div>

                {/* Schedule session form */}
                <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.03]">
                  <h4 className="text-xs font-bold tracking-widest uppercase text-cyan-400 mb-2">
                    Schedule a new webinar or clinic
                  </h4>
                  <p className="text-xs text-[#9aa5bb] mb-4">
                    This adds the session to the schedule and stores it in Supabase. Attendees join with their category PIN.
                  </p>

                  <form onSubmit={handleScheduleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-medium text-[#9aa5bb] mb-1">
                        Session title <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={cTitle}
                        onChange={(e) => setCTitle(e.target.value)}
                        placeholder="Campus to Corporate — Batch 12"
                        required
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#9aa5bb] mb-1">Format</label>
                      <select
                        value={cType}
                        onChange={(e) => setCType(e.target.value as 'webinar' | 'clinic')}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="webinar" className="bg-[#0c1220]">Webinar (broadcast + Q&amp;A)</option>
                        <option value="clinic" className="bg-[#0c1220]">Clinic (interactive)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#9aa5bb] mb-1">Category</label>
                      <select
                        value={cCategory}
                        onChange={(e) => setCCategory(e.target.value as PartnerCategory)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="Institutes" className="bg-[#0c1220]">Institutes</option>
                        <option value="Companies" className="bg-[#0c1220]">Companies</option>
                        <option value="Candidates" className="bg-[#0c1220]">Candidates</option>
                        <option value="All partners" className="bg-[#0c1220]">All partners</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#9aa5bb] mb-1">Host name</label>
                      <input
                        type="text"
                        value={cHost}
                        onChange={(e) => setCHost(e.target.value)}
                        placeholder="Ava Moreau"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#9aa5bb] mb-1">Start date &amp; time</label>
                      <input
                        type="datetime-local"
                        value={cStart}
                        onChange={(e) => setCStart(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#9aa5bb] mb-1">Duration (minutes)</label>
                      <input
                        type="number"
                        min={15}
                        max={240}
                        step={5}
                        value={cDuration}
                        onChange={(e) => setCDuration(parseInt(e.target.value, 10) || 60)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    {cError && (
                      <div className="sm:col-span-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2 rounded-lg">
                        {cError}
                      </div>
                    )}

                    {cSuccess && (
                      <div className="sm:col-span-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg">
                        {cSuccess}
                      </div>
                    )}

                    <div className="sm:col-span-2 pt-1">
                      <button
                        type="submit"
                        className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-950 bg-gradient-to-r from-indigo-500 to-cyan-400 hover:brightness-110 active:scale-[0.99] transition cursor-pointer"
                      >
                        Create &amp; publish to schedule
                      </button>
                    </div>
                  </form>
                </div>

                {/* Sessions list */}
                <div>
                  <h4 className="text-xs font-bold tracking-widest uppercase text-cyan-400 mb-3">
                    Scheduled Sessions &amp; Instant Rooms ({sessions.length})
                  </h4>

                  <div className="space-y-2">
                    {sessions
                      .slice()
                      .sort((a, b) => a.start - b.start)
                      .map((s) => {
                        const st = getSessionState(s);
                        const isInterview = s.type === 'interview';
                        const displayPin = isInterview ? s.pin : categoryPins[s.category as PartnerCategory] || '——';
                        const formatLabel = isInterview ? 'Instant interview' : s.type === 'webinar' ? 'Webinar' : 'Clinic';

                        return (
                          <div
                            key={s.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/10"
                          >
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <strong className="text-sm font-semibold text-white truncate">{s.title}</strong>
                                {isInterview && (
                                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/35">
                                    Admin Only
                                  </span>
                                )}
                                <span
                                  className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                    st.key === 'live'
                                      ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/15'
                                      : st.key === 'upcoming'
                                      ? 'text-indigo-300 border-indigo-500/40 bg-indigo-500/15'
                                      : 'text-[#9aa5bb] border-white/10 bg-white/5'
                                  }`}
                                >
                                  {st.label}
                                </span>
                              </div>
                              <p className="text-xs text-[#9aa5bb]">
                                {formatDateTime(s.start)} · {s.durationMin} min · {s.category} · {formatLabel} · Host: {s.host}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                              <span
                                className="font-mono text-xs font-bold text-amber-300 bg-amber-400/10 border border-amber-400/30 px-2 py-1 rounded-lg tracking-wider"
                                title={isInterview ? 'Room PIN' : 'Category PIN'}
                              >
                                {displayPin}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleCopy(displayPin || '', 'PIN')}
                                className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
                                title="Copy PIN"
                                aria-label="Copy PIN"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const pinVal = isInterview ? s.pin : categoryPins[s.category as PartnerCategory];
                                  const link = `${window.location.origin}${window.location.pathname}?pin=${pinVal}`;
                                  handleCopy(link, 'Join link');
                                }}
                                className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
                                title="Copy join link"
                                aria-label="Copy join link"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Delete "${s.title}"? Attendees will no longer be able to join.`)) {
                                    onDeleteSession(s.id);
                                    onShowToast('Session deleted');
                                  }
                                }}
                                className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-rose-500/20 hover:border-rose-500/30 text-white/70 hover:text-rose-300 transition cursor-pointer"
                                title="Delete session"
                                aria-label="Delete session"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: CATEGORY PINS */}
            {activeTab === 'pins' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <h4 className="text-xs font-bold tracking-widest uppercase text-cyan-400">
                    Category Access PINs
                  </h4>
                  <button
                    type="button"
                    onClick={onResetDemoData}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-[#9aa5bb] hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset demo data
                  </button>
                </div>

                <div className="space-y-2">
                  {(Object.keys(categoryPins) as PartnerCategory[]).map((cat) => (
                    <div
                      key={cat}
                      className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-white/[0.03] border border-white/10"
                    >
                      <div>
                        <strong className="block text-sm font-semibold text-white">{cat}</strong>
                        <small className="text-xs text-[#9aa5bb]">
                          Access PIN for all {cat.toLowerCase()} sessions
                        </small>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-amber-300 bg-amber-400/10 border border-amber-400/30 px-2.5 py-1 rounded-lg tracking-wider">
                          {categoryPins[cat]}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(categoryPins[cat], `${cat} PIN`)}
                          className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
                          title="Copy PIN"
                          aria-label={`Copy ${cat} PIN`}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRegenPin(cat)}
                          className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-rose-500/20 hover:border-rose-500/30 text-white/70 hover:text-rose-300 transition cursor-pointer"
                          title="Regenerate PIN"
                          aria-label={`Regenerate ${cat} PIN`}
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: SUPABASE DATABASE SETUP */}
            {activeTab === 'database' && (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl border border-cyan-400/30 bg-cyan-500/[0.05] space-y-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-cyan-400" />
                      <strong className="text-sm font-bold text-white">Supabase Integration Active</strong>
                    </div>
                    <button
                      type="button"
                      onClick={runHealthCheck}
                      disabled={checkingDb}
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-cyan-300 bg-cyan-400/15 hover:bg-cyan-400/25 border border-cyan-400/30 rounded-lg transition cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${checkingDb ? 'animate-spin' : ''}`} />
                      Check Connection
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/10">
                      <span className="text-[#9aa5bb] block mb-0.5">Project ID</span>
                      <strong className="text-white font-mono">{SUPABASE_PROJECT_ID}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/10">
                      <span className="text-[#9aa5bb] block mb-0.5">REST API URL</span>
                      <strong className="text-cyan-300 truncate block">https://{SUPABASE_PROJECT_ID}.supabase.co</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/10">
                      <span className="text-[#9aa5bb] block mb-0.5">API Key</span>
                      <strong className="text-emerald-400 block truncate">sb_publishable_...cooSwwsT</strong>
                    </div>
                  </div>

                  {dbHealth && (
                    <div className="p-3 rounded-xl bg-black/30 border border-white/10 space-y-2">
                      <span className="text-xs font-semibold text-white block">Table Statuses:</span>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border ${
                            dbHealth.sessionsTableReady
                              ? 'text-emerald-300 border-emerald-500/40 bg-emerald-500/15'
                              : 'text-amber-300 border-amber-400/40 bg-amber-400/15'
                          }`}
                        >
                          {dbHealth.sessionsTableReady ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                          sessions table: {dbHealth.sessionsTableReady ? 'Ready' : 'Not yet created in Supabase'}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border ${
                            dbHealth.participantsTableReady
                              ? 'text-emerald-300 border-emerald-500/40 bg-emerald-500/15'
                              : 'text-amber-300 border-amber-400/40 bg-amber-400/15'
                          }`}
                        >
                          {dbHealth.participantsTableReady ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                          participants table: {dbHealth.participantsTableReady ? 'Ready' : 'Not yet created in Supabase'}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border ${
                            dbHealth.pinsTableReady
                              ? 'text-emerald-300 border-emerald-500/40 bg-emerald-500/15'
                              : 'text-amber-300 border-amber-400/40 bg-amber-400/15'
                          }`}
                        >
                          {dbHealth.pinsTableReady ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                          category_pins table: {dbHealth.pinsTableReady ? 'Ready' : 'Not yet created in Supabase'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* SQL Schema helper */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h5 className="text-xs font-bold tracking-widest uppercase text-cyan-400">
                        1-Click SQL Schema Setup
                      </h5>
                      <p className="text-xs text-[#9aa5bb]">
                        Paste this into your Supabase SQL Editor to create tables and enable realtime participant tracking.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopySchema}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-950 bg-gradient-to-r from-indigo-500 to-cyan-400 hover:brightness-110 transition cursor-pointer shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy SQL Schema
                    </button>
                  </div>

                  <pre className="p-3.5 rounded-xl bg-black/60 border border-white/10 text-[11px] font-mono text-cyan-200 overflow-x-auto max-h-[220px]">
                    {SUPABASE_SQL_SCHEMA}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
