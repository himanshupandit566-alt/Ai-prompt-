import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, Heart, Grid, Settings } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';

export const BottomNav: React.FC = () => {
  const { favorites } = useFavorites();

  const navItems = [
    { to: '/', label: 'Home', icon: Home, exact: true },
    { to: '/explore', label: 'Explore', icon: Compass },
    { to: '/favorites', label: 'Favorites', icon: Heart, badge: favorites.length },
    { to: '/category/all', label: 'Categories', icon: Grid },
    { to: '/settings', label: 'Profile', icon: Settings },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-dark-950/95 backdrop-blur-xl border-t border-slate-800/80 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
      <nav className="flex items-center justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
                  isActive
                    ? 'text-purple-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute -top-1 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center shadow-md">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 w-8 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full" />
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
