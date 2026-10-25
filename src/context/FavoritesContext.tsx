import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PromptItem, CategoryName, AspectRatio } from '../types/prompt';
import { INITIAL_PROMPTS } from '../data/prompts';
import { useAuth } from './AuthContext';
import { db, collection, onSnapshot, doc, setDoc, deleteDoc } from '../firebase';

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
  isFirestoreLoading: boolean;
  firestorePromptsCount: number;
  toasts: ToastInfo[];
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;
}

const CUSTOM_PROMPTS_STORAGE_KEY = 'promptverse_custom_prompts_v1';

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

/**
 * Robust converter to normalize any Firestore document into a valid PromptItem.
 * Gracefully handles alternative field naming conventions (imageUrl vs thumbnailUrl vs image,
 * promptText vs prompt, Timestamp vs Date string vs number).
 */
const mapFirestoreDocToPrompt = (id: string, data: any): PromptItem => {
  // Title
  const title = (data.title || data.name || 'Untitled AI Prompt').trim();

  // Image URL: handle imageUrl, image, thumbnailUrl, previewUrl, photoURL, url
  const rawImage =
    data.imageUrl ||
    data.image ||
    data.thumbnailUrl ||
    data.previewUrl ||
    data.photoURL ||
    data.url ||
    '';
  const defaultImage =
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80';
  const finalImage =
    typeof rawImage === 'string' && rawImage.trim() ? rawImage.trim() : defaultImage;

  // Prompt text: handle prompt, promptText, prompt_text, text
  const prompt = (
    data.prompt ||
    data.promptText ||
    data.prompt_text ||
    data.text ||
    ''
  ).trim();

  // Negative prompt
  const negativePrompt = (
    data.negativePrompt ||
    data.negative_prompt ||
    data.negative ||
    ''
  ).trim() || undefined;

  // Category
  const category = (data.category || data.categoryName || 'Cinematic Portraits') as CategoryName;

  // Description
  const description = (
    data.description ||
    data.desc ||
    `High-quality AI generated visual prompt for ${category}`
  ).trim();

  // Aspect Ratio
  const aspectRatio = (data.aspectRatio || data.aspect_ratio || data.ratio || '4:5') as AspectRatio;

  // Compatible Tools
  let tools: string[] = ['Midjourney v6', 'Flux.1', 'DALL-E 3'];
  if (Array.isArray(data.compatibleTools)) {
    tools = data.compatibleTools;
  } else if (Array.isArray(data.tools)) {
    tools = data.tools;
  } else if (typeof data.compatibleTools === 'string') {
    tools = data.compatibleTools.split(',').map((s: string) => s.trim()).filter(Boolean);
  } else if (typeof data.tools === 'string') {
    tools = data.tools.split(',').map((s: string) => s.trim()).filter(Boolean);
  }

  // Tags
  let tags: string[] = [];
  if (Array.isArray(data.tags)) {
    tags = data.tags.map((t: any) => String(t).trim().toLowerCase()).filter(Boolean);
  } else if (typeof data.tags === 'string') {
    tags = data.tags.split(',').map((t: string) => t.trim().toLowerCase()).filter(Boolean);
  }
  if (tags.length === 0) {
    tags = [category.toLowerCase().replace(/\s+/g, '-'), 'ai-art'];
  }

  // Featured
  const featured = Boolean(data.featured ?? false);

  // Popularity / Views
  const popularity =
    typeof data.popularity === 'number'
      ? data.popularity
      : typeof data.views === 'number'
      ? data.views
      : 5000;

  // CreatedAt / Timestamp normalization
  let createdAt = new Date().toISOString();
  if (data.createdAt) {
    if (typeof data.createdAt?.toDate === 'function') {
      createdAt = data.createdAt.toDate().toISOString();
    } else if (data.createdAt instanceof Date) {
      createdAt = data.createdAt.toISOString();
    } else if (typeof data.createdAt === 'string') {
      createdAt = data.createdAt;
    } else if (typeof data.createdAt === 'number') {
      createdAt = new Date(data.createdAt).toISOString();
    }
  } else if (data.timestamp) {
    if (typeof data.timestamp?.toDate === 'function') {
      createdAt = data.timestamp.toDate().toISOString();
    } else if (data.timestamp instanceof Date) {
      createdAt = data.timestamp.toISOString();
    } else if (typeof data.timestamp === 'string') {
      createdAt = data.timestamp;
    } else if (typeof data.timestamp === 'number') {
      createdAt = new Date(data.timestamp).toISOString();
    }
  } else if (data.created_at) {
    if (typeof data.created_at?.toDate === 'function') {
      createdAt = data.created_at.toDate().toISOString();
    } else if (typeof data.created_at === 'string') {
      createdAt = data.created_at;
    }
  }

  return {
    id: id || `firestore-${Date.now()}`,
    title,
    description,
    category,
    thumbnailUrl: finalImage,
    previewUrl: finalImage,
    prompt,
    negativePrompt,
    aspectRatio,
    compatibleTools: tools.length > 0 ? tools : ['Midjourney v6', 'Flux.1'],
    tags,
    featured,
    popularity,
    createdAt,
  };
};

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const currentUid = user?.uid || null;

  // Favorites state isolated per authenticated user
  const [favorites, setFavorites] = useState<string[]>([]);

  // Real-time Firestore prompts
  const [firestorePrompts, setFirestorePrompts] = useState<PromptItem[]>([]);
  const [isFirestoreLoading, setIsFirestoreLoading] = useState(true);

  // Custom user-added prompts (local cache/offline fallback)
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

  // ========================================================
  // REAL-TIME FIRESTORE LISTENER (onSnapshot on 'prompts')
  // ========================================================
  useEffect(() => {
    if (!db) {
      setIsFirestoreLoading(false);
      return;
    }

    try {
      const promptsCollectionRef = collection(db, 'prompts');

      const unsubscribe = onSnapshot(
        promptsCollectionRef,
        (snapshot) => {
          if (snapshot.empty) {
            setFirestorePrompts([]);
            setIsFirestoreLoading(false);
            return;
          }

          const parsedList: PromptItem[] = snapshot.docs.map((docSnap) => {
            return mapFirestoreDocToPrompt(docSnap.id, docSnap.data());
          });

          // Sort so newly added documents appear at the very top of the feed
          parsedList.sort((a, b) => {
            const timeA = new Date(a.createdAt).getTime() || 0;
            const timeB = new Date(b.createdAt).getTime() || 0;
            return timeB - timeA;
          });

          setFirestorePrompts(parsedList);
          setIsFirestoreLoading(false);
        },
        (error) => {
          console.warn('Real-time Firestore prompts listener notice:', error);
          // Graceful fallback: on permission error or offline, fallback to local prompts
          setIsFirestoreLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn('Error attaching Firestore prompts listener:', err);
      setIsFirestoreLoading(false);
    }
  }, []);

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
      setFavorites([]);
      return;
    }

    const userStorageKey = `favorites_${currentUid}`;
    try {
      const saved = localStorage.getItem(userStorageKey);
      if (saved) {
        setFavorites(JSON.parse(saved));
      } else {
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

  // Primary source: Firestore prompts collection.
  // Fallback: Local custom prompts + INITIAL_PROMPTS if Firestore is empty or offline.
  const fallbackPrompts: PromptItem[] = [...customPrompts, ...INITIAL_PROMPTS];
  const allPrompts: PromptItem[] = firestorePrompts.length > 0 ? firestorePrompts : fallbackPrompts;

  const addCustomPrompt = async (prompt: PromptItem) => {
    // 1. Update local custom prompts immediately
    setCustomPrompts((prev) => [prompt, ...prev.filter((p) => p.id !== prompt.id)]);
    showToast(`Prompt "${prompt.title}" published!`, 'success');

    // 2. Sync to Firestore 'prompts' collection if database is active
    if (db) {
      try {
        await setDoc(doc(db, 'prompts', prompt.id), {
          title: prompt.title,
          description: prompt.description,
          category: prompt.category,
          imageUrl: prompt.thumbnailUrl,
          thumbnailUrl: prompt.thumbnailUrl,
          previewUrl: prompt.previewUrl,
          prompt: prompt.prompt,
          promptText: prompt.prompt,
          negativePrompt: prompt.negativePrompt || '',
          aspectRatio: prompt.aspectRatio,
          compatibleTools: prompt.compatibleTools,
          tags: prompt.tags,
          featured: prompt.featured,
          popularity: prompt.popularity,
          createdAt: prompt.createdAt || new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Failed to sync new prompt to Firestore:', err);
      }
    }
  };

  const deletePrompt = async (id: string) => {
    setCustomPrompts((prev) => prev.filter((p) => p.id !== id));
    setFavorites((prev) => prev.filter((fId) => fId !== id));
    showToast('Prompt removed', 'info');

    if (db) {
      try {
        await deleteDoc(doc(db, 'prompts', id));
      } catch (err) {
        console.warn('Failed to delete prompt from Firestore:', err);
      }
    }
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
        isFirestoreLoading,
        firestorePromptsCount: firestorePrompts.length,
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
