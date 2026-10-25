export type AspectRatio = '1:1' | '4:5' | '3:4' | '9:16' | '16:9' | '2:3' | '3:2' | '21:9';

export type CleanCategoryName =
  | 'Portraits'
  | 'Anime & 3D'
  | 'Fashion'
  | 'Fantasy'
  | 'Wallpaper';

export type CategoryName =
  | 'All'
  | CleanCategoryName
  // Legacy categories retained for backward compatibility:
  | 'Cinematic Portraits'
  | 'Realistic Photography'
  | 'Couple Portraits'
  | 'Romantic'
  | 'Anime'
  | 'Gaming'
  | '3D Art'
  | 'Luxury'
  | 'Cars'
  | 'Nature'
  | 'Wallpapers'
  | 'Vintage'
  | 'Professional Profile'
  | 'Festival'
  | (string & {});

export interface PromptItem {
  id: string;
  title: string;
  description: string;
  category: CategoryName;
  thumbnailUrl: string;
  previewUrl: string;
  prompt: string;
  negativePrompt?: string;
  aspectRatio: AspectRatio;
  compatibleTools: string[];
  tags: string[];
  featured: boolean;
  popularity: number;
  createdAt: string;
}

export type SortOption = 'latest' | 'popular' | 'alphabetical' | 'featured';

export interface CategoryInfo {
  name: CategoryName;
  slug: string;
  description: string;
  iconName: string;
  featuredImage?: string;
}
