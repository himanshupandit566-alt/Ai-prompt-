import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';
import { copyToClipboard } from '../utils/clipboard';
import { exportPromptToTxt } from '../utils/exportPrompt';
import { sharePrompt } from '../utils/sharePrompt';
import { ImageCard } from '../components/ImageCard';
import {
  ArrowLeft,
  Heart,
  Copy,
  Check,
  Download,
  Share2,
  Sparkles,
  Layers,
  Ratio,
  Cpu,
  Calendar,
  AlertCircle,
  Eye,
  Maximize2
} from 'lucide-react';

export const PromptDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { allPrompts, isFavorite, toggleFavorite, showToast } = useFavorites();

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
          onClick={() => navigate('/explore')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-all shadow-glow-purple"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Gallery
        </button>
      </div>
    );
  }

  const favorited = isFavorite(prompt.id);

  const handleCopyPrompt = async () => {
    const ok = await copyToClipboard(prompt.prompt);
    if (ok) {
      setCopiedPrompt(true);
      showToast('Prompt copied successfully! 📋', 'success');
      setTimeout(() => setCopiedPrompt(false), 2200);
    } else {
      showToast('Unable to copy automatically. Please select and copy the text.', 'error');
    }
  };

  const handleCopyNegative = async () => {
    if (!prompt.negativePrompt) return;
    const ok = await copyToClipboard(prompt.negativePrompt);
    if (ok) {
      setCopiedNegative(true);
      showToast('Negative prompt copied! 🚫', 'info');
      setTimeout(() => setCopiedNegative(false), 2200);
    } else {
      showToast('Unable to copy negative prompt.', 'error');
    }
  };

  const handleDownload = () => {
    const success = exportPromptToTxt(prompt);
    if (success) {
      showToast('Prompt downloaded as TXT file! 💾', 'success');
    } else {
      showToast('Unable to download the file. Please try again.', 'error');
    }
  };

  const handleShare = async () => {
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
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-dark-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-dark-850 text-sm font-medium transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Gallery</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Share Button */}
          <button
            onClick={handleShare}
            aria-label="Share prompt"
            className="p-2.5 rounded-xl bg-dark-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-dark-850 transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Download TXT Button */}
          <button
            onClick={handleDownload}
            aria-label="Download prompt as TXT"
            className="p-2.5 rounded-xl bg-dark-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-dark-850 transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Favorite Toggle */}
          <button
            onClick={() => toggleFavorite(prompt.id)}
            aria-label={favorited ? 'Remove from favorites' : 'Save to favorites'}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm ${
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

      {/* Main Two-Column Layout (Desktop) / Stacked (Mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Large Image Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative group rounded-3xl overflow-hidden bg-dark-900 border border-slate-800 shadow-2xl">
            <img
              src={prompt.previewUrl}
              alt={prompt.title}
              className="w-full h-auto object-cover max-h-[640px] transition-transform duration-500 group-hover:scale-[1.02]"
            />
            {/* Fullscreen Preview Trigger */}
            <button
              onClick={() => setImageModalOpen(true)}
              aria-label="View Fullscreen"
              className="absolute top-4 right-4 p-2.5 rounded-xl bg-black/60 backdrop-blur-md text-white border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-dark-950/80 backdrop-blur-md border border-white/10 text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-purple-400" />
              <span>Illustrative sample image</span>
            </div>
          </div>

          {/* Image Meta Specifications */}
          <div className="bg-dark-900/80 border border-slate-800/80 rounded-2xl p-4 grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-xl bg-dark-950 border border-slate-800/60">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Aspect Ratio</span>
              <span className="text-sm font-bold text-purple-400 mt-0.5 inline-flex items-center gap-1">
                <Ratio className="w-3.5 h-3.5" /> {prompt.aspectRatio}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-dark-950 border border-slate-800/60">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Category</span>
              <span className="text-xs font-semibold text-slate-200 mt-1 truncate block">
                {prompt.category}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-dark-950 border border-slate-800/60">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Added</span>
              <span className="text-xs font-semibold text-slate-300 mt-1 inline-flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" /> {prompt.createdAt}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Prompt Information and Actions */}
        <div className="lg:col-span-7 space-y-6">
          {/* Header Info */}
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Link
                to={`/category/${prompt.category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold hover:bg-purple-500/20 transition-colors"
              >
                <Layers className="w-3 h-3" />
                <span>{prompt.category}</span>
              </Link>
              {prompt.featured && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
                  <Sparkles className="w-3 h-3" /> Featured Prompt
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {prompt.title}
            </h1>
            <p className="text-sm sm:text-base text-slate-300 mt-2 leading-relaxed">
              {prompt.description}
            </p>
          </div>

          {/* FULL PROMPT BOX */}
          <div className="bg-dark-900 border border-slate-700/80 rounded-2xl p-5 shadow-xl relative group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Image Generation Prompt
              </span>
              <button
                onClick={handleCopyPrompt}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all active:scale-95 shadow-md"
              >
                {copiedPrompt ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy Prompt
                  </>
                )}
              </button>
            </div>

            {/* Complete, fully readable prompt container with whitespace preserved */}
            <div className="bg-dark-950 rounded-xl p-4 border border-slate-800/80 text-slate-100 text-sm sm:text-base leading-relaxed font-mono select-all whitespace-pre-wrap break-words max-h-96 overflow-y-auto">
              {prompt.prompt}
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
              <span>{prompt.prompt.length} characters</span>
              <span className="text-purple-400 text-[11px]">Click box or button to copy</span>
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
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-850 hover:bg-dark-800 border border-rose-500/30 text-rose-300 hover:text-white text-xs font-semibold transition-colors"
                >
                  {copiedNegative ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Negative
                    </>
                  )}
                </button>
              </div>
              <div className="bg-dark-950 rounded-xl p-3.5 border border-slate-800/80 text-slate-300 text-xs sm:text-sm font-mono select-all leading-relaxed whitespace-pre-wrap">
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
                className="px-2.5 py-1 rounded-lg bg-dark-850 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/40 text-xs text-slate-300 hover:text-purple-300 transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>

          {/* ACTION BUTTON TOOLBAR */}
          <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={handleCopyPrompt}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-bold shadow-glow-purple transition-all active:scale-95"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Prompt</span>
            </button>

            <button
              onClick={() => toggleFavorite(prompt.id)}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all active:scale-95 ${
                favorited
                  ? 'bg-rose-500 border-rose-500 text-white'
                  : 'bg-dark-900 border-slate-700 hover:bg-dark-850 text-slate-200'
              }`}
            >
              <Heart className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`} />
              <span>{favorited ? 'Favorited' : 'Favorite'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-dark-900 hover:bg-dark-850 border border-slate-700 text-slate-200 text-sm font-semibold transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download TXT</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-dark-900 hover:bg-dark-850 border border-slate-700 text-slate-200 text-sm font-semibold transition-all active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* RELATED PROMPTS SECTION */}
      {relatedPrompts.length > 0 && (
        <section className="mt-16 pt-10 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                More in {prompt.category}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Explore similar styles and alternative creative interpretations
              </p>
            </div>
            <Link
              to={`/category/${prompt.category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
              className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
            >
              View All →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {relatedPrompts.map((item) => (
              <ImageCard key={item.id} prompt={item} />
            ))}
          </div>
        </section>
      )}

      {/* FULLSCREEN IMAGE MODAL */}
      {imageModalOpen && (
        <div
          onClick={() => setImageModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <img
            src={prompt.previewUrl}
            alt={prompt.title}
            className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
