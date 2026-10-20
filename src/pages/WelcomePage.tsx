import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Zap, Layers, Compass, CheckCircle2 } from 'lucide-react';

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#07080B] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Background Ambient Glow Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 -right-32 w-96 h-96 bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-indigo-600/20 rounded-full blur-[130px] pointer-events-none" />

      {/* Top Header / Skip Link */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 p-0.5 shadow-glow-purple group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#0D0F17] rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <span className="font-extrabold text-base tracking-tight text-white">
            FX <span className="text-purple-400">Prompty</span>
          </span>
        </Link>

        <button
          onClick={() => navigate('/')}
          className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
        >
          Skip for now →
        </button>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-xl mx-auto px-6 py-4 flex-1 flex flex-col items-center justify-center text-center">
        {/* Top Attractive AI Visual Illustration & Floating Cards */}
        <div className="relative mb-8 w-full flex items-center justify-center">
          {/* Central Holographic Orb */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 p-1 shadow-2xl shadow-purple-600/40 animate-pulse-subtle flex items-center justify-center">
            <div className="w-full h-full bg-[#0D0F17] rounded-[22px] flex flex-col items-center justify-center p-3">
              <Sparkles className="w-12 h-12 text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.7)]" />
              <span className="text-[10px] font-bold text-slate-300 mt-1 uppercase tracking-widest">
                AI Engine
              </span>
            </div>
          </div>

          {/* Floating Pill Preview 1: Left */}
          <div className="absolute -left-2 sm:left-4 top-4 bg-[#12141D]/90 border border-purple-500/30 backdrop-blur-md rounded-2xl p-2.5 shadow-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-left-4 duration-700">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-dark-950">
              <img
                src="https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=150&q=80"
                alt="Cyberpunk"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-left pr-1">
              <p className="text-[11px] font-semibold text-white">Cyberpunk</p>
              <p className="text-[9px] text-purple-300 font-mono">Arri 85mm</p>
            </div>
          </div>

          {/* Floating Pill Preview 2: Right */}
          <div className="absolute -right-2 sm:right-4 bottom-2 bg-[#12141D]/90 border border-blue-500/30 backdrop-blur-md rounded-2xl p-2.5 shadow-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-dark-950">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                alt="Cinematic"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-left pr-1">
              <p className="text-[11px] font-semibold text-white">Cinematic</p>
              <p className="text-[9px] text-blue-300 font-mono">1-Tap Copy</p>
            </div>
          </div>
        </div>

        {/* Catchy Heading */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
          Find Your Next <br />
          <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-blue-400 bg-clip-text text-transparent">
            AI Masterpiece
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-md mx-auto mb-8 font-normal">
          Explore &amp; copy thousands of curated Midjourney, Flux and DALL-E prompts instantly.
        </p>

        {/* Value Highlights Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-10 max-w-md">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#131622] border border-slate-800 text-xs text-slate-300">
            <Zap className="w-3.5 h-3.5 text-purple-400" />
            <span>1-Tap Prompt Copy</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#131622] border border-slate-800 text-xs text-slate-300">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>45+ Curated Styles</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#131622] border border-slate-800 text-xs text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Midjourney &amp; Flux</span>
          </div>
        </div>

        {/* Actions Section */}
        <div className="w-full max-w-sm space-y-3">
          {/* Glowing Gradient Get Started Button */}
          <button
            onClick={() => navigate('/login')}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-base shadow-[0_0_30px_-5px_rgba(139,92,246,0.6)] hover:shadow-[0_0_40px_-5px_rgba(139,92,246,0.8)] transition-all active:scale-98 flex items-center justify-center gap-2.5 group"
          >
            <span>Get Started</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Skip For Now Button */}
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 px-4 rounded-xl text-slate-400 hover:text-white text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <Compass className="w-4 h-4 text-purple-400" />
            <span>Explore as Guest (Skip for now)</span>
          </button>
        </div>
      </main>

      {/* Subtle Footer Note */}
      <footer className="relative z-10 w-full text-center py-5 text-xs text-slate-500">
        FX Prompty • Discover. Copy. Create.
      </footer>
    </div>
  );
};
