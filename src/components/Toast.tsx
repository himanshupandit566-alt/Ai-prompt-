import React from 'react';
import { useFavorites } from '../context/FavoritesContext';
import { CheckCircle2, Info, AlertTriangle, AlertCircle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useFavorites();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:w-96 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => {
        let Icon = CheckCircle2;
        let borderClass = 'border-purple-500/40 bg-white/95 dark:bg-dark-900/95 text-slate-900 dark:text-slate-100 shadow-xl shadow-purple-950/10 dark:shadow-glow-purple';
        let iconColor = 'text-purple-600 dark:text-purple-400';

        if (toast.type === 'info') {
          Icon = Info;
          borderClass = 'border-blue-500/40 bg-white/95 dark:bg-dark-900/95 text-slate-900 dark:text-slate-100 shadow-xl shadow-blue-950/10 dark:shadow-glow-blue';
          iconColor = 'text-blue-600 dark:text-blue-400';
        } else if (toast.type === 'warning') {
          Icon = AlertTriangle;
          borderClass = 'border-amber-500/40 bg-white/95 dark:bg-dark-900/95 text-slate-900 dark:text-slate-100 shadow-xl';
          iconColor = 'text-amber-500 dark:text-amber-400';
        } else if (toast.type === 'error') {
          Icon = AlertCircle;
          borderClass = 'border-rose-500/40 bg-white/95 dark:bg-dark-900/95 text-slate-900 dark:text-slate-100 shadow-xl';
          iconColor = 'text-rose-500 dark:text-rose-400';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-2xl border backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${borderClass}`}
          >
            <div className="flex items-center gap-3">
              <Icon className={`w-5 h-5 shrink-0 ${iconColor}`} />
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
