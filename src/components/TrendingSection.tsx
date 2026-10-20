import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { PromptItem } from '../types/prompt';
import { useFavorites } from '../context/FavoritesContext';
import { Flame, Heart, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { playClickSound, playPopSound } from '../utils/sound';

interface TrendingSectionProps {
  prompts: PromptItem[];
}

export const TrendingSection: React.FC<TrendingSectionProps> = ({ prompts }) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const scrollRef = useRef<HTMLDivElement>(null);

  const trendingPrompts = prompts
    .filter((p) => p.featured || p.popularity > 8000)
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 10);

  const scroll = (direction: 'left' | 'right') => {
    playClickSound();
    if (scrollRef.current) {
      const offset = direction === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <section className="my-8 md:my-12">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4 px-4 sm:px-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Trending Prompts
            </h2>
            <p className="text-xs text-slate-400 hidden sm:block">
              Most saved community visual concepts this week
            </p>
          </div>
        </div>

        {/* Scroll Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            aria-label="Scroll trending left"
            className="w-8 h-8 rounded-full bg-dark-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-dark-800 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            aria-label="Scroll trending right"
            className="w-8 h-8 rounded-full bg-dark-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-dark-800 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div
        ref={scrollRef}
        className="flex items-stretch gap-4 overflow-x-auto scrollbar-none px-4 sm:px-0 pb-2 scroll-smooth"
      >
        {trendingPrompts.map((prompt) => {
          const favorited = isFavorite(prompt.id);

          return (
            <div
              key={prompt.id}
              className="group shrink-0 w-64 sm:w-72 bg-dark-900 rounded-2xl border border-slate-800/80 hover:border-purple-500/40 overflow-hidden flex flex-col justify-between shadow-lg hover:shadow-glow-purple transition-all duration-300"
            >
              <Link
                to={`/prompt/${prompt.id}`}
                onClick={() => playClickSound()}
                className="block relative aspect-[4/5] overflow-hidden bg-dark-950"
              >
                <img
                  src={prompt.thumbnailUrl}
                  alt={prompt.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 via-transparent to-black/30" />

                {/* Popularity Indicator */}
                <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-semibold text-amber-400 flex items-center gap-1">
                  <Flame className="w-3 h-3 fill-amber-400" />
                  <span>{(prompt.popularity / 1000).toFixed(1)}k</span>
                </div>

                {/* Favorite Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    playPopSound();
                    toggleFavorite(prompt.id);
                  }}
                  aria-label="Toggle favorite"
                  className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-md transition-all cursor-pointer ${
                    favorited
                      ? 'bg-rose-500 text-white'
                      : 'bg-black/60 text-slate-300 hover:text-white border border-white/10'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${favorited ? 'fill-current' : ''}`} />
                </button>

                {/* Title and Category over image */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-300">
                    {prompt.category}
                  </span>
                  <h3 className="text-sm font-bold text-white line-clamp-1 drop-shadow-md">
                    {prompt.title}
                  </h3>
                </div>
              </Link>

              {/* Quick Action Footer: Clean View Details Link (Zero prompt text leakage) */}
              <div className="p-3 bg-dark-900 flex items-center justify-between border-t border-slate-800/60">
                <span className="text-[11px] text-slate-400 font-medium px-2 py-0.5 rounded-md bg-dark-950 border border-slate-800">
                  {prompt.aspectRatio}
                </span>
                <Link
                  to={`/prompt/${prompt.id}`}
                  onClick={() => playClickSound()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/30 text-purple-300 hover:text-white text-xs font-semibold transition-all group/btn"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
