import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Sparkles } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-3xl bg-purple-600/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shadow-glow-purple mx-auto">
          <Sparkles className="w-12 h-12" />
        </div>
        <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-dark-900 border border-slate-700 text-xs font-mono text-purple-300">
          404
        </span>
      </div>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
        Page Not Found
      </h1>
      <p className="text-sm text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
        The destination you are looking for does not exist in PromptVerse AI or may have moved.
      </p>

      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-all shadow-glow-purple"
        >
          Return Home
        </Link>
        <Link
          to="/explore"
          className="px-5 py-2.5 rounded-xl bg-dark-900 hover:bg-dark-850 border border-slate-700 text-slate-200 text-sm font-semibold transition-all flex items-center gap-1.5"
        >
          <Compass className="w-4 h-4" /> Explore Gallery
        </Link>
      </div>
    </div>
  );
};
