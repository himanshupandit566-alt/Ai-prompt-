import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';
import { ImageCard } from '../components/ImageCard';
import { FilterSortBar } from '../components/FilterSortBar';
import { CategoryChips } from '../components/CategoryChips';
import { CategoryName, SortOption } from '../types/prompt';
import { Compass, Search, X } from 'lucide-react';
import { normalizeCategory } from '../data/categories';

export const ExplorePage: React.FC = () => {
  const { allPrompts } = useFavorites();
  const [searchParams, setSearchParams] = useSearchParams();

  const queryParam = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [selectedCategory, setSelectedCategory] = useState<CategoryName>('All');
  const [sortOption, setSortOption] = useState<SortOption>('latest');
  const [selectedRatio, setSelectedRatio] = useState('All');
  const [selectedTool, setSelectedTool] = useState('All Tools');

  // Sync search param if URL updates
  useEffect(() => {
    if (queryParam !== searchQuery) {
      setSearchQuery(queryParam);
    }
  }, [queryParam]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (val.trim()) {
      setSearchParams({ q: val.trim() });
    } else {
      setSearchParams({});
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchParams({});
  };

  const handleResetFilters = () => {
    setSelectedCategory('All');
    clearSearch();
    setSelectedRatio('All');
    setSelectedTool('All Tools');
    setSortOption('latest');
  };

  const filteredPrompts = useMemo(() => {
    return allPrompts.filter((prompt) => {
      if (selectedCategory !== 'All' && normalizeCategory(prompt.category) !== selectedCategory) return false;
      if (selectedRatio !== 'All' && prompt.aspectRatio !== selectedRatio) return false;
      if (selectedTool !== 'All Tools' && !prompt.compatibleTools.includes(selectedTool)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = prompt.title.toLowerCase().includes(q);
        const matchPrompt = prompt.prompt.toLowerCase().includes(q);
        const matchDesc = prompt.description.toLowerCase().includes(q);
        const matchCat = (prompt.category + ' ' + normalizeCategory(prompt.category)).toLowerCase().includes(q);
        const matchTags = prompt.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchPrompt && !matchDesc && !matchCat && !matchTags) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortOption === 'latest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortOption === 'featured') {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        const timeDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (timeDiff !== 0) return timeDiff;
        return b.popularity - a.popularity;
      }
      if (sortOption === 'popular') {
        const popDiff = b.popularity - a.popularity;
        if (popDiff !== 0) return popDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortOption === 'alphabetical') return a.title.localeCompare(b.title);
      return 0;
    });
  }, [allPrompts, selectedCategory, selectedRatio, selectedTool, searchQuery, sortOption]);

  const hasActiveFilters =
    selectedCategory !== 'All' ||
    searchQuery.trim().length > 0 ||
    selectedRatio !== 'All' ||
    selectedTool !== 'All Tools';

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2.5 text-purple-600 dark:text-purple-400 mb-2">
          <Compass className="w-5 h-5" />
          <span className="text-xs font-bold tracking-wider uppercase">Visual Discovery</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
          Explore Prompt Gallery
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
          Search thousands of keywords, cinematic camera styles, lighting setups, and visual aesthetics.
        </p>
      </div>

      {/* Prominent Search Bar on Explore Page */}
      <div className="relative max-w-2xl mb-6">
        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Filter by keyword (e.g. portrait, cyberpunk, 35mm, anime)..."
          className="w-full pl-12 pr-10 py-3.5 bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-[#94a3b8] dark:placeholder-slate-400 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 shadow-sm dark:shadow-xl transition-all"
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Chips */}
      <CategoryChips
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

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

      {/* Grid */}
      {filteredPrompts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 items-start">
          {filteredPrompts.map((prompt, idx) => (
            <ImageCard key={prompt.id} prompt={prompt} priority={idx < 6} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center bg-white dark:bg-dark-900/50 rounded-3xl border border-slate-200 dark:border-slate-800/80 p-8 my-8 max-w-md mx-auto shadow-sm dark:shadow-none">
          <p className="text-base font-semibold text-slate-900 dark:text-white mb-2">No matching prompts found</p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-5">
            Try adjusting your search terms or resetting filters.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
};
