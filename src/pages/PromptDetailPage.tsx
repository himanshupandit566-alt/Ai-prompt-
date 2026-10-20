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
  const { allPrompts, isFavorite, toggleFavorite, showToast } = useFavorites();
  const { isAuthenticated } = useAuth();

  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedNegative, setCopiedNegative] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  // Find prompt
  const prompt = allPrompts.find((p) => p.id === id);

  // If prompt not found, render user-friendly error state
  if (!prompt) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Prompt Not Found</h1>
        <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
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
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-dark-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-dark-850 text-xs sm:text-sm font-medium transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Gallery</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Share Button */}
          <button
            onClick={handleShare}
            aria-label="Share prompt"
            className="p-2.5 rounded-xl bg-dark-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-dark-850 transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Download TXT Button (Locked behind auth) */}
          <button
            onClick={handleDownload}
            aria-label="Download prompt as TXT"
            title={isAuthenticated ? 'Download prompt as TXT' : 'Sign in to download'}
            className="p-2.5 rounded-xl bg-dark-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-dark-850 transition-colors cursor-pointer relative"
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
              playPopSound(0.06);
              toggleFavorite(prompt.id);
            }}
            aria-label={favorited ? 'Remove from favorites' : 'Save to favorites'}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer ${
              favorited
                ? 'bg-rose-500 text-white shadow-rose-500/20'
                : 'bg-dark-900 border border-slate-800 text-slate-200 hover:bg-dark-850'
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
          <div className="relative group rounded-3xl overflow-hidden bg-dark-900 border border-slate-800/80 shadow-2xl flex items-center justify-center">
            <img
              src={prompt.previewUrl}
              alt={prompt.title}
              className="w-full h-auto max-h-[75vh] object-contain rounded-2xl select-none"
            />

            {/* Click to Expand Button */}
            <button
              onClick={() => {
                playPopSound(0.05);
                setImageModalOpen(true);
              }}
              title="View full resolution"
              className="absolute bottom-4 right-4 p-2.5 rounded-xl bg-dark-950/80 backdrop-blur-md border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-dark-900 cursor-pointer shadow-lg"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Prompt Protection Info Notice if user is Guest */}
          {!isAuthenticated && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-200">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
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
            <div className="flex items-center gap-2 text-xs text-purple-400 font-semibold mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">
                {prompt.category}
              </span>
              <span>•</span>
              <span className="text-slate-400 font-normal">Aspect Ratio {prompt.aspectRatio}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight mb-2">
              {prompt.title}
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed font-normal">
              {prompt.description}
            </p>
          </div>

          {/* MAIN PROMPT COPY BOX (Protected) */}
          <div className="bg-dark-900/90 border border-purple-500/30 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
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

            {/* Prompt text box with click-to-copy handler */}
            <div
              onClick={handleCopyPrompt}
              title={isAuthenticated ? 'Click to copy prompt' : 'Sign in to copy prompt'}
              className="bg-dark-950 rounded-2xl p-4 border border-slate-800/80 text-slate-100 text-sm sm:text-base leading-relaxed font-mono select-all whitespace-pre-wrap break-words max-h-96 overflow-y-auto cursor-pointer hover:border-purple-500/50 transition-colors"
            >
              {prompt.prompt}
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
              <span>{prompt.prompt.length} characters</span>
              <span className="text-purple-400 text-[11px]">
                {isAuthenticated ? 'Click box or button to 1-tap copy' : 'Sign In required to unlock copy'}
              </span>
            </div>
          </div>

          {/* OPTIONAL NEGATIVE PROMPT */}
          {prompt.negativePrompt && prompt.negativePrompt.trim().length > 0 && (
            <div className="bg-dark-900/90 border border-rose-950/40 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                  Negative Prompt (What to Avoid)
                </span>
                <button
                  onClick={handleCopyNegative}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-850 hover:bg-dark-800 border border-rose-500/30 text-rose-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
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
              <div
                onClick={handleCopyNegative}
                className="bg-dark-950 rounded-xl p-3.5 border border-slate-800/80 text-slate-300 text-xs sm:text-sm font-mono select-all leading-relaxed whitespace-pre-wrap cursor-pointer hover:border-rose-500/40"
              >
                {prompt.negativePrompt}
              </div>
            </div>
          )}

          {/* COMPATIBLE AI TOOLS */}
          {prompt.compatibleTools.length > 0 && (
            <div className="bg-dark-900/60 border border-slate-800 rounded-2xl p-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-400" /> Compatible AI Generators
              </span>
              <div className="flex flex-wrap gap-2">
                {prompt.compatibleTools.map((tool) => (
                  <span
                    key={tool}
                    className="px-3 py-1 rounded-lg bg-dark-950 border border-slate-800 text-xs font-medium text-slate-200"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* TAGS */}
          <div className="flex items-center gap-2 flex-wrap pt-2">
            <span className="text-xs font-semibold text-slate-400">Tags:</span>
            {prompt.tags.map((tag) => (
              <Link
                key={tag}
                to={`/explore?q=${encodeURIComponent(tag)}`}
                onClick={() => playClickSound()}
                className="px-3 py-1 rounded-full bg-dark-900 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/40 text-xs text-slate-300 hover:text-purple-300 transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Related Prompts Section */}
      {relatedPrompts.length > 0 && (
        <div className="mt-12 pt-8 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" /> More in {prompt.category}
            </h2>
            <Link
              to={`/category/${prompt.category.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => playClickSound()}
              className="text-xs sm:text-sm text-purple-400 hover:text-purple-300 font-semibold"
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
