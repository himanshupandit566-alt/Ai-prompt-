import React, { useState } from 'react';
import { useFavorites } from '../context/FavoritesContext';
import {
  Settings,
  ShieldCheck,
  Trash2,
  Info,
  CheckCircle2,
  HardDrive,
  Copy,
  RefreshCw
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { favorites, allPrompts, resetPromptsToDefault, showToast } = useFavorites();

  const [copyFeedbackToast, setCopyFeedbackToast] = useState(true);
  const [highQualityPreview, setHighQualityPreview] = useState(true);

  const clearAllFavorites = () => {
    if (window.confirm('Are you sure you want to clear all your saved favorites?')) {
      localStorage.removeItem('promptverse_favorites_v1');
      window.location.reload();
    }
  };

  const handleResetData = () => {
    if (window.confirm('Reset all custom prompts and restore original library state?')) {
      resetPromptsToDefault();
    }
  };

  return (
    <div className="min-h-screen max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-purple-400 mb-2">
          <Settings className="w-5 h-5" />
          <span className="text-xs font-bold tracking-wider uppercase">Preferences</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          Application Settings
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your local library storage, copy behaviors, and application preferences.
        </p>
      </div>

      <div className="space-y-6">
        {/* Interaction Preferences */}
        <div className="bg-dark-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Copy className="w-4 h-4 text-purple-400" />
            <span>Copy &amp; Export Preferences</span>
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-200">Instant Toast Notifications</p>
                <p className="text-xs text-slate-400">Display confirmation toast when copying prompts or favorites.</p>
              </div>
              <input
                type="checkbox"
                checked={copyFeedbackToast}
                onChange={(e) => {
                  setCopyFeedbackToast(e.target.checked);
                  showToast('Notification preference saved', 'info');
                }}
                className="w-5 h-5 rounded accent-purple-600 bg-dark-950 border-slate-700 cursor-pointer"
              />
            </div>

            <div className="border-t border-slate-800/80 pt-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-200">High-Resolution Image Previews</p>
                <p className="text-xs text-slate-400">Load high-resolution preview images for detailed prompt study.</p>
              </div>
              <input
                type="checkbox"
                checked={highQualityPreview}
                onChange={(e) => {
                  setHighQualityPreview(e.target.checked);
                  showToast('Preview preference updated', 'info');
                }}
                className="w-5 h-5 rounded accent-purple-600 bg-dark-950 border-slate-700 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Local Storage & Cache Management */}
        <div className="bg-dark-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-blue-400" />
            <span>Storage &amp; Local Cache</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-dark-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400">Saved Favorites</span>
              <p className="text-2xl font-extrabold text-rose-400 mt-1">{favorites.length}</p>
              <span className="text-[11px] text-slate-400">Stored in browser localStorage</span>
            </div>

            <div className="bg-dark-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400">Available Prompts</span>
              <p className="text-2xl font-extrabold text-purple-400 mt-1">{allPrompts.length}</p>
              <span className="text-[11px] text-slate-400">Built-in verified entries</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={clearAllFavorites}
              disabled={favorites.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-dark-850 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 text-xs font-semibold transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Saved Favorites</span>
            </button>

            <button
              onClick={handleResetData}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-dark-850 hover:bg-dark-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Custom Library</span>
            </button>
          </div>
        </div>

        {/* Application System Information */}
        <div className="bg-dark-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-400" />
            <span>Application Information</span>
          </h2>

          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">App Name</span>
              <span className="font-semibold text-slate-100">[ FX Prompty ]</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Creator</span>
              <a
                href="https://github.com/himanshupandit566-alt"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-purple-400 hover:underline"
              >
                Himanshu Pandey
              </a>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Tagline</span>
              <span className="text-slate-300 italic">Discover. Copy. Create.</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Build Version</span>
              <span className="font-mono text-purple-400">1.0.0 Production</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">PWA &amp; Offline Support</span>
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Local Authentication</span>
              <span className="text-slate-300">Client-Side Zero-Login</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Compatible Models</span>
              <span className="text-slate-300 text-right">Midjourney v6, Flux.1, DALL-E 3, SDXL</span>
            </div>
          </div>
        </div>

        {/* Security & Architecture Note */}
        <div className="bg-dark-900/50 border border-slate-800/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-400">
          <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            [ FX Prompty ] runs securely in your client browser. Created with passion by Himanshu Pandey. No personal data, generation history, or saved favorites are transmitted to third-party tracking services.
          </p>
        </div>
      </div>
    </div>
  );
};
