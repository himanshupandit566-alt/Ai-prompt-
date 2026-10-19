import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, ArrowRight, Wand2 } from 'lucide-react';

interface HeroSectionProps {
  onSearch?: (query: string) => void;
  initialQuery?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onSearch, initialQuery = '' }) => {
  const [query, setQuery] = useState(initialQuery);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(query.trim());
    } else {
      navigate(`/explore?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleQuickTagClick = (tag: string) => {
    setQuery(tag);
    if (onSearch) {
      onSearch(tag);
    } else {
      navigate(`/explore?q=${encodeURIComponent(tag)}`);
    }
  };

  const quickTags = ['Cinematic', 'Cyberpunk', 'Vogue Fashion', 'Anime', 'Vintage 1970s', 'Luxury', 'Hypercar'];

  return (
    <section className="relative overflow-hidden pt-8 pb-10 md:pt-14 md:pb-16 text-center">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-purple-600/15 via-indigo-600/15 to-blue-600/15 blur-3xl rounded-full pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-4 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse-subtle" />
          <span>[ FX Prompty ] • Curated AI Prompts for Midjourney, DALL-E 3 & Flux</span>
        </div>

        {/* Heading */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-4 leading-tight">
          [ FX <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-blue-400 bg-clip-text text-transparent">Prompty</span> ] <br className="hidden sm:inline" />
          <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-200">
            Find Your Next AI Masterpiece
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-8 font-normal leading-relaxed">
          Explore stunning AI image prompts on FX Prompty and recreate your favorite visual styles with one-tap copy.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto relative mb-6">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search portraits, cinematic photos, anime, luxury..."
              className="w-full pl-12 pr-32 py-3.5 md:py-4 bg-dark-900/90 border border-slate-700/80 rounded-2xl text-slate-100 placeholder-slate-400 text-sm md:text-base focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 shadow-2xl transition-all"
            />
            <button
              type="submit"
              className="absolute right-2 px-4 py-2 md:py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs md:text-sm font-semibold shadow-md transition-all active:scale-95 flex items-center gap-1.5"
            >
              <span>Search</span>
              <ArrowRight className="w-4 h-4 hidden sm:inline" />
            </button>
          </div>
        </form>

        {/* Secondary Call-To-Action & Quick Tags */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate('/explore')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-dark-850 hover:bg-dark-800 border border-slate-700 text-slate-200 hover:text-white text-sm font-semibold transition-all shadow-sm active:scale-95"
          >
            <Wand2 className="w-4 h-4 text-purple-400" />
            <span>Explore Prompts</span>
          </button>

          {/* Quick Filter Tag Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-1 text-xs text-slate-400 scrollbar-none">
            <span className="shrink-0 text-slate-500 hidden md:inline">Trending:</span>
            {quickTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleQuickTagClick(tag)}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-dark-900 border border-slate-800 hover:border-purple-500/40 hover:text-purple-300 text-slate-400 text-[11px] transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
