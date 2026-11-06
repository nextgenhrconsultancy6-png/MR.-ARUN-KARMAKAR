import React from 'react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] max-w-[calc(100%-2rem)] bg-[#111726] border border-white/15 text-[#e8ecf5] text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-2xl shadow-black animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-none text-center"
    >
      {message}
    </div>
  );
};
