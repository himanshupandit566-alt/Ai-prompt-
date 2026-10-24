import React, { useState, useMemo } from 'react';
import { useFavorites } from '../context/FavoritesContext';
import { HeroSection } from '../components/HeroSection';
import { CategoryChips } from '../components/CategoryChips';
import { TrendingSection } from '../components/TrendingSection';
import { FilterSortBar } from '../components/FilterSortBar';
import { ImageCard } from '../components/ImageCard';
import { CategoryName, SortOption } from '../types/prompt';
import { Sparkles, Compass, AlertCircle } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { allPrompts } = useFavorites();
  const [selectedCategory, setSelectedCategory] = useState<CategoryName>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('featured');
  const [selectedRatio, setSelectedRatio] = useState('All');
  const [selectedTool, setSelectedTool] = useState('All Tools');

  // Filter & Sort Logic
  const filteredPrompts = useMemo(() => {
    return allPrompts.filter((prompt) => {
      // Category filter
      if (selectedCategory !== 'All' && prompt.category !== selectedCategory) {
        return false;
      }
      // Aspect Ratio filter
      if (selectedRatio !== 'All' && prompt.aspectRatio !== selectedRatio) {
        return false;
      }
      // AI Tool filter
      if (selectedTool !== 'All Tools' && !prompt.compatibleTools.includes(selectedTool)) {
        return false;
      }
      // Search Query filter (matches title, prompt, description, tags, category)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchTitle = prompt.title.toLowerCase().includes(query);
        const matchPrompt = prompt.prompt.toLowerCase().includes(query);
        const matchDesc = prompt.description.toLowerCase().includes(query);
        const matchCategory = prompt.category.toLowerCase().includes(query);
        const matchTags = prompt.tags.some((t) => t.toLowerCase().includes(query));
        if (!matchTitle && !matchPrompt && !matchDesc && !matchCategory && !matchTags) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (sortOption === 'featured') {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return b.popularity - a.popularity;
      }
      if (sortOption === 'popular') {
        return b.popularity - a.popularity;
      }
      if (sortOption === 'latest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortOption === 'alphabetical') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [allPrompts, selectedCategory, selectedRatio, selectedTool, searchQuery, sortOption]);

  const handleResetFilters = () => {
    setSelectedCategory('All');
    setSearchQuery('');
    setSelectedRatio('All');
    setSelectedTool('All Tools');
    setSortOption('featured');
  };

  const hasActiveFilters =
    selectedCategory !== 'All' ||
    searchQuery.trim().length > 0 ||
    selectedRatio !== 'All' ||
    selectedTool !== 'All Tools';

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSection
        onSearch={(query) => setSearchQuery(query)}
        initialQuery={searchQuery}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Category Filters (Horizontally scrollable chips) */}
        <CategoryChips
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
        />

        {/* Trending Section (Only show on 'All' category when not actively searching) */}
        {selectedCategory === 'All' && !searchQuery.trim() && (
          <TrendingSection prompts={allPrompts} />
        )}

        {/* Explore Gallery Header */}
        <div className="mt-10 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {selectedCategory === 'All' ? 'Explore All Prompts' : selectedCategory}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              {searchQuery
                ? `Showing search results for "${searchQuery}"`
                : 'Browse high-quality prompts curated for your next creative generation'}
            </p>
          </div>
        </div>

        {/* Filter and Sort Toolbar */}
        <FilterSortBar
          totalCount={filteredPrompts.length}
          sortOption={sortOption}
          onSortChange={setSortOption}
          selectedRatio={selectedRatio}
          onRatioChange={setSelectedRatio}
          selectedTool={selectedTool}
          onToolChange={setSelectedTool}
          onResetFilters={handleResetFilters}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Responsive Gallery Grid */}
        {filteredPrompts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
            {filteredPrompts.map((prompt, idx) => (
              <ImageCard
                key={prompt.id}
                prompt={prompt}
                priority={idx < 6}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="py-20 text-center bg-white dark:bg-dark-900/50 rounded-3xl border border-slate-200 dark:border-slate-800/80 p-8 my-8 max-w-lg mx-auto shadow-sm dark:shadow-none">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center mb-4">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No matching prompts found</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              We couldn't find any prompts matching your active filters or search terms. Try searching for something else or reset your filters.
            </p>
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-all shadow-glow-purple cursor-pointer"
            >
              <Compass className="w-4 h-4" /> Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
