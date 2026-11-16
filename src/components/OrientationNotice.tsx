import React, { useState, useEffect } from 'react';
import { Smartphone, RotateCw, X } from 'lucide-react';

export const OrientationNotice: React.FC = () => {
  const [isPortrait, setIsPortrait] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    const checkOrientation = () => {
      // Check if width is less than height and screen is mobile/tablet size
      const isNarrow = window.innerWidth < window.innerHeight && window.innerWidth < 768;
      setIsPortrait(isNarrow);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!isPortrait || dismissed) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none pointer-events-auto">
      <div className="relative max-w-sm w-full bg-[#111827] border border-amber-500/40 p-6 clip-tactical-diag shadow-2xl flex flex-col items-center">
        <button 
          onClick={() => setDismissed(true)} 
          className="absolute top-3 right-3 text-zinc-400 hover:text-white p-1"
          title="Dismiss notice"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Animated rotating phone icon */}
        <div className="relative my-6 w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-amber-500/30 animate-ping opacity-25" />
          <Smartphone className="w-16 h-16 text-amber-400 transform rotate-90 transition-transform duration-700 animate-pulse" />
          <RotateCw className="w-8 h-8 text-cyan-400 absolute -top-1 -right-1" />
        </div>

        <span className="text-xs uppercase tracking-widest text-amber-400 font-mono-tactical font-semibold mb-1">
          TACTICAL DISPLAY ADVISORY
        </span>
        <h3 className="text-xl font-bold font-heading text-white tracking-wide mb-2 uppercase">
          Rotate Device to Landscape
        </h3>
        <p className="text-sm text-zinc-300 leading-relaxed mb-6 font-sans">
          This 3D deathmatch combat system is optimized for landscape phone orientation. Please rotate your phone sideways for dual-thumb tactical controls.
        </p>

        <button
          onClick={() => setDismissed(true)}
          className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold uppercase tracking-wider text-sm clip-tactical-sm hover:brightness-110 active:scale-95 transition-transform"
        >
          Continue Anyway
        </button>
      </div>
    </div>
  );
};
