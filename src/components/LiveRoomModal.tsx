import React, { useState, useEffect, useRef } from 'react';
import { Session, getInitials } from '../utils/sessionRules.ts';
import {
  registerLiveParticipant,
  updateParticipantStatus,
  removeLiveParticipant,
} from '../services/supabaseService.ts';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Hand,
  MonitorUp,
  MessageSquare,
  PhoneOff,
  X,
  Share2,
  Send,
  Sparkles,
  Check,
} from 'lucide-react';

interface LiveRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session | null;
  initialUserName: string;
  viewerCategory: string;
  isHost?: boolean;
  onShowToast: (msg: string) => void;
}

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  isSelf: boolean;
  timestamp: string;
}

export const LiveRoomModal: React.FC<LiveRoomModalProps> = ({
  isOpen,
  onClose,
  session,
  initialUserName,
  viewerCategory,
  isHost = false,
  onShowToast,
}) => {
  const [inRoom, setInRoom] = useState(false);
  const [userName, setUserName] = useState(initialUserName || 'Guest');
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [handRaised, setHandRaised] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [activeSpeakerIdx, setActiveSpeakerIdx] = useState(0);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const participantIdRef = useRef<string>('');
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const prejoinVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const isWebinar = session?.type === 'webinar';
  const isInterview = session?.type === 'interview';

  // Setup media stream & register live participant on opening
  useEffect(() => {
    if (!isOpen || !session) return;

    setInRoom(false);
    setUserName(initialUserName || 'Guest');
    setHandRaised(false);
    setChatOpen(false);
    setIsScreenSharing(false);

    // Register active participant
    const pid = `part_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    participantIdRef.current = pid;

    registerLiveParticipant({
      id: pid,
      sessionId: session.id,
      sessionTitle: session.title,
      name: initialUserName || 'Guest',
      role: isHost ? 'Host' : (isInterview ? 'Candidate' : 'Attendee'),
      category: viewerCategory || session.category,
      status: 'lobby',
      joinedAt: Date.now(),
      lastSeen: Date.now(),
    });

    // Heartbeat every 20s
    const hbInterval = setInterval(() => {
      if (participantIdRef.current) {
        updateParticipantStatus(participantIdRef.current, inRoom ? (handRaised ? 'hand_raised' : isScreenSharing ? 'sharing' : 'in_call') : 'lobby');
      }
    }, 20000);

    let activeStream: MediaStream | null = null;

    const startMedia = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          activeStream = stream;
          localStreamRef.current = stream;
          if (prejoinVideoRef.current) {
            prejoinVideoRef.current.srcObject = stream;
          }
          setCamOn(true);
          setMicOn(true);
        }
      } catch {
        // Fallback: try audio only or graceful avatar
        try {
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            activeStream = audioStream;
            localStreamRef.current = audioStream;
            setMicOn(true);
            setCamOn(false);
          }
        } catch {
          setCamOn(false);
          setMicOn(false);
        }
      }
    };

    startMedia();

    return () => {
      clearInterval(hbInterval);
      if (participantIdRef.current) {
        removeLiveParticipant(participantIdRef.current);
      }
      if (activeStream) {
        activeStream.getTracks().forEach((t) => t.stop());
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
    };
  }, [isOpen, session, initialUserName, isHost, isInterview, viewerCategory]);

  // Sync video element when switching to in-room view
  useEffect(() => {
    if (inRoom && localStreamRef.current && localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [inRoom, camOn]);

  // Active speaker cycling simulation
  useEffect(() => {
    if (!inRoom) return;
    const interval = setInterval(() => {
      setActiveSpeakerIdx((prev) => (prev === 0 ? 1 : 0));
    }, 4000);
    return () => clearInterval(interval);
  }, [inRoom]);

  // Initial welcome chat messages
  useEffect(() => {
    if (!inRoom || !session) return;

    const host = session.host;
    let initialGreeting = 'Welcome everyone — we start in a couple of minutes.';
    if (isInterview) {
      initialGreeting = `Hi — thanks for making the time. We will take about ${session.durationMin} minutes.`;
    }

    const t1 = setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: 'msg-1',
          sender: host,
          text: initialGreeting,
          isSelf: false,
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        },
      ]);
    }, 1200);

    const t2 = setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: 'msg-2',
          sender: 'Nextgenn HR Bot',
          text: isInterview
            ? 'Instant interview room. Room PIN is shared only with the interviewer and candidate.'
            : isWebinar
            ? `This webinar is for the ${viewerCategory || session.category} category. Questions go in this panel.`
            : 'Welcome! Please feel free to participate actively in this clinic.',
          isSelf: false,
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        },
      ]);
    }, 2800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [inRoom, session, isInterview, isWebinar, viewerCategory]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatOpen]);

  if (!isOpen || !session) return null;

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicOn(audioTrack.enabled);
        return;
      }
    }
    setMicOn(!micOn);
  };

  const toggleCam = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCamOn(videoTrack.enabled);
        return;
      }
    }
    setCamOn(!camOn);
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
      if (participantIdRef.current) {
        updateParticipantStatus(participantIdRef.current, handRaised ? 'hand_raised' : 'in_call');
      }
      onShowToast('Screen sharing stopped');
    } else {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          screenStreamRef.current = screenStream;
          if (screenVideoRef.current) {
            screenVideoRef.current.srcObject = screenStream;
          }
          setIsScreenSharing(true);
          if (participantIdRef.current) {
            updateParticipantStatus(participantIdRef.current, 'sharing');
          }
          onShowToast('You are now presenting your screen');

          screenStream.getVideoTracks()[0].onended = () => {
            setIsScreenSharing(false);
            screenStreamRef.current = null;
            if (participantIdRef.current) {
              updateParticipantStatus(participantIdRef.current, handRaised ? 'hand_raised' : 'in_call');
            }
          };
        } else {
          onShowToast('Screen sharing not supported in this browser environment');
        }
      } catch {
        onShowToast('Screen share cancelled');
      }
    }
  };

  const handleJoin = () => {
    setInRoom(true);
    if (participantIdRef.current) {
      updateParticipantStatus(participantIdRef.current, 'in_call');
    }
    if (isWebinar && !isHost) {
      // Webinar attendees join muted
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = false));
      }
      setMicOn(false);
      onShowToast('You joined the webinar (muted by default)');
    } else {
      onShowToast(isInterview ? 'Interview room joined' : 'You joined the room');
    }
  };

  const handleRaiseHand = () => {
    const nextState = !handRaised;
    setHandRaised(nextState);
    if (participantIdRef.current) {
      updateParticipantStatus(participantIdRef.current, nextState ? 'hand_raised' : (isScreenSharing ? 'sharing' : 'in_call'));
    }

    if (nextState) {
      onShowToast('Hand raised — host notified');
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          sender: 'You',
          text: '✋ Raised hand',
          isSelf: true,
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        },
      ]);

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now() + 1}`,
            sender: session.host,
            text: `Thanks ${userName} — you have permission to speak during the Q&A segment.`,
            isSelf: false,
            timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
          },
        ]);
      }, 2500);
    } else {
      onShowToast('Hand lowered');
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const userText = inputMsg.trim();
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        sender: userName || 'You',
        text: userText,
        isSelf: true,
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      },
    ]);
    setInputMsg('');

    // Contextual auto-reply from host
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-reply-${Date.now()}`,
          sender: session.host,
          text: `Good point, ${userName}. Noting this for discussion!`,
          isSelf: false,
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        },
      ]);
    }, 2000);
  };

  const handleCopyLink = () => {
    const pinVal = isInterview ? session.pin : session.category;
    const url = `${window.location.origin}${window.location.pathname}?pin=${pinVal}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    onShowToast('Session link copied to clipboard');
  };

  const handleCopyPin = () => {
    if (session.pin) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(session.pin);
      }
      onShowToast(`Room PIN ${session.pin} copied — share it with the candidate.`);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="liveRoomTitle"
    >
      <div className="bg-[#0a0e17] border border-white/10 rounded-2xl w-full max-w-[1080px] h-[92vh] max-h-[720px] flex flex-col overflow-hidden shadow-2xl shadow-black relative">
        {/* Topbar */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 pulse-red-dot shrink-0"></span>
            <div className="min-w-0">
              <strong id="liveRoomTitle" className="block text-sm font-bold text-white truncate max-w-[280px] sm:max-w-[400px]">
                {session.title}
              </strong>
              <small className="block text-[11px] text-[#9aa5bb] truncate">
                Host: {session.host} · {session.category} {isInterview ? '· Room PIN required' : '· Category PIN'}
              </small>
            </div>

            {isInterview && session.pin && (
              <button
                type="button"
                onClick={handleCopyPin}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold text-amber-300 bg-amber-400/10 border border-amber-400/35 hover:bg-amber-400/20 transition cursor-pointer"
                title="Click to copy Room PIN"
              >
                Room PIN <b className="text-white tracking-widest">{session.pin}</b>
              </button>
            )}

            {isWebinar && (
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full text-indigo-300 bg-indigo-500/20 border border-indigo-500/40">
                Webinar
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleCopyLink}
              className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
              title="Copy session link"
              aria-label="Copy session link"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
              title="Close live room"
              aria-label="Close live room"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* State 1: Pre-join Lobby */}
        {!inRoom ? (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-[1.15fr_0.85fr] gap-6 p-6 sm:p-10 items-center overflow-y-auto">
            {/* Preview Cam box */}
            <div className="relative aspect-[16/10] bg-[#0f1523] border border-white/10 rounded-2xl overflow-hidden flex items-center justify-center">
              {camOn ? (
                <video
                  ref={prejoinVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="w-20 h-20 rounded-full grid place-items-center font-bold text-2xl text-slate-950 bg-gradient-to-br from-indigo-500 to-cyan-400">
                    {getInitials(userName) || 'You'}
                  </div>
                  <p className="text-xs text-[#9aa5bb]">Camera is off</p>
                </div>
              )}

              {/* Pre-join toggle controls overlay */}
              <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={toggleMic}
                  className={`w-11 h-11 rounded-full grid place-items-center transition-colors shadow-lg cursor-pointer ${
                    micOn
                      ? 'bg-slate-900/80 text-white border border-white/20 hover:bg-slate-800'
                      : 'bg-rose-600 text-white border border-rose-500 hover:bg-rose-500'
                  }`}
                  aria-label={micOn ? 'Mute microphone' : 'Unmute microphone'}
                >
                  {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
                <button
                  type="button"
                  onClick={toggleCam}
                  className={`w-11 h-11 rounded-full grid place-items-center transition-colors shadow-lg cursor-pointer ${
                    camOn
                      ? 'bg-slate-900/80 text-white border border-white/20 hover:bg-slate-800'
                      : 'bg-rose-600 text-white border border-rose-500 hover:bg-rose-500'
                  }`}
                  aria-label={camOn ? 'Turn off camera' : 'Turn on camera'}
                >
                  {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Prejoin info form */}
            <div className="space-y-4">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  isHost
                    ? 'text-amber-300 bg-amber-400/15 border border-amber-400/35'
                    : 'text-emerald-400 bg-emerald-500/15 border border-emerald-500/35'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isHost ? 'Room created by Admin' : 'PIN verified'}
              </span>

              <h2 className="text-2xl font-bold text-white tracking-tight">Ready to join?</h2>

              <p className="text-sm text-[#9aa5bb] leading-relaxed">
                {isHost
                  ? 'Your instant room is live. Copy the room PIN from the top bar and share it with the candidate.'
                  : isInterview
                  ? 'Instant interview room. The interviewer will guide you through the session.'
                  : isWebinar
                  ? 'This is a webinar broadcast. You will join muted; use Raise hand to request the mic.'
                  : 'Check your camera and microphone, then enter the room.'}
              </p>

              <div>
                <label className="block text-xs font-semibold text-[#9aa5bb] tracking-wider uppercase mb-1.5">
                  Display name
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Your name"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="button"
                onClick={handleJoin}
                className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-slate-950 bg-gradient-to-r from-indigo-500 to-cyan-400 hover:brightness-110 active:scale-[0.99] shadow-lg shadow-indigo-500/25 transition cursor-pointer"
              >
                Join now
              </button>

              <p className="text-xs text-[#9aa5bb] leading-relaxed">
                {isWebinar
                  ? 'Attendees start muted with camera off. You can still ask questions in the Q&A panel.'
                  : 'Camera access is optional. If you deny it, you can still join with an avatar and listen in.'}
              </p>
            </div>
          </div>
        ) : (
          /* State 2: In-Room Live Conference */
          <div className="flex-1 flex min-h-0 relative">
            <div className="flex-1 flex flex-col min-w-0">
              {/* Stage grid */}
              <div className="flex-1 p-3 sm:p-4 flex flex-col gap-3 min-h-0 overflow-hidden">
                {/* Screen Share Window (if active) */}
                {isScreenSharing && (
                  <div className="flex-1 relative rounded-2xl overflow-hidden bg-black border border-white/10 flex items-center justify-center">
                    <video ref={screenVideoRef} autoPlay playsInline className="w-full h-full object-contain" />
                    <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/70 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-semibold text-emerald-400 border border-white/10">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot"></span>
                      You are presenting
                    </div>
                  </div>
                )}

                {/* Participant Tiles Grid */}
                <div
                  className={`grid gap-3 min-h-0 flex-1 ${
                    isScreenSharing
                      ? 'grid-cols-4 h-24 shrink-0'
                      : isWebinar
                      ? 'grid-cols-1 sm:grid-cols-2 grid-rows-[1fr_auto]'
                      : 'grid-cols-1 sm:grid-cols-2'
                  }`}
                >
                  {/* Self Tile (hidden in webinar attendee mode if not host) */}
                  {(!isWebinar || isHost) && (
                    <div className="relative rounded-xl sm:rounded-2xl bg-[#111726] border border-white/10 overflow-hidden flex items-center justify-center">
                      {camOn ? (
                        <video
                          ref={localVideoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover scale-x-[-1]"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full grid place-items-center font-bold text-lg text-slate-950 bg-gradient-to-br from-cyan-400 to-indigo-500">
                          {getInitials(userName) || 'You'}
                        </div>
                      )}

                      <span className="absolute left-2.5 bottom-2.5 text-xs font-medium text-white bg-black/75 px-2.5 py-0.5 rounded-lg backdrop-blur-md">
                        {userName} {isHost ? '(Host)' : '(You)'}
                      </span>

                      <span
                        className={`absolute right-2.5 bottom-2.5 w-6 h-6 rounded-full grid place-items-center text-xs ${
                          micOn ? 'bg-black/75 text-emerald-400' : 'bg-rose-600 text-white'
                        }`}
                      >
                        {micOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                      </span>
                    </div>
                  )}

                  {/* Host Tile */}
                  <div
                    className={`relative rounded-xl sm:rounded-2xl bg-[#111726] border overflow-hidden flex items-center justify-center transition-all ${
                      isWebinar && !isHost ? 'sm:col-span-2' : ''
                    } ${
                      activeSpeakerIdx === 0
                        ? 'border-emerald-500/70 shadow-[0_0_20px_-5px_rgba(52,211,153,0.35)]'
                        : 'border-white/10'
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-16 h-16 rounded-full grid place-items-center font-bold text-lg text-slate-950 bg-gradient-to-br from-indigo-500 to-purple-500">
                        {getInitials(session.host) || 'AM'}
                      </div>
                      <span className="text-xs text-[#9aa5bb]">Host speaker</span>
                    </div>

                    <span className="absolute left-2.5 bottom-2.5 text-xs font-medium text-white bg-black/75 px-2.5 py-0.5 rounded-lg backdrop-blur-md">
                      {session.host} (Host)
                    </span>

                    <span className="absolute right-2.5 bottom-2.5 w-6 h-6 rounded-full grid place-items-center text-xs bg-black/75 text-emerald-400">
                      <Mic className="w-3.5 h-3.5" />
                    </span>

                    {activeSpeakerIdx === 0 && (
                      <span className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent wave-animation"></span>
                    )}
                  </div>

                  {/* Second Attendee / Candidate Tile */}
                  {isInterview ? (
                    <div
                      className={`relative rounded-xl sm:rounded-2xl bg-[#111726] border overflow-hidden flex items-center justify-center transition-all ${
                        activeSpeakerIdx === 1
                          ? 'border-emerald-500/70 shadow-[0_0_20px_-5px_rgba(52,211,153,0.35)]'
                          : 'border-white/10'
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-16 h-16 rounded-full grid place-items-center font-bold text-lg text-slate-950 bg-gradient-to-br from-amber-400 to-amber-200">
                          {getInitials(session.candidate || 'Candidate')}
                        </div>
                        <span className="text-xs text-[#9aa5bb]">
                          {session.role ? `Role: ${session.role}` : 'Candidate'}
                        </span>
                      </div>

                      <span className="absolute left-2.5 bottom-2.5 text-xs font-medium text-white bg-black/75 px-2.5 py-0.5 rounded-lg backdrop-blur-md">
                        {session.candidate || 'Riya Sharma'} · Candidate
                      </span>

                      <span className="absolute right-2.5 bottom-2.5 w-6 h-6 rounded-full grid place-items-center text-xs bg-black/75 text-emerald-400">
                        <Mic className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  ) : (
                    <div className="relative rounded-xl sm:rounded-2xl bg-[#111726] border border-white/10 overflow-hidden flex items-center justify-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-16 h-16 rounded-full grid place-items-center font-bold text-lg text-slate-950 bg-gradient-to-br from-cyan-400 to-indigo-400">
                          PN
                        </div>
                        <span className="text-xs text-[#9aa5bb]">Placement Team</span>
                      </div>

                      <span className="absolute left-2.5 bottom-2.5 text-xs font-medium text-white bg-black/75 px-2.5 py-0.5 rounded-lg backdrop-blur-md">
                        Priya Nair · Institutes
                      </span>

                      <span className="absolute right-2.5 bottom-2.5 w-6 h-6 rounded-full grid place-items-center text-xs bg-black/75 text-emerald-400">
                        <Mic className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Controls Bar */}
              <div className="flex items-center justify-center gap-2.5 sm:gap-4 p-3 sm:p-4 border-t border-white/10 bg-white/[0.02] flex-wrap">
                {/* Mic toggle */}
                <button
                  type="button"
                  onClick={toggleMic}
                  className={`w-11 h-11 rounded-full grid place-items-center transition cursor-pointer ${
                    micOn
                      ? 'bg-white/10 text-white hover:bg-white/20'
                      : 'bg-rose-600 text-white hover:bg-rose-500'
                  }`}
                  title={micOn ? 'Mute' : 'Unmute'}
                  aria-label={micOn ? 'Mute microphone' : 'Unmute microphone'}
                >
                  {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>

                {/* Cam toggle */}
                <button
                  type="button"
                  onClick={toggleCam}
                  className={`w-11 h-11 rounded-full grid place-items-center transition cursor-pointer ${
                    camOn
                      ? 'bg-white/10 text-white hover:bg-white/20'
                      : 'bg-rose-600 text-white hover:bg-rose-500'
                  }`}
                  title={camOn ? 'Turn camera off' : 'Turn camera on'}
                  aria-label={camOn ? 'Turn off camera' : 'Turn on camera'}
                >
                  {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>

                {/* Raise Hand (webinar mode) */}
                {isWebinar && (
                  <button
                    type="button"
                    onClick={handleRaiseHand}
                    className={`w-11 h-11 rounded-full grid place-items-center transition cursor-pointer ${
                      handRaised
                        ? 'bg-amber-400 text-slate-950 font-bold border border-amber-300'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                    title={handRaised ? 'Lower hand' : 'Raise hand'}
                    aria-label={handRaised ? 'Lower hand' : 'Raise hand'}
                  >
                    <Hand className="w-5 h-5" />
                  </button>
                )}

                {/* Screen Share */}
                <button
                  type="button"
                  onClick={toggleScreenShare}
                  className={`w-11 h-11 rounded-full grid place-items-center transition cursor-pointer ${
                    isScreenSharing
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                  title={isScreenSharing ? 'Stop presenting' : 'Present screen'}
                  aria-label="Present screen"
                >
                  <MonitorUp className="w-5 h-5" />
                </button>

                {/* Chat drawer button */}
                <button
                  type="button"
                  onClick={() => setChatOpen(!chatOpen)}
                  className={`w-11 h-11 rounded-full grid place-items-center transition cursor-pointer relative ${
                    chatOpen ? 'bg-indigo-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                  title="Open chat & Q&A"
                  aria-label="Open chat"
                >
                  <MessageSquare className="w-5 h-5" />
                  {messages.length > 0 && !chatOpen && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                  )}
                </button>

                {/* Leave Room Button */}
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs tracking-wide shadow-md active:scale-95 transition cursor-pointer ml-2"
                >
                  <PhoneOff className="w-4 h-4" />
                  Leave
                </button>
              </div>
            </div>

            {/* In-Call Chat / Q&A Drawer */}
            {chatOpen && (
              <aside
                className="w-full sm:w-[320px] bg-[#0d1320] border-l border-white/10 flex flex-col absolute sm:static inset-0 z-20"
                aria-label="In-call chat"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                  <span className="text-sm font-bold text-white">
                    {isWebinar ? 'Q&amp;A &amp; Messages' : 'In-call Messages'}
                  </span>
                  <button
                    onClick={() => setChatOpen(false)}
                    className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
                    aria-label="Close chat"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 p-4 space-y-3.5 overflow-y-auto">
                  {messages.map((m) => (
                    <div key={m.id} className="text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <strong className={m.isSelf ? 'text-cyan-400 font-semibold' : 'text-white font-semibold'}>
                          {m.sender}
                        </strong>
                        <span className="text-[10px] text-[#9aa5bb]">{m.timestamp}</span>
                      </div>
                      <p className="text-[#e8ecf5] bg-white/[0.04] p-2 rounded-lg leading-relaxed border border-white/5">
                        {m.text}
                      </p>
                    </div>
                  ))}
                  <div ref={chatBottomRef} />
                </div>

                <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 flex gap-2">
                  <input
                    type="text"
                    value={inputMsg}
                    onChange={(e) => setInputMsg(e.target.value)}
                    placeholder={isWebinar ? 'Ask a question…' : 'Send a message…'}
                    className="flex-1 min-w-0 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 text-slate-950 font-bold hover:brightness-110 active:scale-95 transition cursor-pointer shrink-0"
                    aria-label="Send message"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </aside>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
