import React, { useRef } from 'react';
import { CATEGORIES } from '../data/categories';
import { CategoryName } from '../types/prompt';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CategoryChipsProps {
  selectedCategory: CategoryName;
  onSelectCategory: (category: CategoryName) => void;
}

export const CategoryChips: React.FC<CategoryChipsProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const offset = direction === 'left' ? -220 : 220;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full my-4 group">
      {/* Scroll Left Button */}
      <button
        onClick={() => scroll('left')}
        aria-label="Scroll categories left"
        className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-dark-900/90 border border-slate-700 items-center justify-center text-slate-300 hover:text-white hover:bg-dark-800 shadow-md transition-all opacity-0 group-hover:opacity-100"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Horizontal Scroll Area */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-2 overflow-x-auto scrollbar-none px-4 sm:px-0 py-1.5 scroll-smooth"
      >
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.name;
          return (
            <button
              key={cat.name}
              onClick={() => onSelectCategory(cat.name)}
              className={`shrink-0 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 active:scale-95 flex items-center gap-1.5 ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-glow-purple border border-purple-400/30'
                  : 'bg-dark-900 hover:bg-dark-850 text-slate-300 hover:text-white border border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Scroll Right Button */}
      <button
        onClick={() => scroll('right')}
        aria-label="Scroll categories right"
        className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-dark-900/90 border border-slate-700 items-center justify-center text-slate-300 hover:text-white hover:bg-dark-800 shadow-md transition-all opacity-0 group-hover:opacity-100"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
