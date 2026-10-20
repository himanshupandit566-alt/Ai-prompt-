import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PromptItem } from '../types/prompt';
import { INITIAL_PROMPTS } from '../data/prompts';
import { useAuth } from './AuthContext';

interface ToastInfo {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
}

interface FavoritesContextType {
  favorites: string[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  allPrompts: PromptItem[];
  addCustomPrompt: (prompt: PromptItem) => void;
  deletePrompt: (id: string) => void;
  resetPromptsToDefault: () => void;
  toasts: ToastInfo[];
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;
}

const CUSTOM_PROMPTS_STORAGE_KEY = 'promptverse_custom_prompts_v1';

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const currentUid = user?.uid || null;

  // Favorites state isolated per authenticated user
  const [favorites, setFavorites] = useState<string[]>([]);

  // Custom user-added prompts
  const [customPrompts, setCustomPrompts] = useState<PromptItem[]>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_PROMPTS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastInfo[]>([]);

  // Purge any legacy global dummy favorites key to prevent data leakage across accounts
  useEffect(() => {
    try {
      localStorage.removeItem('promptverse_favorites_v1');
    } catch {
      // ignore
    }
  }, []);

  // Sync favorites when active user changes (Login / Logout / Account Switch)
  useEffect(() => {
    if (!currentUid) {
      // Logout or unauthenticated: clean previous user's state so count starts at '0'
      setFavorites([]);
      return;
    }

    // Authenticated user: load from their unique storage key `favorites_${currentUser.uid}`
    const userStorageKey = `favorites_${currentUid}`;
    try {
      const saved = localStorage.getItem(userStorageKey);
      if (saved) {
        setFavorites(JSON.parse(saved));
      } else {
        // Fresh user account starts with 0 items
        setFavorites([]);
      }
    } catch (e) {
      console.warn('Failed to load favorites for user:', currentUid, e);
      setFavorites([]);
    }
  }, [currentUid]);

  // Persist user-specific favorites whenever favorites array updates
  useEffect(() => {
    if (!currentUid) return;
    try {
      const userStorageKey = `favorites_${currentUid}`;
      localStorage.setItem(userStorageKey, JSON.stringify(favorites));
    } catch (e) {
      console.warn('Failed to save favorites to localStorage', e);
    }
  }, [favorites, currentUid]);

  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_PROMPTS_STORAGE_KEY, JSON.stringify(customPrompts));
    } catch (e) {
      console.warn('Failed to save custom prompts to localStorage', e);
    }
  }, [customPrompts]);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 3200);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const isFavorite = (id: string) => favorites.includes(id);

  const toggleFavorite = (id: string) => {
    if (!currentUid) {
      showToast('Favorites save karne ke liye pehle Sign In karein! 🔒', 'warning');
      return;
    }

    setFavorites((prev) => {
      if (prev.includes(id)) {
        showToast('Removed from Favorites', 'info');
        return prev.filter((item) => item !== id);
      } else {
        showToast('Saved to Favorites! ❤️', 'success');
        return [...prev, id];
      }
    });
  };

  const allPrompts: PromptItem[] = [...customPrompts, ...INITIAL_PROMPTS];

  const addCustomPrompt = (prompt: PromptItem) => {
    setCustomPrompts((prev) => [prompt, ...prev.filter((p) => p.id !== prompt.id)]);
    showToast(`Prompt "${prompt.title}" published!`, 'success');
  };

  const deletePrompt = (id: string) => {
    setCustomPrompts((prev) => prev.filter((p) => p.id !== id));
    setFavorites((prev) => prev.filter((fId) => fId !== id));
    showToast('Prompt removed', 'info');
  };

  const resetPromptsToDefault = () => {
    setCustomPrompts([]);
    localStorage.removeItem(CUSTOM_PROMPTS_STORAGE_KEY);
    showToast('Reset to default library', 'info');
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isFavorite,
        toggleFavorite,
        allPrompts,
        addCustomPrompt,
        deletePrompt,
        resetPromptsToDefault,
        toasts,
        showToast,
        removeToast,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = (): FavoritesContextType => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
