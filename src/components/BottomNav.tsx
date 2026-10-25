import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, Heart, Settings } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import { playPopSound } from '../utils/sound';

export const BottomNav: React.FC = () => {
  const { favorites } = useFavorites();

  const navItems = [
    { to: '/', label: 'Home', icon: Home, exact: true },
    { to: '/explore', label: 'Explore', icon: Compass },
    { to: '/favorites', label: 'Favorites', icon: Heart, badge: favorites.length },
    { to: '/settings', label: 'Profile', icon: Settings },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-bottom-bar pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
      <nav className="grid grid-cols-4 max-w-md mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              onClick={() => playPopSound()}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all relative ${
                  isActive
                    ? 'text-purple-600 dark:text-purple-400 font-semibold'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon
                      className={`w-5 h-5 transition-transform duration-300 ${
                        isActive
                          ? 'scale-110 text-purple-600 dark:text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]'
                          : ''
                      }`}
                    />
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute -top-1 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center shadow-md animate-in zoom-in-75">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] mt-1 tracking-tight font-medium">{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 w-6 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};
