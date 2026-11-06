import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { Hero } from './components/Hero.tsx';
import { Logos } from './components/Logos.tsx';
import { Audiences } from './components/Audiences.tsx';
import { Services } from './components/Services.tsx';
import { WebinarSchedule } from './components/WebinarSchedule.tsx';
import { HowItWorks } from './components/HowItWorks.tsx';
import { FAQ } from './components/FAQ.tsx';
import { Footer } from './components/Footer.tsx';
import { PinModal } from './components/PinModal.tsx';
import { AdminModal } from './components/AdminModal.tsx';
import { LiveRoomModal } from './components/LiveRoomModal.tsx';
import { Toast } from './components/Toast.tsx';
import {
  Session,
  CategoryPins,
  DEFAULT_CAT_PINS,
  PartnerCategory,
} from './utils/sessionRules.ts';
import {
  PIN_STORAGE_KEY,
  SESSIONS_STORAGE_KEY,
  getInitialSessions,
} from './utils/seedData.ts';
import {
  fetchSessions,
  saveSessionToDb,
  deleteSessionFromDb,
  fetchCategoryPins,
  updateCategoryPinInDb,
} from './services/supabaseService.ts';

export default function App() {
  // Load category PINs
  const [categoryPins, setCategoryPins] = useState<CategoryPins>(() => {
    try {
      const stored = localStorage.getItem(PIN_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          return {
            Institutes: /^\d{6}$/.test(parsed.Institutes) ? parsed.Institutes : DEFAULT_CAT_PINS.Institutes,
            Companies: /^\d{6}$/.test(parsed.Companies) ? parsed.Companies : DEFAULT_CAT_PINS.Companies,
            Candidates: /^\d{6}$/.test(parsed.Candidates) ? parsed.Candidates : DEFAULT_CAT_PINS.Candidates,
            'All partners': /^\d{6}$/.test(parsed['All partners']) ? parsed['All partners'] : DEFAULT_CAT_PINS['All partners'],
          };
        }
      }
    } catch {
      // fallback
    }
    return DEFAULT_CAT_PINS;
  });

  // Load Sessions
  const [sessions, setSessions] = useState<Session[]>(() => {
    try {
      const stored = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return getInitialSessions();
  });

  // Modal and Room states
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [liveRoomOpen, setLiveRoomOpen] = useState(false);
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
  const [initialUrlPin, setInitialUrlPin] = useState('');

  // Active Live Room State
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [activeUserName, setActiveUserName] = useState('');
  const [viewerCategory, setViewerCategory] = useState('');
  const [isHost, setIsHost] = useState(false);

  // UI state
  const [copiedCategory, setCopiedCategory] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Hydrate from Supabase if tables exist
  useEffect(() => {
    let active = true;
    async function loadRemoteData() {
      try {
        const [remotePins, remoteSessions] = await Promise.all([
          fetchCategoryPins(),
          fetchSessions(),
        ]);
        if (!active) return;
        if (remotePins) {
          setCategoryPins(remotePins);
          try {
            localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(remotePins));
          } catch {
            // ignore
          }
        }
        if (remoteSessions && remoteSessions.length > 0) {
          setSessions(remoteSessions);
          try {
            localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(remoteSessions));
          } catch {
            // ignore
          }
        }
      } catch {
        // graceful fallback to local storage
      }
    }
    loadRemoteData();
    return () => {
      active = false;
    };
  }, []);

  // Save changes to localStorage & sync to Supabase
  const updateCategoryPins = (newPins: CategoryPins) => {
    setCategoryPins(newPins);
    try {
      localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(newPins));
    } catch {
      // ignore
    }
    // Asynchronously sync to Supabase
    (Object.keys(newPins) as PartnerCategory[]).forEach((cat) => {
      updateCategoryPinInDb(cat, newPins[cat]).catch(() => {});
    });
  };

  const updateSessions = (newSessions: Session[]) => {
    setSessions(newSessions);
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(newSessions));
    } catch {
      // ignore
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => {
      setToastMessage(null);
    }, 3000);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Handle URL ?pin= query parameter
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlPin = params.get('pin');
      if (urlPin && /^\d{6}$/.test(urlPin)) {
        setInitialUrlPin(urlPin);
        setPinModalOpen(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleOpenJoin = (sessionId?: string) => {
    setPendingSessionId(sessionId || null);
    setPinModalOpen(true);
  };

  const handleCopyCategoryPin = (pin: string, category: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(pin);
    }
    setCopiedCategory(category);
    showToast(`${category} PIN copied: ${pin}`);
    setTimeout(() => setCopiedCategory(null), 2500);
  };

  const handleAddSession = (newSession: Session) => {
    const updated = [newSession, ...sessions];
    updateSessions(updated);
    saveSessionToDb(newSession).catch(() => {});
  };

  const handleDeleteSession = (sessionId: string) => {
    const updated = sessions.filter((s) => s.id !== sessionId);
    updateSessions(updated);
    deleteSessionFromDb(sessionId).catch(() => {});
  };

  const handleResetDemoData = () => {
    try {
      localStorage.removeItem(PIN_STORAGE_KEY);
      localStorage.removeItem(SESSIONS_STORAGE_KEY);
    } catch {
      // ignore
    }
    const resetPins = DEFAULT_CAT_PINS;
    const resetSessions = getInitialSessions();
    setCategoryPins(resetPins);
    setSessions(resetSessions);
    showToast('Demo data and default PINs restored');
  };

  const handleSuccessJoin = (session: Session, userName: string, assignedCategory: string) => {
    setActiveSession(session);
    setActiveUserName(userName);
    setViewerCategory(assignedCategory);
    setIsHost(false);
    setLiveRoomOpen(true);
  };

  const handleLaunchLiveRoomAsHost = (session: Session, interviewerName: string) => {
    setActiveSession(session);
    setActiveUserName(interviewerName);
    setViewerCategory('Interviews');
    setIsHost(true);
    setLiveRoomOpen(true);
  };

  return (
    <div className="min-h-screen text-[#e8ecf5] selection:bg-indigo-500/30 selection:text-white relative">
      {/* Ambient background mesh */}
      <div className="ambient-bg" />

      {/* Navigation */}
      <Navbar
        onOpenAdmin={() => setAdminModalOpen(true)}
        onOpenJoin={() => handleOpenJoin()}
      />

      <main id="top">
        {/* Hero Section with Countdown & Featured Session */}
        <Hero
          sessions={sessions}
          onOpenJoin={handleOpenJoin}
        />

        {/* Logos Bar */}
        <Logos />

        {/* Audiences: Institutes, Companies, Candidates with PINs */}
        <Audiences
          categoryPins={categoryPins}
          onCopyPin={handleCopyCategoryPin}
          copiedCategory={copiedCategory}
        />

        {/* Services Overview */}
        <Services />

        {/* Webinar & Live Sessions Schedule */}
        <WebinarSchedule
          sessions={sessions}
          onOpenJoin={handleOpenJoin}
          onOpenAdmin={() => setAdminModalOpen(true)}
        />

        {/* How It Works Steps */}
        <HowItWorks />

        {/* FAQ Accordion */}
        <FAQ />
      </main>

      {/* Footer */}
      <Footer onOpenAdmin={() => setAdminModalOpen(true)} />

      {/* Modals */}
      <PinModal
        isOpen={pinModalOpen}
        onClose={() => {
          setPinModalOpen(false);
          setPendingSessionId(null);
        }}
        sessions={sessions}
        categoryPins={categoryPins}
        pendingSessionId={pendingSessionId}
        onSuccessJoin={handleSuccessJoin}
        initialPin={initialUrlPin}
      />

      <AdminModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        sessions={sessions}
        categoryPins={categoryPins}
        onUpdateCategoryPins={updateCategoryPins}
        onAddSession={handleAddSession}
        onDeleteSession={handleDeleteSession}
        onResetDemoData={handleResetDemoData}
        onLaunchLiveRoomAsHost={handleLaunchLiveRoomAsHost}
        onShowToast={showToast}
      />

      <LiveRoomModal
        isOpen={liveRoomOpen}
        onClose={() => setLiveRoomOpen(false)}
        session={activeSession}
        initialUserName={activeUserName}
        viewerCategory={viewerCategory}
        isHost={isHost}
        onShowToast={showToast}
      />

      {/* Toast Feedback */}
      <Toast message={toastMessage} />
    </div>
  );
}
