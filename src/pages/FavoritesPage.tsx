import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { copyToClipboard } from '../utils/clipboard';
import { exportPromptToTxt } from '../utils/exportPrompt';
import {
  Heart,
  Copy,
  Check,
  Download,
  Trash2,
  Sparkles,
  ArrowRight,
  Compass,
  FileText
} from 'lucide-react';

export const FavoritesPage: React.FC = () => {
  const { favorites, allPrompts, toggleFavorite, showToast } = useFavorites();
  const { isAuthenticated } = useAuth();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Match saved IDs to prompt objects
  const savedPrompts = allPrompts.filter((p) => favorites.includes(p.id));

  const handleCopy = async (id: string, text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedId(id);
      showToast('Prompt copied to clipboard! 📋', 'success');
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      showToast('Failed to copy prompt', 'error');
    }
  };

  const handleDownload = (prompt: typeof allPrompts[0]) => {
    const success = exportPromptToTxt(prompt);
    if (success) {
      showToast(`Exported "${prompt.title}.txt"! 💾`, 'success');
    }
  };

  // Export all favorites in a single consolidated TXT
  const handleExportAll = () => {
    if (savedPrompts.length === 0) return;
    try {
      const header = [
        'FX PROMPTY - MY FAVORITES COLLECTION',
        '=====================================',
        `Exported on: ${new Date().toLocaleDateString()}`,
        `Total Prompts: ${savedPrompts.length}`,
        '',
        '=========================================',
        '',
      ];

      const entries = savedPrompts.map((p, idx) => {
        return [
          `#${idx + 1}. ${p.title} (${p.category})`,
          `Aspect Ratio: ${p.aspectRatio}`,
          `Tools: ${p.compatibleTools.join(', ')}`,
          'PROMPT:',
          p.prompt,
          p.negativePrompt ? `NEGATIVE PROMPT:\n${p.negativePrompt}` : '',
          `Tags: ${p.tags.join(', ')}`,
          '-----------------------------------------',
          '',
        ].filter(Boolean).join('\r\n');
      });

      const fullText = header.join('\r\n') + entries.join('\r\n');
      const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fx-prompty-favorites-${Date.now()}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      showToast('Exported entire collection as TXT! 📂', 'success');
    } catch (e) {
      console.error(e);
      showToast('Export failed', 'error');
    }
  };

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-rose-400 mb-2">
            <Heart className="w-5 h-5 fill-current" />
            <span className="text-xs font-bold tracking-wider uppercase">Saved Collection</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Favorites &amp; Saved Prompts
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {savedPrompts.length} {savedPrompts.length === 1 ? 'prompt' : 'prompts'} saved in your local library
          </p>
        </div>

        {savedPrompts.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportAll}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-dark-900 hover:bg-dark-850 border border-slate-700 text-slate-200 text-xs sm:text-sm font-semibold transition-all shadow-sm"
            >
              <FileText className="w-4 h-4 text-purple-400" />
              <span>Export All (.TXT)</span>
            </button>
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-glow-purple"
            >
              <Compass className="w-4 h-4" />
              <span>Find More</span>
            </Link>
          </div>
        )}
      </div>

      {/* Grid of Saved Prompts */}
      {savedPrompts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedPrompts.map((prompt) => {
            const isCopied = copiedId === prompt.id;

            return (
              <div
                key={prompt.id}
                className="bg-dark-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg hover:border-purple-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Thumbnail Banner */}
                  <Link to={`/prompt/${prompt.id}`} className="block relative aspect-[16/9] overflow-hidden bg-dark-950">
                    <img
                      src={prompt.thumbnailUrl}
                      alt={prompt.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-black/30" />
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-semibold text-purple-300 border border-white/10 uppercase tracking-wider">
                      {prompt.category}
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFavorite(prompt.id);
                      }}
                      title="Remove from favorites"
                      className="absolute top-2.5 right-2.5 p-2 rounded-full bg-black/60 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors border border-white/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </Link>

                  {/* Content */}
                  <div className="p-4 space-y-2">
                    <Link to={`/prompt/${prompt.id}`}>
                      <h3 className="text-base font-bold text-white hover:text-purple-300 transition-colors line-clamp-1">
                        {prompt.title}
                      </h3>
                    </Link>

                    {/* Full Prompt Preview Box */}
                    <div className="bg-dark-950 rounded-xl p-3 border border-slate-800/80 text-xs font-mono text-slate-300 line-clamp-3 select-all leading-relaxed">
                      {prompt.prompt}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-4 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopy(prompt.id, prompt.prompt)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-semibold transition-colors"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      onClick={() => handleDownload(prompt)}
                      title="Download TXT"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>

                  <Link
                    to={`/prompt/${prompt.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                  >
                    <span>Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="py-20 text-center max-w-lg mx-auto bg-dark-900/40 border border-slate-800/80 rounded-3xl p-8 my-8">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center mb-5">
            <Heart className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
            Your creative collection starts here.
          </h2>
          <p className="text-sm text-slate-400 mb-8 leading-relaxed max-w-md mx-auto">
            {!isAuthenticated
              ? 'Sign in to save prompts to your personal collection, sync them across devices, and export them anytime.'
              : 'Save prompts you love and find them anytime. Copy, export, and manage your custom prompts across sessions.'}
          </p>
          {!isAuthenticated ? (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-glow-purple transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Sign In to Save Favorites</span>
              </Link>
              <Link
                to="/explore"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-dark-850 hover:bg-dark-800 border border-slate-700 text-slate-300 font-semibold text-sm transition-all"
              >
                <Compass className="w-4 h-4" />
                <span>Explore Prompts</span>
              </Link>
            </div>
          ) : (
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-glow-purple transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Explore Prompts Now</span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
};
