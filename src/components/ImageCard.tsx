import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Sparkles, Image as ImageIcon, Eye, ArrowRight } from 'lucide-react';
import { PromptItem } from '../types/prompt';
import { useFavorites } from '../context/FavoritesContext';
import { playClickSound, playPopSound } from '../utils/sound';
import { normalizeCategory } from '../data/categories';

interface ImageCardProps {
  prompt: PromptItem;
  priority?: boolean;
}

export const ImageCard: React.FC<ImageCardProps> = ({ prompt, priority = false }) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const favorited = isFavorite(prompt.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    playPopSound();
    toggleFavorite(prompt.id);
  };

  const handleCardClick = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    playClickSound();
  };

  return (
    <div className="group relative rounded-2xl overflow-hidden glass-card glass-card-hover flex flex-col justify-start h-fit cursor-pointer transition-all">
      <Link
        to={`/prompt/${prompt.id}`}
        onClick={handleCardClick}
        className="block relative w-full overflow-hidden"
      >
        {/* Consistent 4:5 aspect ratio wrapper prevents any height divergence across rows */}
        <div className="w-full relative bg-slate-100 dark:bg-dark-950 aspect-[4/5] overflow-hidden">
          {/* Skeleton placeholder while image loads */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-slate-200 dark:bg-dark-850 animate-pulse flex items-center justify-center">
              <div className="w-7 h-7 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
            </div>
          )}

          {/* Graceful Fallback if image fails to load */}
          {imageError ? (
            <div className="absolute inset-0 bg-slate-100 dark:bg-dark-850 flex flex-col items-center justify-center p-3 text-center">
              <ImageIcon className="w-8 h-8 text-slate-400 dark:text-slate-600 mb-1.5" />
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium line-clamp-2">
                {prompt.title}
              </p>
              <span className="text-[9px] text-purple-600 dark:text-purple-400 mt-1 uppercase tracking-wider">
                {normalizeCategory(prompt.category)}
              </span>
            </div>
          ) : (
            <img
              src={prompt.thumbnailUrl}
              alt={prompt.title}
              loading={priority ? 'eager' : 'lazy'}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-106 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}

          {/* Overlay Gradient on Hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* Top Badges */}
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-1 flex-wrap">
              {prompt.featured && (
                <span className="pointer-events-auto inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-purple-600 text-white backdrop-blur-md shadow-sm">
                  <Sparkles className="w-2.5 h-2.5" /> Featured
                </span>
              )}
              <span className="pointer-events-auto px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-black/60 dark:bg-dark-900/80 text-white dark:text-slate-300 backdrop-blur-md border border-white/15">
                {prompt.aspectRatio || '4:5'}
              </span>
            </div>

            {/* Favorite Button */}
            <button
              onClick={handleFavoriteClick}
              aria-label={favorited ? 'Remove from favorites' : 'Save to favorites'}
              className={`pointer-events-auto p-1.5 rounded-full backdrop-blur-md transition-all duration-200 transform active:scale-90 cursor-pointer ${
                favorited
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                  : 'bg-black/50 dark:bg-dark-900/70 text-white dark:text-slate-300 hover:text-white hover:bg-black/70 dark:hover:bg-dark-900 border border-white/20 dark:border-white/10'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${favorited ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Hover Hint: Click to view prompt */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0 pointer-events-none flex items-center justify-between text-xs text-white">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md border border-white/15 text-[10px] font-medium">
              <Eye className="w-3 h-3 text-purple-400" />
              <span>View Prompt</span>
            </span>
          </div>
        </div>
      </Link>

      {/* Card Details: Compact metadata immediately followed by View Details action */}
      <div className="p-3 flex flex-col justify-start gap-1.5 bg-white dark:bg-dark-900">
        <div className="flex items-center justify-between text-[11px] font-medium text-purple-600 dark:text-purple-400">
          <span className="truncate max-w-[70%]">{normalizeCategory(prompt.category)}</span>
          {prompt.popularity > 0 && (
            <span className="text-slate-500 dark:text-slate-400 text-[10px] shrink-0 font-normal flex items-center gap-0.5">
              <Eye className="w-2.5 h-2.5 text-slate-400 dark:text-slate-500" />
              <span>{(prompt.popularity / 1000).toFixed(1)}k</span>
            </span>
          )}
        </div>

        <Link to={`/prompt/${prompt.id}`} onClick={handleCardClick}>
          <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors line-clamp-1 leading-snug">
            {prompt.title}
          </h3>
        </Link>

        {/* Action Button: sits tightly with uniform 8px–10px spacing */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 mt-0.5">
          <Link
            to={`/prompt/${prompt.id}`}
            onClick={handleCardClick}
            className="w-full py-1.5 px-2.5 rounded-xl bg-purple-50 dark:bg-purple-600/10 hover:bg-purple-100 dark:hover:bg-purple-600/20 border border-purple-200 dark:border-purple-500/25 hover:border-purple-300 dark:hover:border-purple-500/40 text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-white font-semibold text-xs inline-flex items-center justify-center gap-1.5 transition-all group/btn"
          >
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
};
