import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Copy, Check, Sparkles, Image as ImageIcon } from 'lucide-react';
import { PromptItem } from '../types/prompt';
import { useFavorites } from '../context/FavoritesContext';
import { copyToClipboard } from '../utils/clipboard';

interface ImageCardProps {
  prompt: PromptItem;
  priority?: boolean;
}

export const ImageCard: React.FC<ImageCardProps> = ({ prompt, priority = false }) => {
  const { isFavorite, toggleFavorite, showToast } = useFavorites();
  const [copied, setCopied] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const favorited = isFavorite(prompt.id);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const ok = await copyToClipboard(prompt.prompt);
    if (ok) {
      setCopied(true);
      showToast('Prompt copied to clipboard! ✨', 'success');
      setTimeout(() => setCopied(false), 2000);
    } else {
      showToast('Could not copy automatically', 'error');
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(prompt.id);
  };

  // Determine aspect ratio class
  const getAspectRatioClass = (ratio: string) => {
    switch (ratio) {
      case '1:1':
        return 'aspect-square';
      case '4:5':
        return 'aspect-[4/5]';
      case '3:4':
        return 'aspect-[3/4]';
      case '9:16':
        return 'aspect-[9/16]';
      case '16:9':
        return 'aspect-[16/9]';
      case '2:3':
        return 'aspect-[2/3]';
      default:
        return 'aspect-[4/5]';
    }
  };

  return (
    <div className="group relative rounded-2xl overflow-hidden bg-dark-900 border border-slate-800/80 hover:border-purple-500/40 transition-all duration-300 shadow-lg hover:shadow-glow-purple flex flex-col">
      <Link to={`/prompt/${prompt.id}`} className="block relative w-full overflow-hidden">
        <div className={`w-full overflow-hidden relative bg-dark-950 ${getAspectRatioClass(prompt.aspectRatio)}`}>
          {/* Skeleton placeholder while image loads */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-dark-850 animate-pulse flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
            </div>
          )}

          {/* Graceful Fallback if image fails to load */}
          {imageError ? (
            <div className="absolute inset-0 bg-dark-850 flex flex-col items-center justify-center p-4 text-center">
              <ImageIcon className="w-10 h-10 text-slate-600 mb-2" />
              <p className="text-xs text-slate-400 font-medium line-clamp-2">{prompt.title}</p>
              <span className="text-[10px] text-purple-400 mt-1 uppercase tracking-wider">{prompt.category}</span>
            </div>
          ) : (
            <img
              src={prompt.thumbnailUrl}
              alt={prompt.title}
              loading={priority ? 'eager' : 'lazy'}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}

          {/* Overlay Gradient on Hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* Top Badges */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-1.5 flex-wrap">
              {prompt.featured && (
                <span className="pointer-events-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/90 text-white backdrop-blur-md shadow-sm">
                  <Sparkles className="w-2.5 h-2.5" /> Featured
                </span>
              )}
              <span className="pointer-events-auto px-2 py-0.5 rounded-full text-[10px] font-medium bg-dark-900/80 text-slate-300 backdrop-blur-md border border-white/10">
                {prompt.aspectRatio}
              </span>
            </div>

            {/* Favorite Button */}
            <button
              onClick={handleFavoriteClick}
              aria-label={favorited ? 'Remove from favorites' : 'Save to favorites'}
              className={`pointer-events-auto p-2 rounded-full backdrop-blur-md transition-all duration-200 transform active:scale-90 ${
                favorited
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                  : 'bg-dark-900/70 text-slate-300 hover:text-white hover:bg-dark-900 border border-white/10'
              }`}
            >
              <Heart className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Quick Copy Button on Image (Desktop Hover / Mobile Visible) */}
          <div className="absolute bottom-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={handleCopy}
              title="Copy Prompt"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg backdrop-blur-md transition-transform active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy Prompt
                </>
              )}
            </button>
          </div>
        </div>
      </Link>

      {/* Card Details */}
      <div className="p-3.5 flex flex-col flex-grow justify-between gap-2">
        <div>
          <div className="flex items-center justify-between text-[11px] font-medium text-purple-400 mb-1">
            <span className="truncate">{prompt.category}</span>
            {prompt.popularity > 0 && (
              <span className="text-slate-400 text-[10px] shrink-0 font-normal">
                ★ {(prompt.popularity / 1000).toFixed(1)}k
              </span>
            )}
          </div>
          <Link to={`/prompt/${prompt.id}`}>
            <h3 className="text-sm font-semibold text-slate-100 hover:text-purple-300 transition-colors line-clamp-1">
              {prompt.title}
            </h3>
          </Link>
          <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
            {prompt.prompt}
          </p>
        </div>

        {/* Card Footer tags and quick action */}
        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1 overflow-hidden">
            {prompt.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="px-1.5 py-0.5 rounded bg-dark-800 text-slate-400 text-[10px] truncate">
                #{tag}
              </span>
            ))}
          </div>

          <button
            onClick={handleCopy}
            className="text-purple-400 hover:text-purple-300 font-medium inline-flex items-center gap-1 transition-colors text-xs shrink-0"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
};
