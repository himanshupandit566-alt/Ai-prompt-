import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';
import { CATEGORIES } from '../data/categories';
import { ImageCard } from '../components/ImageCard';
import { FilterSortBar } from '../components/FilterSortBar';
import { SortOption } from '../types/prompt';
import { Layers, ArrowLeft, Search } from 'lucide-react';

export const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { allPrompts } = useFavorites();

  const [sortOption, setSortOption] = useState<SortOption>('featured');
  const [selectedRatio, setSelectedRatio] = useState('All');
  const [selectedTool, setSelectedTool] = useState('All Tools');
  const [searchQuery, setSearchQuery] = useState('');

  // Find category info matching slug
  const currentCategory = CATEGORIES.find(
    (c) => c.slug.toLowerCase() === (slug || 'all').toLowerCase()
  ) || CATEGORIES[0];

  const filteredPrompts = useMemo(() => {
    return allPrompts.filter((prompt) => {
      // If not 'All', match exact category name
      if (currentCategory.name !== 'All' && prompt.category !== currentCategory.name) {
        return false;
      }
      if (selectedRatio !== 'All' && prompt.aspectRatio !== selectedRatio) {
        return false;
      }
      if (selectedTool !== 'All Tools' && !prompt.compatibleTools.includes(selectedTool)) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = prompt.title.toLowerCase().includes(q);
        const matchPrompt = prompt.prompt.toLowerCase().includes(q);
        const matchDesc = prompt.description.toLowerCase().includes(q);
        const matchTags = prompt.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchPrompt && !matchDesc && !matchTags) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortOption === 'featured') {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return b.popularity - a.popularity;
      }
      if (sortOption === 'popular') return b.popularity - a.popularity;
      if (sortOption === 'latest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortOption === 'alphabetical') return a.title.localeCompare(b.title);
      return 0;
    });
  }, [allPrompts, currentCategory, selectedRatio, selectedTool, searchQuery, sortOption]);

  const handleResetFilters = () => {
    setSelectedRatio('All');
    setSelectedTool('All Tools');
    setSearchQuery('');
    setSortOption('featured');
  };

  const hasActiveFilters =
    selectedRatio !== 'All' ||
    selectedTool !== 'All Tools' ||
    searchQuery.trim().length > 0;

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Category Navigation Breadcrumb */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/explore"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-dark-900 border border-slate-800 text-slate-300 hover:text-white text-xs sm:text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Categories</span>
        </Link>
        <span className="text-xs text-purple-400 font-semibold uppercase tracking-wider">
          {filteredPrompts.length} Prompts
        </span>
      </div>

      {/* Hero Category Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 border border-slate-800/80 p-6 sm:p-10 mb-8 shadow-xl">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-3">
            <Layers className="w-3.5 h-3.5" />
            <span>Category Collection</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
            {currentCategory.name}
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            {currentCategory.description}
          </p>
        </div>
      </div>

      {/* Category Switcher Pills */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-4 mb-6">
        {CATEGORIES.map((cat) => {
          const isActive = cat.slug === currentCategory.slug;
          return (
            <Link
              key={cat.slug}
              to={`/category/${cat.slug}`}
              className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-purple-600 text-white shadow-glow-purple'
                  : 'bg-dark-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
              }`}
            >
              {cat.name}
            </Link>
          );
        })}
      </div>

      {/* Search within Category */}
      <div className="relative max-w-md mb-4">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search within ${currentCategory.name}...`}
          className="w-full pl-10 pr-4 py-2.5 bg-dark-900 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Filter & Sort Bar */}
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
          {filteredPrompts.map((prompt) => (
            <ImageCard key={prompt.id} prompt={prompt} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center bg-dark-900/40 rounded-3xl border border-slate-800 p-8 max-w-md mx-auto">
          <p className="text-base font-bold text-white mb-2">No prompts found in this category</p>
          <p className="text-xs text-slate-400 mb-6">
            Try resetting your filters or exploring another category.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
