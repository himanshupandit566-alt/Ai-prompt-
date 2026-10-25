import { CategoryInfo, CleanCategoryName } from '../types/prompt';

export const CATEGORIES: CategoryInfo[] = [
  {
    name: 'All',
    slug: 'all',
    description: 'Explore the complete collection of hand-crafted AI image prompts across all visual styles.',
    iconName: 'Sparkles',
  },
  {
    name: 'Portraits',
    slug: 'portraits',
    description: 'Dramatic lighting, realistic photography, romantic chemistry, and expressive human studio portraits.',
    iconName: 'User',
    featuredImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Anime & 3D',
    slug: 'anime-3d',
    description: 'Studio Ghibli style skies, vibrant cel-shading, isometric 3D renders, and gaming concept art.',
    iconName: 'Palette',
    featuredImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Fashion',
    slug: 'fashion',
    description: 'High-end runway styling, avant-garde couture, editorial magazine poses, and luxury aesthetics.',
    iconName: 'Shirt',
    featuredImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Fantasy',
    slug: 'fantasy',
    description: 'Mythical beasts, ethereal elven realms, glowing arcane magic, and otherworldly dreamscapes.',
    iconName: 'Wand2',
    featuredImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Wallpaper',
    slug: 'wallpaper',
    description: 'Ultra-wide 8K landscapes, serene natural vistas, sleek supercars, and high-res wallpapers.',
    iconName: 'Image',
    featuredImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
  },
];

/**
 * Normalizes any category string (from Firestore, legacy prompts, or input)
 * into one of the 5 clean categories:
 * 1. Portraits
 * 2. Anime & 3D
 * 3. Fashion
 * 4. Fantasy
 * 5. Wallpaper
 */
export const normalizeCategory = (category?: string | null): CleanCategoryName => {
  if (!category) return 'Portraits';
  const clean = category.trim().toLowerCase();

  // Explicit mappings from requirements:
  // - 'Cinematic Portrait', 'Cinematic Portraits', 'Realistic Photography', 'Couple portraits', 'Romantic' -> 'Portraits'
  // - 'Anime', 'Gaming', '3d art' -> 'Anime & 3D'
  // - 'Luxury', 'Fashion' -> 'Fashion'
  // - 'Car', 'Natural', 'Wallpaper' -> 'Wallpaper'
  switch (clean) {
    case 'portraits':
    case 'portrait':
    case 'cinematic portrait':
    case 'cinematic portraits':
    case 'realistic photography':
    case 'couple portraits':
    case 'couple portrait':
    case 'romantic':
    case 'professional profile':
    case 'vintage':
    case 'festival':
      return 'Portraits';

    case 'anime & 3d':
    case 'anime and 3d':
    case 'anime':
    case 'gaming':
    case '3d art':
    case '3d':
    case '3d-art':
      return 'Anime & 3D';

    case 'fashion':
    case 'luxury':
      return 'Fashion';

    case 'fantasy':
      return 'Fantasy';

    case 'wallpaper':
    case 'wallpapers':
    case 'car':
    case 'cars':
    case 'natural':
    case 'nature':
      return 'Wallpaper';
  }

  // Fallback pattern matching for loose / edge case strings:
  if (
    clean.includes('portrait') ||
    clean.includes('photo') ||
    clean.includes('romantic') ||
    clean.includes('couple') ||
    clean.includes('profile') ||
    clean.includes('vintage') ||
    clean.includes('festival')
  ) {
    return 'Portraits';
  }

  if (
    clean.includes('anime') ||
    clean.includes('gaming') ||
    clean.includes('game') ||
    clean.includes('3d') ||
    clean.includes('cgi')
  ) {
    return 'Anime & 3D';
  }

  if (
    clean.includes('fashion') ||
    clean.includes('luxury') ||
    clean.includes('couture')
  ) {
    return 'Fashion';
  }

  if (
    clean.includes('wallpaper') ||
    clean.includes('car') ||
    clean.includes('nature') ||
    clean.includes('natural') ||
    clean.includes('landscape')
  ) {
    return 'Wallpaper';
  }

  if (
    clean.includes('fantasy') ||
    clean.includes('magic') ||
    clean.includes('myth')
  ) {
    return 'Fantasy';
  }

  // Safe default
  return 'Portraits';
};
