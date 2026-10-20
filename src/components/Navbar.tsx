import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Heart, Settings, PlusCircle, Compass, Grid, X, LogIn } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { playClickSound, playPopSound } from '../utils/sound';
import { AppLogo } from './AppLogo';

export const Navbar: React.FC = () => {
  const { favorites } = useFavorites();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileSearchOpen(false);
    }
  };

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-nav transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group min-w-0">
            <AppLogo size={36} className="group-hover:scale-105 transition-transform shrink-0" />
            <div className="flex flex-col">
              <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-purple-300 bg-clip-text text-transparent">
                FX <span className="text-purple-400 font-bold">Prompty</span>
              </span>
              <span className="text-[10px] text-slate-400 tracking-wider font-medium hidden sm:block">
                Discover. Copy. Create.
              </span>
            </div>
          </Link>

          {/* Desktop Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-sm lg:max-w-md mx-3 lg:mx-4 relative items-center"
          >
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search portraits, cinematic photos, anime, luxury..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-dark-900 border border-slate-800 rounded-full text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/50 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-slate-500 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link
              to="/explore"
              onClick={() => playClickSound()}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/explore')
                  ? 'bg-purple-600/15 text-purple-400'
                  : 'text-slate-300 hover:text-white hover:bg-dark-850'
              }`}
            >
              <Compass className="w-4 h-4" /> Explore
            </Link>

            <Link
              to="/category/all"
              onClick={() => playClickSound()}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/category')
                  ? 'bg-purple-600/15 text-purple-400'
                  : 'text-slate-300 hover:text-white hover:bg-dark-850'
              }`}
            >
              <Grid className="w-4 h-4" /> Categories
            </Link>

            <Link
              to="/admin"
              onClick={() => playClickSound()}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/admin')
                  ? 'bg-purple-600/15 text-purple-400'
                  : 'text-slate-300 hover:text-white hover:bg-dark-850'
              }`}
            >
              <PlusCircle className="w-4 h-4" /> Creator
            </Link>
          </nav>

          {/* Actions Container: Responsive & Guaranteed No-Cut on Mobile */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Stylized Creator Attribution Badge (Only on XL desktops to avoid crowding mobile/tablet) */}
            <a
              href="https://github.com/himanshupandit566-alt"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-dark-900/90 hover:bg-purple-950/30 border border-purple-500/30 hover:border-purple-400 text-xs text-slate-300 hover:text-white transition-all shadow-[0_0_15px_rgba(139,92,246,0.18)] group shrink-0"
              title="Created by Himanshu Pandey"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              <span className="text-slate-400">Created by</span>
              <strong className="text-purple-300 font-semibold group-hover:underline">Himanshu Pandey</strong>
            </a>

            {/* Mobile Search Toggle Button */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-dark-850 md:hidden shrink-0"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Favorites Icon (Hidden on mobile <640px where BottomNav has Favorites) */}
            <Link
              to="/favorites"
              onClick={() => playPopSound(0.06)}
              className={`hidden sm:flex relative p-2 rounded-xl transition-all shrink-0 ${
                isActive('/favorites')
                  ? 'bg-rose-500/15 text-rose-400'
                  : 'text-slate-300 hover:text-white hover:bg-dark-850'
              }`}
              aria-label="Favorites"
            >
              <Heart className={`w-5 h-5 ${favorites.length > 0 ? 'text-rose-500 fill-rose-500/20' : ''}`} />
              {favorites.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg">
                  {favorites.length}
                </span>
              )}
            </Link>

            {/* Settings Icon (Hidden on mobile <640px where BottomNav has Profile) */}
            <Link
              to="/settings"
              onClick={() => playClickSound()}
              className={`hidden sm:flex p-2 rounded-xl transition-all shrink-0 ${
                isActive('/settings')
                  ? 'bg-purple-600/15 text-purple-400'
                  : 'text-slate-300 hover:text-white hover:bg-dark-850'
              }`}
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
            </Link>

            {/* User Profile Avatar / Sign In Button - ALWAYS VISIBLE, NEVER CUT OFF */}
            {isAuthenticated && user ? (
              <Link
                to="/settings"
                onClick={() => playClickSound()}
                title={`${user.displayName || 'User'} (Profile & Settings)`}
                className="flex items-center p-0.5 rounded-full border border-purple-500/50 hover:border-purple-400 bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-[0_0_12px_rgba(139,92,246,0.3)] transition-all shrink-0"
              >
                <img
                  src={user.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.email || user.uid}`}
                  alt={user.displayName || 'Profile'}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover bg-dark-950"
                />
              </Link>
            ) : (
              <Link
                to="/login"
                onClick={() => playClickSound()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-semibold shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-all shrink-0 whitespace-nowrap"
              >
                <LogIn className="w-3.5 h-3.5 shrink-0" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Search Drawer */}
        {mobileSearchOpen && (
          <form
            onSubmit={handleSearchSubmit}
            className="pb-3 pt-1 md:hidden flex items-center relative animate-in fade-in slide-in-from-top-2"
          >
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search prompts, styles, tags..."
              className="w-full pl-9 pr-9 py-2 text-sm bg-dark-900 border border-purple-500/50 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>
        )}
      </div>
    </header>
  );
};
