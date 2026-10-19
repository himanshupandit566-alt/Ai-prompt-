import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-dark-950 border-t border-slate-800/80 pt-12 pb-24 md:pb-12 mt-16 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <Link to="/" className="flex items-center gap-2.5 group inline-block">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 p-0.5 flex items-center justify-center">
                <div className="w-full h-full bg-dark-950 rounded-[10px] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
              </div>
              <span className="font-extrabold text-lg text-white tracking-tight">
                FX <span className="text-purple-400">Prompty</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Discover. Copy. Create. Premium curated AI image generation prompts for Midjourney, DALL-E 3, Flux.1, and Stable Diffusion XL.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="px-2.5 py-1 rounded-md bg-dark-900 border border-slate-800 text-[11px] text-slate-300">
                Midjourney v6
              </span>
              <span className="px-2.5 py-1 rounded-md bg-dark-900 border border-slate-800 text-[11px] text-slate-300">
                DALL-E 3
              </span>
              <span className="px-2.5 py-1 rounded-md bg-dark-900 border border-slate-800 text-[11px] text-slate-300">
                Flux.1
              </span>
              <span className="px-2.5 py-1 rounded-md bg-dark-900 border border-slate-800 text-[11px] text-slate-300">
                SDXL
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3 tracking-wider uppercase">
              Navigation
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-purple-400 transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/explore" className="hover:text-purple-400 transition-colors">Explore Gallery</Link>
              </li>
              <li>
                <Link to="/category/all" className="hover:text-purple-400 transition-colors">Browse Categories</Link>
              </li>
              <li>
                <Link to="/favorites" className="hover:text-purple-400 transition-colors">My Favorites</Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-purple-400 transition-colors">Prompt Creator</Link>
              </li>
            </ul>
          </div>

          {/* App Info & Offline */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3 tracking-wider uppercase">
              Application
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/settings" className="hover:text-purple-400 transition-colors">Settings & Cache</Link>
              </li>
              <li className="text-xs text-slate-400 pt-1">
                PWA Ready • Offline Prompt Storage • Instant Copy
              </li>
              <li className="text-xs text-slate-400">
                Sample illustrative visual assets provided for prompt styling.
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright and disclaimer */}
        <div className="pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} FX Prompty. All rights reserved.</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span>Created by</span>
            <a
              href="https://github.com/himanshupandit566-alt"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 font-semibold underline underline-offset-2 transition-colors"
            >
              Himanshu Pandey
            </a>
            <span className="text-slate-600">•</span>
            <span>for the creative AI community.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
