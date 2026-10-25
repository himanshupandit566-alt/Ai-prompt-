import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { copyToClipboard } from '../utils/clipboard';
import { exportPromptToTxt } from '../utils/exportPrompt';
import { sharePrompt } from '../utils/sharePrompt';
import { playClickSound, playPopSound, playSuccessChime } from '../utils/sound';
import { ImageCard } from '../components/ImageCard';
import {
  ArrowLeft,
  Heart,
  Copy,
  Check,
  Download,
  Share2,
  Sparkles,
  Cpu,
  AlertCircle,
  Maximize2,
  Lock,
  LogIn
} from 'lucide-react';

export const PromptDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { allPrompts, isFavorite, toggleFavorite, showToast, isFirestoreLoading } = useFavorites();
  const { isAuthenticated } = useAuth();

  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedNegative, setCopiedNegative] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  // Find prompt
  const prompt = allPrompts.find((p) => p.id === id);

  // While Firestore prompts are initially loading, show a loading placeholder
  if (isFirestoreLoading && !prompt) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4" />
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
          Loading prompt details...
        </p>
      </div>
    );
  }

  // If prompt not found, render user-friendly error state
  if (!prompt) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Prompt Not Found</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
          The prompt ID &ldquo;{id}&rdquo; does not exist or may have been removed.
        </p>
        <button
          onClick={() => {
            playClickSound();
            navigate('/explore');
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-all shadow-glow-purple cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Gallery
        </button>
      </div>
    );
  }

  const favorited = isFavorite(prompt.id);

  // Authentication Wall Check
  const checkAuthOrRedirect = (actionName: string = 'Prompt copy'): boolean => {
    if (!isAuthenticated) {
      playClickSound();
      showToast(`${actionName} karne ke liye pehle Sign In karein! 🔒`, 'error');
      navigate('/login');
      return false;
    }
    return true;
  };

  const handleCopyPrompt = async () => {
    if (!checkAuthOrRedirect('Prompt copy')) return;

    const ok = await copyToClipboard(prompt.prompt);
    if (ok) {
      playSuccessChime();
      setCopiedPrompt(true);
      showToast('Prompt copied successfully! 📋', 'success');
      setTimeout(() => setCopiedPrompt(false), 2200);
    } else {
      showToast('Unable to copy automatically. Please select and copy the text.', 'error');
    }
  };

  const handleCopyNegative = async () => {
    if (!prompt.negativePrompt) return;
    if (!checkAuthOrRedirect('Negative prompt copy')) return;

    const ok = await copyToClipboard(prompt.negativePrompt);
    if (ok) {
      playSuccessChime();
      setCopiedNegative(true);
      showToast('Negative prompt copied! 🚫', 'info');
      setTimeout(() => setCopiedNegative(false), 2200);
    } else {
      showToast('Unable to copy negative prompt.', 'error');
    }
  };

  const handleDownload = () => {
    if (!checkAuthOrRedirect('Prompt download')) return;

    playClickSound();
    const success = exportPromptToTxt(prompt);
    if (success) {
      showToast('Prompt downloaded as TXT file! 💾', 'success');
    } else {
      showToast('Unable to download the file. Please try again.', 'error');
    }
  };

  const handleShare = async () => {
    playClickSound();
    const res = await sharePrompt(prompt);
    if (res.success) {
      showToast(res.message, 'success');
    } else if (res.method !== 'cancelled') {
      showToast(res.message, 'error');
    }
  };

  // Related prompts from the same category
  const relatedPrompts = allPrompts
    .filter((p) => p.category === prompt.category && p.id !== prompt.id)
    .slice(0, 4);

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      {/* Top Breadcrumb & Navigation Bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => {
            playClickSound();
            navigate(-1);
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-dark-850 text-xs sm:text-sm font-medium transition-all shadow-sm dark:shadow-none cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Gallery</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Native Share Button */}
          <button
            onClick={handleShare}
            aria-label="Share prompt"
            title="Share prompt title & link"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-dark-900 hover:bg-slate-50 dark:hover:bg-dark-850 border border-slate-200 dark:border-slate-800 hover:border-purple-500/40 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition-all shadow-sm cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="hidden sm:inline">Share</span>
          </button>

          {/* Download TXT Button (Locked behind auth) */}
          <button
            onClick={handleDownload}
            aria-label="Download prompt as TXT"
            title={isAuthenticated ? 'Download prompt as TXT' : 'Sign in to download'}
            className="p-2.5 rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-dark-850 transition-colors shadow-sm dark:shadow-none cursor-pointer relative"
          >
            <Download className="w-4 h-4" />
            {!isAuthenticated && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 rounded-full flex items-center justify-center text-[9px] text-black font-bold">
                🔒
              </span>
            )}
          </button>

          {/* Favorite Toggle */}
          <button
            onClick={() => {
              playPopSound();
              toggleFavorite(prompt.id);
            }}
            aria-label={favorited ? 'Remove from favorites' : 'Save to favorites'}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer ${
              favorited
                ? 'bg-rose-500 text-white shadow-rose-500/20'
                : 'bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-dark-850'
            }`}
          >
            <Heart className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`} />
            <span>{favorited ? 'Favorited' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Visual Presentation + Metadata */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        {/* Left Column: Image Viewer */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="relative group rounded-3xl overflow-hidden bg-slate-100 dark:bg-dark-900 border border-slate-200 dark:border-slate-800/80 shadow-md dark:shadow-2xl flex items-center justify-center">
            <img
              src={prompt.previewUrl}
              alt={prompt.title}
              className="w-full h-auto max-h-[75vh] object-contain rounded-2xl select-none"
            />

            {/* Click to Expand Button */}
            <button
              onClick={() => {
                playPopSound();
                setImageModalOpen(true);
              }}
              title="View full resolution"
              className="absolute bottom-4 right-4 p-2.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/90 cursor-pointer shadow-lg"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Prompt Protection Info Notice if user is Guest */}
          {!isAuthenticated && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-200">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Prompt copy aur download features sirf registered creators ke liye open hain.</span>
              </div>
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-xl bg-amber-500 text-black font-bold text-xs shrink-0 hover:bg-amber-400 transition-colors flex items-center gap-1"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            </div>
          )}
        </div>

        {/* Right Column: Prompt Details & Copy Wall */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400 font-semibold mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20">
                {prompt.category}
              </span>
              <span>•</span>
              <span className="text-slate-500 dark:text-slate-400 font-normal">Aspect Ratio {prompt.aspectRatio}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mb-2">
              {prompt.title}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              {prompt.description}
            </p>
          </div>

          {/* MAIN PROMPT COPY BOX (Protected) */}
          <div className="bg-white dark:bg-dark-900/90 border border-purple-200 dark:border-purple-500/30 rounded-3xl p-5 sm:p-6 shadow-sm dark:shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Image Generation Prompt
              </span>

              {/* Copy Button with Auth Wall */}
              <button
                onClick={handleCopyPrompt}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all active:scale-95 shadow-md shadow-purple-600/30 cursor-pointer"
              >
                {copiedPrompt ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Copied!
                  </>
                ) : (
                  <>
                    {isAuthenticated ? <Copy className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    <span>{isAuthenticated ? 'Copy Prompt' : 'Sign In to Copy'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Prompt Text Box with Guest Blur-to-Lock Overlay */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800/80">
              {/* Actual Prompt Text (Blurred & non-selectable when unauthenticated) */}
              <div
                onClick={handleCopyPrompt}
                title={isAuthenticated ? 'Click to copy prompt' : 'Sign in to reveal and copy'}
                className={`p-4 sm:p-5 text-sm sm:text-base leading-relaxed font-mono whitespace-pre-wrap break-words max-h-96 overflow-y-auto transition-all ${
                  isAuthenticated
                    ? 'bg-slate-50 dark:bg-dark-950 text-slate-900 dark:text-slate-100 select-all cursor-pointer hover:border-purple-500/50'
                    : 'bg-slate-100 dark:bg-dark-950 text-slate-400 dark:text-slate-300 filter blur-[6px] select-none pointer-events-none opacity-30'
                }`}
              >
                {prompt.prompt}
              </div>

              {/* Centered Lock Badge Overlay for Guests */}
              {!isAuthenticated && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-5 bg-white/80 dark:bg-dark-950/75 backdrop-blur-sm text-center select-none">
                  <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(168,85,247,0.35)] animate-pulse-subtle">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-1.5">
                    <span>🔒 Sign In to Reveal &amp; Copy Full Prompt</span>
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mb-4 leading-relaxed">
                    Prompt details and 1-tap copy are locked for authenticated creators. Sign in or register in seconds to reveal the full text.
                  </p>
                  <Link
                    to="/login"
                    onClick={() => playClickSound()}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/35 hover:shadow-purple-600/55 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In to Unlock Prompt →</span>
                  </Link>
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>{prompt.prompt.length} characters</span>
              <span className="text-purple-600 dark:text-purple-400 text-[11px] font-medium">
                {isAuthenticated ? 'Click box or button to 1-tap copy' : '🔒 Protected prompt'}
              </span>
            </div>
          </div>

          {/* OPTIONAL NEGATIVE PROMPT */}
          {prompt.negativePrompt && prompt.negativePrompt.trim().length > 0 && (
            <div className="bg-white dark:bg-dark-900/90 border border-rose-200 dark:border-rose-950/40 rounded-2xl p-5 shadow-sm dark:shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  Negative Prompt (What to Avoid)
                </span>
                <button
                  onClick={handleCopyNegative}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-dark-850 hover:bg-rose-100 dark:hover:bg-dark-800 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 hover:text-rose-900 dark:hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  {copiedNegative ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Copied!
                    </>
                  ) : (
                    <>
                      {isAuthenticated ? <Copy className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      <span>{isAuthenticated ? 'Copy Negative' : 'Sign In'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Negative prompt box with blur when not authenticated */}
              <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800/80">
                <div
                  onClick={handleCopyNegative}
                  className={`p-3.5 text-xs sm:text-sm font-mono leading-relaxed whitespace-pre-wrap transition-all ${
                    isAuthenticated
                      ? 'bg-slate-50 dark:bg-dark-950 text-slate-800 dark:text-slate-300 select-all cursor-pointer hover:border-rose-500/40'
                      : 'bg-slate-100 dark:bg-dark-950 text-slate-400 dark:text-slate-300 filter blur-[6px] select-none pointer-events-none opacity-30'
                  }`}
                >
                  {prompt.negativePrompt}
                </div>

                {!isAuthenticated && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center p-3 bg-white/80 dark:bg-dark-950/75 backdrop-blur-sm select-none text-center">
                    <Link
                      to="/login"
                      onClick={() => playClickSound()}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/30 text-rose-700 dark:text-rose-300 hover:text-rose-900 dark:hover:text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Sign In to Reveal Negative Prompt</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* COMPATIBLE AI TOOLS */}
          {prompt.compatibleTools.length > 0 && (
            <div className="bg-white dark:bg-dark-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm dark:shadow-none">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" /> Compatible AI Generators
              </span>
              <div className="flex flex-wrap gap-2">
                {prompt.compatibleTools.map((tool) => (
                  <span
                    key={tool}
                    className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-dark-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* TAGS */}
          <div className="flex items-center gap-2 flex-wrap pt-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tags:</span>
            {prompt.tags.map((tag) => (
              <Link
                key={tag}
                to={`/explore?q=${encodeURIComponent(tag)}`}
                onClick={() => playClickSound()}
                className="px-3 py-1 rounded-full bg-white dark:bg-dark-900 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-slate-200 dark:border-slate-800 hover:border-purple-500/40 text-xs text-slate-600 dark:text-slate-300 hover:text-purple-700 dark:hover:text-purple-300 shadow-sm dark:shadow-none transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Related Prompts Section */}
      {relatedPrompts.length > 0 && (
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" /> More in {prompt.category}
            </h2>
            <Link
              to={`/category/${prompt.category.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => playClickSound()}
              className="text-xs sm:text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold"
            >
              View all →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {relatedPrompts.map((related) => (
              <ImageCard key={related.id} prompt={related} />
            ))}
          </div>
        </div>
      )}

      {/* Fullscreen Image Preview Modal */}
      {imageModalOpen && (
        <div
          onClick={() => setImageModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-5xl max-h-[90vh] modal-spring">
            <img
              src={prompt.previewUrl}
              alt={prompt.title}
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            />
            <p className="text-center text-xs text-slate-400 mt-3 font-medium">
              {prompt.title} • Tap anywhere to close
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
