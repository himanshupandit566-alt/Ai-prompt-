import React from 'react';
import { AppLogo } from './AppLogo';

/**
 * Modern Splash Screen
 * Shown while Firebase Auth session (onAuthStateChanged) is initializing.
 * Completely eliminates the flash/flicker of the Home screen before routing to Welcome.
 */
export const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg-main)] text-[var(--text-primary)] flex flex-col items-center justify-center font-sans overflow-hidden select-none transition-colors">
      {/* Background Ambient Glow Orbs */}
      <div className="absolute w-96 h-96 bg-purple-600/15 dark:bg-purple-600/20 rounded-full blur-[140px] pointer-events-none animate-pulse-subtle" />
      <div className="absolute w-80 h-80 bg-blue-600/10 dark:bg-blue-600/15 rounded-full blur-[130px] pointer-events-none -bottom-20" />

      {/* Center Holographic Brand Emblem */}
      <div className="relative z-10 flex flex-col items-center text-center p-6 animate-in fade-in zoom-in-95 duration-400">
        <div className="relative mb-5">
          <div className="absolute -inset-4 bg-purple-500/20 dark:bg-purple-500/30 rounded-3xl blur-2xl animate-pulse" />
          <AppLogo
            size={76}
            showGlow={true}
            className="relative z-10 drop-shadow-[0_0_30px_rgba(168,85,247,0.5)]"
          />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">
          FX <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 dark:from-purple-400 dark:via-indigo-300 dark:to-blue-400 bg-clip-text text-transparent">Prompty</span>
        </h1>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 tracking-widest uppercase mb-8 font-medium">
          Discover. Copy. Create.
        </p>

        {/* High-Tech Animated Loading Indicator */}
        <div className="w-44 h-1 bg-slate-200 dark:bg-dark-900 rounded-full overflow-hidden relative border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
          <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 via-indigo-400 to-cyan-400 rounded-full w-1/2 animate-[shimmer_1.5s_infinite_linear]" />
        </div>
        <span className="text-[10px] text-slate-500 font-mono mt-3">
          Initializing session...
        </span>
      </div>
    </div>
  );
};
