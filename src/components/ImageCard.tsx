import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Sparkles, Image as ImageIcon, Eye } from 'lucide-react';
import { PromptItem } from '../types/prompt';
import { useFavorites } from '../context/FavoritesContext';
import { playClickSound, playPopSound } from '../utils/sound';

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
    playPopSound(0.06);
    toggleFavorite(prompt.id);
  };

  const handleCardClick = () => {
    playClickSound(0.04);
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
    <div className="group relative rounded-2xl overflow-hidden glass-card glass-card-hover flex flex-col cursor-pointer">
      <Link
        to={`/prompt/${prompt.id}`}
        onClick={handleCardClick}
        className="block relative w-full overflow-hidden"
      >
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
              className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-106 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}

          {/* Overlay Gradient on Hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-dark-950/90 via-dark-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

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
              className={`pointer-events-auto p-2 rounded-full backdrop-blur-md transition-all duration-200 transform active:scale-90 cursor-pointer ${
                favorited
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                  : 'bg-dark-900/70 text-slate-300 hover:text-white hover:bg-dark-900 border border-white/10'
              }`}
            >
              <Heart className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Hover Hint: Click to view prompt */}
          <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 pointer-events-none flex items-center justify-between text-xs text-white">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-dark-900/80 backdrop-blur-md border border-white/10 text-[11px] font-medium">
              <Eye className="w-3.5 h-3.5 text-purple-400" />
              <span>View Prompt</span>
            </span>
          </div>
        </div>
      </Link>

      {/* Card Details: Photo, Title, Category and Views (Protected - Prompt text hidden on feed) */}
      <div className="p-3.5 flex flex-col flex-grow justify-between gap-1.5">
        <div>
          <div className="flex items-center justify-between text-[11px] font-medium text-purple-400 mb-1">
            <span className="truncate">{prompt.category}</span>
            {prompt.popularity > 0 && (
              <span className="text-slate-400 text-[10px] shrink-0 font-normal flex items-center gap-1">
                <Eye className="w-3 h-3 text-slate-500" />
                <span>{(prompt.popularity / 1000).toFixed(1)}k views</span>
              </span>
            )}
          </div>
          <Link to={`/prompt/${prompt.id}`} onClick={handleCardClick}>
            <h3 className="text-sm font-semibold text-slate-100 group-hover:text-purple-300 transition-colors line-clamp-1">
              {prompt.title}
            </h3>
          </Link>
        </div>

        {/* Card Footer: Category Tags (Prompt locked inside detail view) */}
        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1 overflow-hidden">
            {prompt.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="px-1.5 py-0.5 rounded bg-dark-800 text-slate-400 text-[10px] truncate">
                #{tag}
              </span>
            ))}
          </div>

          <Link
            to={`/prompt/${prompt.id}`}
            onClick={handleCardClick}
            className="text-purple-400 hover:text-purple-300 font-medium inline-flex items-center gap-1 text-[11px] shrink-0"
          >
            <span>Unlock Prompt →</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
