import React from 'react';
import { SortOption } from '../types/prompt';
import { SlidersHorizontal, ArrowUpDown, X } from 'lucide-react';

interface FilterSortBarProps {
  totalCount: number;
  sortOption: SortOption;
  onSortChange: (sort: SortOption) => void;
  selectedRatio: string;
  onRatioChange: (ratio: string) => void;
  selectedTool: string;
  onToolChange: (tool: string) => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

export const FilterSortBar: React.FC<FilterSortBarProps> = ({
  totalCount,
  sortOption,
  onSortChange,
  selectedRatio,
  onRatioChange,
  selectedTool,
  onToolChange,
  onResetFilters,
  hasActiveFilters,
}) => {
  const aspectRatios = ['All', '1:1', '4:5', '3:4', '16:9', '9:16'];
  const tools = ['All Tools', 'Midjourney v6', 'Flux.1', 'DALL-E 3', 'Stable Diffusion XL'];

  return (
    <div className="bg-dark-900/90 border border-slate-800/80 rounded-2xl p-3 sm:p-4 my-6 backdrop-blur-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Count and Active Filter Indicator */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-purple-400 shrink-0" />
          <span className="text-sm font-semibold text-slate-200">
            {totalCount} {totalCount === 1 ? 'Prompt' : 'Prompts'} Available
          </span>
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-medium transition-colors"
            >
              <span>Reset</span>
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Right: Controls for Sort, Ratio, Tool */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Aspect Ratio Filter */}
          <div className="flex items-center gap-1.5 bg-dark-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 font-medium hidden sm:inline">Ratio:</span>
            <select
              value={selectedRatio}
              onChange={(e) => onRatioChange(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              {aspectRatios.map((ratio) => (
                <option key={ratio} value={ratio} className="bg-dark-900 text-slate-200">
                  {ratio === 'All' ? 'All Ratios' : ratio}
                </option>
              ))}
            </select>
          </div>

          {/* AI Tool Filter */}
          <div className="flex items-center gap-1.5 bg-dark-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 font-medium hidden sm:inline">AI Tool:</span>
            <select
              value={selectedTool}
              onChange={(e) => onToolChange(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              {tools.map((tool) => (
                <option key={tool} value={tool} className="bg-dark-900 text-slate-200">
                  {tool}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-dark-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
            <ArrowUpDown className="w-3.5 h-3.5 text-purple-400" />
            <select
              value={sortOption}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="featured" className="bg-dark-900 text-slate-200">Featured</option>
              <option value="latest" className="bg-dark-900 text-slate-200">Latest</option>
              <option value="popular" className="bg-dark-900 text-slate-200">Most Popular</option>
              <option value="alphabetical" className="bg-dark-900 text-slate-200">Alphabetical (A-Z)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
