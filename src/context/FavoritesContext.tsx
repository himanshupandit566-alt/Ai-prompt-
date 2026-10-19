import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PromptItem } from '../types/prompt';
import { INITIAL_PROMPTS } from '../data/prompts';

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

const FAVORITES_STORAGE_KEY = 'promptverse_favorites_v1';
const CUSTOM_PROMPTS_STORAGE_KEY = 'promptverse_custom_prompts_v1';

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Favorites persistence
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

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

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch (e) {
      console.warn('Failed to save favorites to localStorage', e);
    }
  }, [favorites]);

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
