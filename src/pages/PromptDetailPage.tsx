import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { copyToClipboard } from '../utils/clipboard';
import { exportPromptToTxt } from '../utils/exportPrompt';
import { sharePrompt } from '../utils/sharePrompt';
import { playClickSound, playPopSound, playSuccessChime } from '../utils/sound';
import { normalizeCategory } from '../data/categories';
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
  LogIn,
  Film,
} from 'lucide-react';

export const PromptDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { allPrompts, isFavorite, toggleFavorite, showToast, isFirestoreLoading } = useFavorites();
  const { user, isAuthenticated, unlockPromptForUser } = useAuth();

  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedNegative, setCopiedNegative] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  // Rewarded Ad Gating Modal State
  const [adModalOpen, setAdModalOpen] = useState(false);
  const [adCountdown, setAdCountdown] = useState(5);

  // Find prompt
  const prompt = allPrompts.find((p) => p.id === id);

  // Check if current logged-in user's unlockedPrompts array from Firestore contains this promptId
  const isUnlocked = Boolean(
    isAuthenticated &&
      prompt &&
      user?.unlockedPrompts &&
      user.unlockedPrompts.includes(prompt.id)
  );

  // Rewarded Ad 5-Second Countdown Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (adModalOpen) {
      setAdCountdown(5);
      timer = setInterval(() => {
        setAdCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            playSuccessChime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [adModalOpen]);

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

  // Trigger Rewarded Ad workflow
  const handleStartWatchAd = () => {
    if (!isAuthenticated) {
      playClickSound();
      showToast('Pehle Sign In karein! 🔒', 'info');
      navigate('/login');
      return;
    }

    playClickSound();

    // Google Rewarded Ad SDK check if present in runtime
    if (typeof (window as any).showGoogleRewardedAd === 'function') {
      try {
        (window as any).showGoogleRewardedAd({
          onRewarded: () => {
            handleClaimReward();
          },
          onError: () => {
            setAdCountdown(5);
            setAdModalOpen(true);
          },
        });
        return;
      } catch {
        // Fallback to internal countdown modal
      }
    }

    setAdCountdown(5);
    setAdModalOpen(true);
  };

  // Claim reward & unlock prompt in Firestore (users/{uid} -> unlockedPrompts: arrayUnion(prompt.id))
  const handleClaimReward = async () => {
    if (!prompt) return;
    playSuccessChime();

    // Store unlocked prompt directly in Firestore users collection
    await unlockPromptForUser(prompt.id);

    setAdModalOpen(false);
    showToast('🎉 Prompt Unlocked! Full prompt revealed & ready to copy.', 'success');
  };

  // Copy Prompt Handler (2-step gated)
  const handleCopyPrompt = async () => {
    // 1. STATE 1: Unauthenticated
    if (!isAuthenticated) {
      playClickSound();
      showToast('Prompt copy karne ke liye pehle Sign In karein! 🔒', 'error');
      navigate('/login');
      return;
    }

    // 2. STATE 2: Authenticated, but not yet unlocked
    if (!isUnlocked) {
      handleStartWatchAd();
      return;
    }

    // 3. STATE 3: Prompt is unlocked
    const ok = await copyToClipboard(prompt.prompt);
    if (ok) {
      playSuccessChime();
      setCopiedPrompt(true);
      showToast('Prompt Copied to Clipboard! 📋', 'success');
      setTimeout(() => setCopiedPrompt(false), 2200);
    } else {
      showToast('Unable to copy automatically. Please select and copy the text.', 'error');
    }
  };

  // Copy Negative Prompt Handler (2-step gated)
  const handleCopyNegative = async () => {
    if (!prompt.negativePrompt) return;

    if (!isAuthenticated) {
      playClickSound();
      showToast('Negative prompt copy karne ke liye pehle Sign In karein! 🔒', 'error');
      navigate('/login');
      return;
    }

    if (!isUnlocked) {
      handleStartWatchAd();
      return;
    }

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

  // Download TXT Handler (2-step gated)
  const handleDownload = () => {
    if (!isAuthenticated) {
      playClickSound();
      showToast('Prompt download karne ke liye pehle Sign In karein! 🔒', 'error');
      navigate('/login');
      return;
    }

    if (!isUnlocked) {
      handleStartWatchAd();
      return;
    }

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
    .filter((p) => normalizeCategory(p.category) === normalizeCategory(prompt.category) && p.id !== prompt.id)
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

          {/* Download TXT Button (Locked behind auth & ad) */}
          <button
            onClick={handleDownload}
            aria-label="Download prompt as TXT"
            title={
              !isAuthenticated
                ? 'Sign in to download'
                : !isUnlocked
                ? 'Watch ad to unlock download'
                : 'Download prompt as TXT'
            }
            className="p-2.5 rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-dark-850 transition-colors shadow-sm dark:shadow-none cursor-pointer relative"
          >
            <Download className="w-4 h-4" />
            {(!isAuthenticated || !isUnlocked) && (
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

          {/* STATE 1 Notice: User is Guest / Anonymous */}
          {!isAuthenticated && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-200">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Prompt copy aur download features sirf registered creators ke liye open hain.</span>
              </div>
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-xl bg-amber-500 text-black font-bold text-xs shrink-0 hover:bg-amber-400 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            </div>
          )}

          {/* STATE 2 Notice: User is Logged In, but Prompt is Locked */}
          {isAuthenticated && !isUnlocked && (
            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between gap-3 text-xs text-purple-900 dark:text-purple-200">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <span>Watch a quick short ad to permanently unlock this prompt for your account.</span>
              </div>
              <button
                onClick={handleStartWatchAd}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shrink-0 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
              >
                <Film className="w-3.5 h-3.5" />
                <span>Watch Ad</span>
              </button>
            </div>
          )}

          {/* STATE 3 Notice: Prompt Unlocked */}
          {isAuthenticated && isUnlocked && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-2 text-xs text-emerald-800 dark:text-emerald-300">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-semibold">Prompt Unlocked • Full Access Granted</span>
              </div>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">Ready to Copy</span>
            </div>
          )}
        </div>

        {/* Right Column: Prompt Details & Copy Wall */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400 font-semibold mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20">
                {normalizeCategory(prompt.category)}
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

          {/* MAIN PROMPT COPY BOX (2-step gated) */}
          <div className="bg-white dark:bg-dark-900/90 border border-purple-200 dark:border-purple-500/30 rounded-3xl p-5 sm:p-6 shadow-sm dark:shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Image Generation Prompt
              </span>

              {/* Action Button: Adapts to State 1 (Sign In), State 2 (Watch Ad), State 3 (Copy Prompt) */}
              <button
                onClick={handleCopyPrompt}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-xs font-bold transition-all active:scale-95 shadow-md cursor-pointer ${
                  !isAuthenticated
                    ? 'bg-slate-700 hover:bg-slate-600 shadow-slate-700/20'
                    : !isUnlocked
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 shadow-pink-600/30'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-600/30'
                }`}
              >
                {copiedPrompt ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Copied!
                  </>
                ) : !isAuthenticated ? (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Sign In to Copy</span>
                  </>
                ) : !isUnlocked ? (
                  <>
                    <Film className="w-3.5 h-3.5" />
                    <span>🔒 Watch Ad to Unlock</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>📋 Copy Prompt</span>
                  </>
                )}
              </button>
            </div>

            {/* Prompt Text Box with Guest Blur-to-Lock Overlay or Rewarded Ad Lock */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800/80">
              {/* Actual Prompt Text (Blurred & non-selectable when locked) */}
              <div
                onClick={handleCopyPrompt}
                title={
                  !isAuthenticated
                    ? 'Sign in to reveal and copy'
                    : !isUnlocked
                    ? 'Watch short ad to unlock prompt'
                    : 'Click to copy prompt'
                }
                className={`p-4 sm:p-5 text-sm sm:text-base leading-relaxed font-mono whitespace-pre-wrap break-words max-h-96 overflow-y-auto transition-all ${
                  isAuthenticated && isUnlocked
                    ? 'bg-slate-50 dark:bg-dark-950 text-slate-900 dark:text-slate-100 select-all cursor-pointer hover:border-purple-500/50'
                    : 'bg-slate-100 dark:bg-dark-950 text-slate-400 dark:text-slate-300 filter blur-[6px] select-none pointer-events-none opacity-30'
                }`}
              >
                {prompt.prompt}
              </div>

              {/* STATE 1: Centered Lock Badge Overlay for Guests */}
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
                    <span>→] Sign In to Unlock Prompt →</span>
                  </Link>
                </div>
              )}

              {/* STATE 2: Rewarded Ad Lock Overlay for Logged-In Users */}
              {isAuthenticated && !isUnlocked && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-5 bg-white/85 dark:bg-dark-950/80 backdrop-blur-sm text-center select-none animate-in fade-in duration-200">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500/20 to-purple-600/20 text-pink-500 dark:text-pink-400 border border-pink-500/30 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(236,72,153,0.35)] animate-pulse-subtle">
                    <Film className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-1.5">
                    <span>🎬 Watch Short Ad to Unlock Prompt</span>
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mb-4 leading-relaxed">
                    Watch a quick short ad to reveal the prompt text and unlock 1-tap copy.
                  </p>
                  <button
                    onClick={handleStartWatchAd}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/35 hover:shadow-purple-600/55 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Film className="w-3.5 h-3.5" />
                    <span>🎬 Watch Ad to Unlock Prompt →</span>
                  </button>
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>{prompt.prompt.length} characters</span>
              <span className="text-purple-600 dark:text-purple-400 text-[11px] font-medium">
                {!isAuthenticated
                  ? '🔒 Protected prompt'
                  : !isUnlocked
                  ? '🎬 Watch short ad to unlock copy'
                  : '✅ Prompt Unlocked • Click box or button to 1-tap copy'}
              </span>
            </div>
          </div>

          {/* OPTIONAL NEGATIVE PROMPT (Gated) */}
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
                  ) : !isAuthenticated ? (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Sign In</span>
                    </>
                  ) : !isUnlocked ? (
                    <>
                      <Film className="w-3.5 h-3.5" />
                      <span>Watch Ad</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Negative</span>
                    </>
                  )}
                </button>
              </div>

              {/* Negative prompt box with blur when not unlocked */}
              <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800/80">
                <div
                  onClick={handleCopyNegative}
                  className={`p-3.5 text-xs sm:text-sm font-mono leading-relaxed whitespace-pre-wrap transition-all ${
                    isAuthenticated && isUnlocked
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

                {isAuthenticated && !isUnlocked && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center p-3 bg-white/85 dark:bg-dark-950/80 backdrop-blur-sm select-none text-center">
                    <button
                      onClick={handleStartWatchAd}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/30 text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Film className="w-3.5 h-3.5" />
                      <span>🎬 Watch Ad to Unlock Negative Prompt</span>
                    </button>
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
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" /> More in {normalizeCategory(prompt.category)}
            </h2>
            <Link
              to={`/explore?q=${encodeURIComponent(normalizeCategory(prompt.category))}`}
              onClick={(e) => {
                e.stopPropagation();
                playClickSound();
              }}
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

      {/* Rewarded Ad Countdown Modal */}
      {adModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col gap-4">
            {/* Top Ad Header Bar */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-400 text-black tracking-wider">
                  AD
                </span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Sponsored Video Reward
                </span>
              </div>

              {/* Countdown Badge */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-dark-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-purple-600 dark:text-purple-400">
                {adCountdown > 0 ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                    <span>Reward in {adCountdown}s</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-500 font-bold">Reward Ready!</span>
                  </>
                )}
              </div>
            </div>

            {/* Animated Progress Line */}
            <div className="w-full bg-slate-100 dark:bg-dark-950 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-600 via-pink-500 to-emerald-500 transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${((5 - adCountdown) / 5) * 100}%` }}
              />
            </div>

            {/* Ad Showcase Card */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-purple-900 via-slate-900 to-black p-6 text-white text-center flex flex-col items-center justify-center min-h-[190px] border border-purple-500/30 shadow-inner">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-3 shadow-lg">
                <Sparkles className="w-7 h-7 text-amber-300 animate-pulse" />
              </div>
              <h3 className="text-base font-extrabold tracking-tight mb-1 text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-pink-200">
                FX Prompty Pro
              </h3>
              <p className="text-xs text-purple-200/80 max-w-xs leading-relaxed mb-2">
                Discover 100,000+ curated generative AI image prompts for Midjourney, Flux &amp; DALL-E 3.
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-amber-300 font-semibold uppercase tracking-wider bg-black/40 px-2.5 py-1 rounded-full border border-amber-300/30">
                <span>★ ★ ★ ★ ★ Rated 4.9 by 25k+ Creators</span>
              </div>
            </div>

            {/* Action / Claim Button */}
            <div className="pt-2">
              {adCountdown > 0 ? (
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                  <span>Watching short ad ({adCountdown}s remaining)...</span>
                  <button
                    onClick={() => setAdModalOpen(false)}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline cursor-pointer"
                  >
                    Skip (No Reward)
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleClaimReward}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold text-sm shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 animate-bounce-subtle"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>🎉 Claim &amp; Reveal Prompt Now!</span>
                </button>
              )}
            </div>
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
